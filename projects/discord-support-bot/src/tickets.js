const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");
const config = require("./config");
const { ticketControlsRows } = require("./components");

const ticketTopics = new Map();
const closeReasons = new Map();

const ticketCategories = {
  suporte: {
    name: "Suporte",
    channel: "suporte",
    color: 0x2f80ed,
    summary: "Ajuda geral, dúvidas e atendimento padrão."
  },
  doacoes: {
    name: "Doações",
    channel: "doacoes",
    color: 0x00a86b,
    summary: "Pagamentos, benefícios, compras e doações da loja."
  },
  bug: {
    name: "Bug",
    channel: "bug",
    color: 0xed4245,
    summary: "Erros, falhas ou algo que não funcionou."
  },
  denuncia: {
    name: "Denúncia",
    channel: "denuncia",
    color: 0xe67e22,
    summary: "Denúncias de jogadores, condutas ou situações."
  },
  fale_owner: {
    name: "Fale Owner",
    channel: "fale-owner",
    color: 0xf1c40f,
    summary: "Atendimento privado diretamente com a dona do servidor.",
    ownerOnly: true
  },
  auxilio_lore: {
    name: "Auxilio Lore",
    channel: "auxilio-lore",
    color: 0x9b59b6,
    summary: "Ajuda com lore, história, personagens e RP."
  }
};

const legacyCategoryKeys = {
  doacao: "doacoes",
  duvidas: "suporte",
  bugs: "bug",
  roleplay: "auxilio_lore",
  dona: "fale_owner"
};

function normalizeCategoryKey(category) {
  return legacyCategoryKeys[category] || category || "suporte";
}

function normalizeChannelName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90) || "ticket";
}

function buildTopic(ownerId, claimedBy = "none", category = "suporte") {
  return `ticketOwner=${ownerId}; claimedBy=${claimedBy}; category=${normalizeCategoryKey(category)}`;
}

function getTopic(channel) {
  return channel.topic || ticketTopics.get(channel.id) || "";
}

function getTopicValue(channel, key) {
  const match = getTopic(channel).match(new RegExp(`${key}=([^;]+)`));
  return match ? match[1] : null;
}

function isTicketChannel(channel) {
  return Boolean(getTopic(channel).includes("ticketOwner="));
}

function getTicketOwnerId(channel) {
  return getTopicValue(channel, "ticketOwner");
}

function getTicketClaimedById(channel) {
  return getTopicValue(channel, "claimedBy");
}

function getTicketCategoryKey(channel) {
  return normalizeCategoryKey(getTopicValue(channel, "category"));
}

function getTicketCategory(categoryKey) {
  return ticketCategories[normalizeCategoryKey(categoryKey)] || ticketCategories.suporte;
}

function getCategoryLogChannel(guild, categoryKey) {
  const normalized = normalizeCategoryKey(categoryKey);
  const channelId = config.ticketLogChannels[normalized] || config.logChannelId;
  return channelId ? guild.channels.cache.get(channelId) : null;
}

function getOwnerLogChannel(guild) {
  return config.ownerLogChannelId ? guild.channels.cache.get(config.ownerLogChannelId) : null;
}

async function sendLog(channel, embed) {
  if (channel?.isTextBased()) {
    await channel.send({ embeds: [embed] }).catch(() => null);
  }
}

function requireTicketChannel(interaction) {
  if (!isTicketChannel(interaction.channel)) {
    throw new Error("Este comando só pode ser usado dentro de um ticket.");
  }
}

function isSupportMember(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.has(config.supportRoleId);
}

function requireSupport(interaction) {
  if (!isSupportMember(interaction.member)) {
    throw new Error("Apenas a equipe de atendimento pode usar esta opção.");
  }
}

function ticketEmbed(owner, opener, categoryKey, description) {
  const category = getTicketCategory(categoryKey);
  return new EmbedBuilder()
    .setColor(category.color)
    .setTitle(`Ticket aberto: ${category.name}`)
    .setDescription([
      `${owner}, seu atendimento foi criado com sucesso.`,
      "A equipe vai analisar as informações e responder por aqui."
    ].join("\n"))
    .addFields(
      { name: "Aberto por", value: `${opener}`, inline: true },
      { name: "Categoria", value: category.name, inline: true },
      { name: "Status", value: "Aguardando atendimento", inline: true },
      { name: "Sobre esta categoria", value: category.summary },
      { name: "Descrição enviada", value: description.slice(0, 1024) }
    )
    .setFooter({ text: "Use os botões abaixo para gerenciar este atendimento." })
    .setTimestamp();
}

function buildTicketLogEmbed(action, data) {
  const category = getTicketCategory(data.categoryKey);
  const color = action === "aberto" ? category.color : 0xed4245;
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(action === "aberto" ? "Ticket aberto" : "Ticket fechado")
    .addFields(
      { name: "Canal", value: data.channelText || data.channelName, inline: true },
      { name: "Categoria", value: category.name, inline: true },
      { name: "Usuário", value: data.ownerId ? `<@${data.ownerId}>` : "Desconhecido", inline: true },
      { name: action === "aberto" ? "Aberto por" : "Fechado por", value: data.actorText, inline: true },
      { name: "Motivo/descrição", value: data.reason.slice(0, 1024) || "Não informado" }
    )
    .setTimestamp();
}

async function logTicketEvent(guild, categoryKey, embed) {
  await sendLog(getCategoryLogChannel(guild, categoryKey), embed);
  await sendLog(getOwnerLogChannel(guild), embed);
}

async function createTicket(guild, opener, options = {}) {
  const categoryKey = normalizeCategoryKey(options.category);
  const description = options.description || options.reason || "Sem descrição informada.";
  const category = getTicketCategory(categoryKey);

  const existing = guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildText &&
    getTopic(channel).includes(`ticketOwner=${opener.id}`)
  );

  if (existing) {
    return { channel: existing, created: false };
  }

  if (!/^\d{17,20}$/.test(config.supportRoleId)) {
    throw new Error("SUPPORT_ROLE_ID inválido no .env. Rode npm run setup novamente.");
  }

  const name = normalizeChannelName(`${config.ticketPrefix}-${category.channel}-${opener.username}`);
  const topic = buildTopic(opener.id, "none", categoryKey);
  const parent = config.ticketTypeCategories[categoryKey] || config.ticketCategoryId;
  const owner = category.ownerOnly ? await guild.fetchOwner().catch(() => null) : null;
  const ownerId = owner?.id || guild.ownerId;

  if (category.ownerOnly && !ownerId) {
    throw new Error("Não consegui identificar a dona do servidor para abrir este atendimento.");
  }

  const staffOverwrite = category.ownerOnly
    ? {
      id: ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles
      ]
    }
    : {
      id: config.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles
      ]
    };

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent,
    topic,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: opener.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      staffOverwrite
    ]
  });

  ticketTopics.set(channel.id, topic);
  await channel.send({
    content: category.ownerOnly
      ? `<@${opener.id}> <@${ownerId}>`
      : `<@${opener.id}> <@&${config.supportRoleId}>`,
    embeds: [ticketEmbed(`<@${opener.id}>`, `<@${opener.id}>`, categoryKey, description)],
    components: ticketControlsRows()
  });

  await logTicketEvent(guild, categoryKey, buildTicketLogEmbed("aberto", {
    categoryKey,
    channelText: `${channel}`,
    channelName: channel.name,
    ownerId: opener.id,
    actorText: `<@${opener.id}>`,
    reason: description
  }));

  return { channel, created: true };
}

async function claimTicket(interaction) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const currentClaim = getTicketClaimedById(interaction.channel);
  if (currentClaim && currentClaim !== "none") {
    await interaction.reply({
      content: `Este ticket já foi assumido por <@${currentClaim}>.`,
      ephemeral: true
    });
    return;
  }

  const ownerId = getTicketOwnerId(interaction.channel);
  const category = getTicketCategoryKey(interaction.channel);
  const topic = buildTopic(ownerId, interaction.user.id, category);
  await interaction.channel.setTopic(topic);
  ticketTopics.set(interaction.channel.id, topic);

  await interaction.reply({
    content: `Ticket assumido por ${interaction.user}.`,
    allowedMentions: { users: [interaction.user.id] }
  });
}

async function createVoiceChannel(interaction) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const ownerId = getTicketOwnerId(interaction.channel);
  const categoryKey = getTicketCategoryKey(interaction.channel);
  const category = getTicketCategory(categoryKey);
  const serverOwner = category.ownerOnly ? await interaction.guild.fetchOwner().catch(() => null) : null;
  const staffVoiceOverwrite = category.ownerOnly
    ? {
      id: serverOwner?.id || interaction.guild.ownerId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
    }
    : {
      id: config.supportRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
    };
  const existing = interaction.guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildVoice &&
    channel.name === `${interaction.channel.name}-call`
  );

  if (existing) {
    await interaction.reply({ content: `A call já existe: ${existing}`, ephemeral: true });
    return;
  }

  const voice = await interaction.guild.channels.create({
    name: `${interaction.channel.name}-call`,
    type: ChannelType.GuildVoice,
    parent: interaction.channel.parentId || config.ticketCategoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect]
      },
      {
        id: ownerId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]
      },
      staffVoiceOverwrite
    ]
  });

  await interaction.reply(`Call criada: ${voice}`);
}

async function addMembersToTicket(interaction, userIds) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const added = [];
  const missing = [];

  for (const userId of userIds) {
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) {
      missing.push(userId);
      continue;
    }

    await interaction.channel.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });

    const voice = interaction.guild.channels.cache.find((channel) =>
      channel.type === ChannelType.GuildVoice && channel.name === `${interaction.channel.name}-call`
    );

    if (voice) {
      await voice.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        Connect: true,
        Speak: true
      });
    }

    added.push(member);
  }

  const content = [
    added.length ? `${added.map(String).join(", ")} adicionado(s) ao ticket.` : "",
    missing.length ? `Não encontrei: ${missing.map((id) => `<@${id}>`).join(", ")}.` : ""
  ].filter(Boolean).join("\n") || "Nenhum membro foi adicionado.";

  await interaction.reply({ content, ephemeral: true });
}

async function removeMembersFromTicket(interaction, userIds) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const ownerId = getTicketOwnerId(interaction.channel);
  const removed = [];
  const blocked = [];

  for (const userId of userIds) {
    if (userId === ownerId) {
      blocked.push(userId);
      continue;
    }

    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    await interaction.channel.permissionOverwrites.delete(userId).catch(() => null);

    const voice = interaction.guild.channels.cache.find((channel) =>
      channel.type === ChannelType.GuildVoice && channel.name === `${interaction.channel.name}-call`
    );
    if (voice) {
      await voice.permissionOverwrites.delete(userId).catch(() => null);
    }

    removed.push(member || `<@${userId}>`);
  }

  const content = [
    removed.length ? `${removed.map(String).join(", ")} removido(s) do ticket.` : "",
    blocked.length ? `Não removi o dono do ticket: ${blocked.map((id) => `<@${id}>`).join(", ")}.` : ""
  ].filter(Boolean).join("\n") || "Nenhum membro foi removido.";

  await interaction.reply({ content, ephemeral: true });
}

async function renameTicket(interaction, rawName) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const oldName = interaction.channel.name;
  const name = normalizeChannelName(rawName);
  await interaction.channel.setName(name);

  const voice = interaction.guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildVoice && channel.name === `${oldName}-call`
  );

  if (voice) {
    await voice.setName(`${name}-call`);
  }

  await interaction.reply(`Ticket renomeado para ${interaction.channel}.`);
}

async function notifyTicketMembers(interaction, message) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const ownerId = getTicketOwnerId(interaction.channel);
  const users = new Set([ownerId]);
  for (const overwrite of interaction.channel.permissionOverwrites.cache.values()) {
    if (overwrite.type === 1 && overwrite.allow.has(PermissionFlagsBits.ViewChannel)) {
      users.add(overwrite.id);
    }
  }

  const mentions = [...users].filter(Boolean).map((id) => `<@${id}>`).join(" ");
  await interaction.reply({
    content: `${mentions}\n${message}`,
    allowedMentions: { users: [...users] }
  });
}

async function transferTicket(interaction, categoryId) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const category = interaction.guild.channels.cache.get(categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction.reply({ content: "Categoria inválida.", ephemeral: true });
    return;
  }

  await interaction.channel.setParent(categoryId, { lockPermissions: false });

  const voice = interaction.guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildVoice && channel.name === `${interaction.channel.name}-call`
  );
  if (voice) {
    await voice.setParent(categoryId, { lockPermissions: false });
  }

  await interaction.reply(`Ticket transferido para **${category.name}**.`);
}

async function closeTicket(interaction) {
  requireTicketChannel(interaction);
  requireSupport(interaction);

  const reason = closeReasons.get(interaction.channel.id) || "Sem motivo informado";
  closeReasons.delete(interaction.channel.id);

  const ownerId = getTicketOwnerId(interaction.channel);
  const categoryKey = getTicketCategoryKey(interaction.channel);
  const category = getTicketCategory(categoryKey);
  const channelName = interaction.channel.name;

  await logTicketEvent(interaction.guild, categoryKey, buildTicketLogEmbed("fechado", {
    categoryKey,
    channelText: channelName,
    channelName,
    ownerId,
    actorText: `${interaction.user}`,
    reason
  }));

  if (ownerId) {
    const user = await interaction.client.users.fetch(ownerId).catch(() => null);
    await user?.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("Seu ticket foi fechado")
          .setDescription(`Seu ticket de **${category.name}** no servidor **${interaction.guild.name}** foi fechado.`)
          .addFields(
            { name: "Fechado por", value: `${interaction.user}`, inline: true },
            { name: "Motivo", value: reason.slice(0, 1024) }
          )
          .setTimestamp()
      ]
    }).catch(() => null);
  }

  await interaction.reply("Ticket será fechado em 5 segundos.");

  const voice = interaction.guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildVoice && channel.name === `${interaction.channel.name}-call`
  );

  setTimeout(async () => {
    if (voice) {
      await voice.delete(`Ticket fechado por ${interaction.user.tag}`).catch(() => null);
    }
    await interaction.channel.delete(`Ticket fechado por ${interaction.user.tag}: ${reason}`).catch(() => null);
  }, 5000);
}

module.exports = {
  addMembersToTicket,
  claimTicket,
  closeReasons,
  closeTicket,
  createTicket,
  createVoiceChannel,
  getTicketOwnerId,
  isSupportMember,
  isTicketChannel,
  normalizeChannelName,
  notifyTicketMembers,
  removeMembersFromTicket,
  renameTicket,
  transferTicket
};
