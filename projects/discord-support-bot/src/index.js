const {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Partials
} = require("discord.js");
const config = require("./config");
const {
  closeConfirmRows,
  closeReasonModal,
  memberSelectRow,
  notifyModal,
  openCategoryRow,
  renameModal,
  ticketDescriptionModal,
  ticketPanelRow,
  transferCategoryRow
} = require("./components");
const {
  addMembersToTicket,
  claimTicket,
  closeReasons,
  closeTicket,
  createTicket,
  createVoiceChannel,
  notifyTicketMembers,
  removeMembersFromTicket,
  renameTicket,
  transferTicket
} = require("./tickets");
const {
  isImageUrl,
  parseColor,
  readSettings,
  updateSettings
} = require("./panel-settings");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await handleStringSelect(interaction);
      return;
    }

    if (interaction.isUserSelectMenu()) {
      await handleUserSelect(interaction);
      return;
    }

    if (interaction.isChannelSelectMenu()) {
      await transferTicket(interaction, interaction.values[0]);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  } catch (error) {
    console.error(error);
    const content = error.message || "Ocorreu um erro ao processar essa interação.";

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ content, ephemeral: true }).catch(() => null);
    }
  }
});

async function handleCommand(interaction) {
  if (interaction.commandName === "painel-ticket") {
    await interaction.reply({
      embeds: [buildPanelEmbed(interaction.guild)],
      components: [ticketPanelRow()]
    });
    return;
  }

  if (interaction.commandName === "config-painel") {
    await handlePanelConfigCommand(interaction);
    return;
  }

  if (interaction.commandName === "ticket") {
    const reason = interaction.options.getString("motivo") || "Atendimento";
    const { channel, created } = await createTicket(interaction.guild, interaction.user, {
      category: "suporte",
      description: reason
    });

    await interaction.reply({
      content: created ? `Seu ticket foi criado: ${channel}` : `Você já tem um ticket aberto: ${channel}`,
      ephemeral: true
    });
  }
}

function buildPanelEmbed(guild) {
  const settings = readSettings();
  const embed = new EmbedBuilder()
    .setColor(parseColor(settings.color))
    .setTitle(settings.title)
    .setDescription(settings.description)
    .addFields(
      { name: "Categorias", value: "Suporte\nDoações\nBug\nDenúncia\nFale Owner\nAuxilio Lore", inline: true },
      { name: "Como funciona", value: "Escolha a categoria, envie os detalhes e aguarde a equipe.", inline: true }
    )
    .setFooter({ text: settings.footer || guild.name })
    .setTimestamp();

  if (settings.imageUrl) {
    embed.setImage(settings.imageUrl);
  }

  if (settings.thumbnailUrl) {
    embed.setThumbnail(settings.thumbnailUrl);
  } else if (guild.iconURL()) {
    embed.setThumbnail(guild.iconURL({ size: 256 }));
  }

  return embed;
}

async function handlePanelConfigCommand(interaction) {
  const patch = {};
  const title = interaction.options.getString("titulo");
  const description = interaction.options.getString("descricao");
  const imageUrl = interaction.options.getString("imagem_url");
  const imageFile = interaction.options.getAttachment("imagem_arquivo");
  const thumbnailUrl = interaction.options.getString("miniatura_url");
  const thumbnailFile = interaction.options.getAttachment("miniatura_arquivo");
  const color = interaction.options.getString("cor");
  const footer = interaction.options.getString("rodape");
  const clearImage = interaction.options.getBoolean("limpar_imagem");
  const clearThumbnail = interaction.options.getBoolean("limpar_miniatura");

  if (title) patch.title = title.slice(0, 256);
  if (description) patch.description = description.slice(0, 4000);
  if (footer) patch.footer = footer.slice(0, 2048);

  if (color) {
    if (!/^#?[0-9a-fA-F]{6}$/.test(color)) {
      await interaction.reply({ content: "Use uma cor em hexadecimal, exemplo: #00A86B.", ephemeral: true });
      return;
    }
    patch.color = color.replace("#", "").toUpperCase();
  }

  if (clearImage) patch.imageUrl = "";
  if (clearThumbnail) patch.thumbnailUrl = "";

  const nextImageUrl = imageFile?.url || imageUrl;
  if (nextImageUrl) {
    if (!isImageUrl(nextImageUrl)) {
      await interaction.reply({ content: "A imagem precisa ser uma URL direta de PNG, JPG, WEBP ou GIF.", ephemeral: true });
      return;
    }
    patch.imageUrl = nextImageUrl;
  }

  const nextThumbnailUrl = thumbnailFile?.url || thumbnailUrl;
  if (nextThumbnailUrl) {
    if (!isImageUrl(nextThumbnailUrl)) {
      await interaction.reply({ content: "A miniatura precisa ser uma URL direta de PNG, JPG, WEBP ou GIF.", ephemeral: true });
      return;
    }
    patch.thumbnailUrl = nextThumbnailUrl;
  }

  updateSettings(patch);
  await interaction.reply({
    content: "Painel atualizado. Use `/painel-ticket` para enviar a nova versão.",
    embeds: [buildPanelEmbed(interaction.guild)],
    ephemeral: true
  });
}

async function handleButton(interaction) {
  switch (interaction.customId) {
    case "ticket:create": {
      await interaction.reply({
        content: "Selecione a categoria do seu atendimento.",
        components: [openCategoryRow()],
        ephemeral: true
      });
      break;
    }

    case "ticket:claim":
      await claimTicket(interaction);
      break;

    case "ticket:close":
      await interaction.showModal(closeReasonModal());
      break;

    case "ticket:transfer":
      await interaction.reply({
        content: "Selecione a categoria para transferir o ticket.",
        components: [transferCategoryRow(config.transferCategories)],
        ephemeral: true
      });
      break;

    case "ticket:voice":
      await createVoiceChannel(interaction);
      break;

    case "ticket:add_member":
      await interaction.reply({
        content: "Selecione quem deve entrar no ticket.",
        components: [memberSelectRow("ticket:add_member_select", "Escolha os membros")],
        ephemeral: true
      });
      break;

    case "ticket:remove_member":
      await interaction.reply({
        content: "Selecione quem deve sair do ticket.",
        components: [memberSelectRow("ticket:remove_member_select", "Escolha os membros")],
        ephemeral: true
      });
      break;

    case "ticket:rename":
      await interaction.showModal(renameModal(interaction.channel.name));
      break;

    case "ticket:notify":
      await interaction.showModal(notifyModal());
      break;

    case "ticket:close_confirm":
      await closeTicket(interaction);
      break;

    case "ticket:close_cancel":
      closeReasons.delete(interaction.channel.id);
      await interaction.update({
        content: "Fechamento cancelado.",
        components: []
      });
      break;

    default:
      await interaction.reply({ content: "Interação desconhecida.", ephemeral: true });
  }
}

async function handleStringSelect(interaction) {
  if (interaction.customId === "ticket:open_category_select") {
    await interaction.showModal(ticketDescriptionModal(interaction.values[0]));
    return;
  }

  if (interaction.customId === "ticket:transfer_select") {
    await transferTicket(interaction, interaction.values[0]);
  }
}

async function handleUserSelect(interaction) {
  if (interaction.customId === "ticket:add_member_select") {
    await addMembersToTicket(interaction, interaction.values);
    return;
  }

  if (interaction.customId === "ticket:remove_member_select") {
    await removeMembersFromTicket(interaction, interaction.values);
  }
}

async function handleModal(interaction) {
  if (interaction.customId.startsWith("ticket:open_description_modal:")) {
    const category = interaction.customId.split(":").pop();
    const description = interaction.fields.getTextInputValue("description");
    const { channel, created } = await createTicket(interaction.guild, interaction.user, {
      category,
      description
    });

    await interaction.reply({
      content: created ? `Seu ticket foi criado: ${channel}` : `Você já tem um ticket aberto: ${channel}`,
      ephemeral: true
    });
    return;
  }

  switch (interaction.customId) {
    case "ticket:rename_modal":
      await renameTicket(interaction, interaction.fields.getTextInputValue("name"));
      break;

    case "ticket:notify_modal":
      await notifyTicketMembers(interaction, interaction.fields.getTextInputValue("message"));
      break;

    case "ticket:close_reason_modal": {
      const reason = interaction.fields.getTextInputValue("reason") || "Sem motivo informado";
      closeReasons.set(interaction.channel.id, reason);
      await interaction.reply({
        content: `Motivo salvo: **${reason.slice(0, 180)}**\nConfirme para fechar este ticket.`,
        components: closeConfirmRows(),
        ephemeral: true
      });
      break;
    }

    default:
      await interaction.reply({ content: "Modal desconhecido.", ephemeral: true });
  }
}

client.login(config.token);
