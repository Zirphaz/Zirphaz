require("dotenv").config();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value.trim();
}

function optionalEnv(name, fallback = "") {
  return (process.env[name] || fallback).trim();
}

function parseCategoryOptions(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [id, ...nameParts] = item.split(":");
      return {
        id: id.trim(),
        name: (nameParts.join(":").trim() || id.trim()).slice(0, 100)
      };
    })
    .filter((item) => item.id);
}

module.exports = {
  token: requiredEnv("DISCORD_TOKEN"),
  clientId: requiredEnv("CLIENT_ID"),
  guildId: requiredEnv("GUILD_ID"),
  supportRoleId: requiredEnv("SUPPORT_ROLE_ID"),
  ticketCategoryId: requiredEnv("TICKET_CATEGORY_ID"),
  transferCategories: parseCategoryOptions(optionalEnv("TRANSFER_CATEGORY_IDS")),
  ticketTypeCategories: Object.fromEntries(
    parseCategoryOptions(optionalEnv("TICKET_TYPE_CATEGORY_IDS"))
      .map((category) => [category.name.toLowerCase(), category.id])
  ),
  ticketLogChannels: Object.fromEntries(
    parseCategoryOptions(optionalEnv("TICKET_LOG_CHANNEL_IDS"))
      .map((channel) => [channel.name.toLowerCase(), channel.id])
  ),
  ownerLogChannelId: optionalEnv("OWNER_LOG_CHANNEL_ID"),
  logChannelId: optionalEnv("LOG_CHANNEL_ID"),
  ticketPrefix: optionalEnv("TICKET_PREFIX", "ticket")
};
