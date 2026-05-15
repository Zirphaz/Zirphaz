const fs = require("fs");
const path = require("path");
const {
  ChannelType,
  Client,
  GatewayIntentBits,
  PermissionFlagsBits
} = require("discord.js");
require("dotenv").config();

const envPath = path.join(__dirname, "..", ".env");

function getEnvValue(name) {
  return process.env[name] || "";
}

function upsertEnv(values) {
  const current = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  const lines = current.split(/\r?\n/).filter((line) => line.trim() !== "");
  const seen = new Set();
  const next = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return line;

    const key = match[1];
    if (!(key in values)) return line;

    seen.add(key);
    return `${key}=${values[key]}`;
  });

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      next.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(envPath, `${next.join("\n")}\n`, "utf8");
}

function isPlaceholder(value) {
  return !value ||
    value.includes("coloque_") ||
    value.includes("id_do_") ||
    value.includes("cole_o_");
}

function findCategory(guild, names) {
  return guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildCategory && names.includes(channel.name)
  );
}

function findTextChannel(guild, names) {
  return guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildText && names.includes(channel.name)
  );
}

async function main() {
  const token = getEnvValue("DISCORD_TOKEN");
  if (isPlaceholder(token)) {
    throw new Error("Preencha DISCORD_TOKEN no .env antes de rodar o setup.");
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  const ready = new Promise((resolve) => client.once("ready", resolve));
  await client.login(token);
  await ready;

  const guildIdFromEnv = getEnvValue("GUILD_ID");
  let guild = null;

  if (!isPlaceholder(guildIdFromEnv)) {
    guild = await client.guilds.fetch(guildIdFromEnv).catch(() => null);
  } else if (client.guilds.cache.size === 1) {
    guild = client.guilds.cache.first();
  }

  if (!guild) {
    const guilds = client.guilds.cache.map((item) => `${item.name}: ${item.id}`).join("\n");
    console.log("Não consegui escolher o servidor automaticamente.");
    console.log("Servidores onde o bot esta:");
    console.log(guilds || "Nenhum servidor encontrado.");
    console.log("Coloque o ID do servidor em GUILD_ID no .env e rode npm run setup de novo.");
    client.destroy();
    return;
  }

  const me = await guild.members.fetchMe();
  const owner = await guild.fetchOwner();
  const ownerId = owner.id;
  const needed = [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles
  ];

  const missing = needed.filter((permission) => !me.permissions.has(permission));
  if (missing.length > 0) {
    throw new Error("O bot precisa das permissões Gerenciar Canais e Gerenciar Cargos.");
  }

  const supportRole = guild.roles.cache.find((role) => role.name === "Atendimento") ||
    await guild.roles.create({
      name: "Atendimento",
      color: 0x2f80ed,
      reason: "Setup automatico do bot de atendimento"
    });

  const category = guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildCategory && channel.name === "Tickets"
  ) || await guild.channels.create({
    name: "Tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: supportRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ],
    reason: "Setup automatico do bot de atendimento"
  });

  const ticketTypes = [
    { key: "suporte", name: "Tickets - Suporte", aliases: ["Tickets - Dúvidas", "Tickets - Duvidas"] },
    { key: "doacoes", name: "Tickets - Doações", aliases: ["Tickets - Doação", "Tickets - Doacao"] },
    { key: "bug", name: "Tickets - Bug", aliases: ["Tickets - Bugs"] },
    { key: "denuncia", name: "Tickets - Denúncia", aliases: ["Tickets - Denuncia"] },
    { key: "fale_owner", name: "Tickets - Fale Owner", aliases: ["Tickets - Dona"] },
    { key: "auxilio_lore", name: "Tickets - Auxilio Lore", aliases: ["Tickets - Roleplay"] }
  ];

  const typeCategories = [];
  for (const type of ticketTypes) {
    const names = [type.name, ...(type.aliases || [])];
    let typeCategory = findCategory(guild, names);

    const permissionOverwrites = type.key === "fale_owner"
      ? [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ]
      : [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: supportRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ];

    if (!typeCategory) {
      typeCategory = await guild.channels.create({
      name: type.name,
      type: ChannelType.GuildCategory,
      permissionOverwrites,
      reason: "Setup automatico do bot de atendimento"
      });
    } else if (typeCategory.name !== type.name) {
      await typeCategory.setName(type.name, "Ajuste de acentos do bot de atendimento");
    }

    typeCategories.push({ ...type, id: typeCategory.id });
  }

  const logChannel = guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildText && channel.name === "logs-tickets"
  ) || await guild.channels.create({
    name: "logs-tickets",
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: supportRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ],
    reason: "Setup automatico do bot de atendimento"
  });

  const logsCategory = findCategory(guild, ["Logs Tickets"]) || await guild.channels.create({
    name: "Logs Tickets",
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: supportRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      },
      {
        id: ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ],
    reason: "Setup automatico dos logs do bot de atendimento"
  });

  const logChannels = [];
  for (const type of ticketTypes) {
    const logName = `logs-${type.key.replace(/_/g, "-")}`;
    const logAliases = [
      `logs-${type.key}`,
      ...(type.key === "suporte" ? ["logs-duvidas"] : []),
      ...(type.key === "doacoes" ? ["logs-doacao"] : []),
      ...(type.key === "bug" ? ["logs-bugs"] : []),
      ...(type.key === "fale_owner" ? ["logs-dona"] : []),
      ...(type.key === "auxilio_lore" ? ["logs-roleplay"] : [])
    ];
    const overwrites = type.key === "fale_owner"
      ? [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ]
      : [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: supportRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: ownerId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ];

    const channel = findTextChannel(guild, [logName, ...logAliases]) || await guild.channels.create({
      name: logName,
      type: ChannelType.GuildText,
      parent: logsCategory.id,
      permissionOverwrites: overwrites,
      reason: "Setup automatico dos logs por categoria"
    });

    if (channel.name !== logName) {
      await channel.setName(logName, "Ajuste de nomes dos logs por categoria");
    }

    logChannels.push({ key: type.key, id: channel.id, name: channel.name });
  }

  const ownerLogChannel = findTextChannel(guild, ["logs-geral-dono"]) || await guild.channels.create({
    name: "logs-geral-dono",
    type: ChannelType.GuildText,
    parent: logsCategory.id,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: ownerId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages
        ]
      }
    ],
    reason: "Setup automatico do log geral privado do dono"
  });

  upsertEnv({
    GUILD_ID: guild.id,
    SUPPORT_ROLE_ID: supportRole.id,
    TICKET_CATEGORY_ID: category.id,
    TRANSFER_CATEGORY_IDS: typeCategories.map((item) => `${item.id}:${item.name}`).join(","),
    TICKET_TYPE_CATEGORY_IDS: typeCategories.map((item) => `${item.id}:${item.key}`).join(","),
    TICKET_LOG_CHANNEL_IDS: logChannels.map((item) => `${item.id}:${item.key}`).join(","),
    OWNER_LOG_CHANNEL_ID: ownerLogChannel.id,
    LOG_CHANNEL_ID: logChannel.id
  });

  console.log(`Servidor configurado: ${guild.name}`);
  console.log(`Cargo de atendimento: ${supportRole.name} (${supportRole.id})`);
  console.log(`Categoria de tickets: ${category.name} (${category.id})`);
  console.log("Categorias por tipo:");
  for (const item of typeCategories) {
    console.log(`- ${item.name} (${item.id})`);
  }
  console.log(`Canal de logs: ${logChannel.name} (${logChannel.id})`);
  console.log("Logs por categoria:");
  for (const item of logChannels) {
    console.log(`- ${item.name} (${item.id})`);
  }
  console.log(`Log geral privado do dono: ${ownerLogChannel.name} (${ownerLogChannel.id})`);
  console.log("IDs gravados no .env.");

  client.destroy();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
