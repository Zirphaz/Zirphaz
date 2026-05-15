const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("./config");

const commands = [
  new SlashCommandBuilder()
    .setName("painel-ticket")
    .setDescription("Envia o painel de atendimento configurado.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  new SlashCommandBuilder()
    .setName("config-painel")
    .setDescription("Edita o visual do painel de atendimento.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName("titulo")
        .setDescription("Título do painel.")
        .setMaxLength(256)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("descricao")
        .setDescription("Descrição do painel.")
        .setMaxLength(4000)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("imagem_url")
        .setDescription("URL direta de imagem ou GIF para o banner do painel.")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("imagem_arquivo")
        .setDescription("Envie uma imagem ou GIF para o banner do painel.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("miniatura_url")
        .setDescription("URL direta de imagem ou GIF para a miniatura.")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("miniatura_arquivo")
        .setDescription("Envie uma imagem ou GIF para a miniatura.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("cor")
        .setDescription("Cor hexadecimal do painel. Exemplo: #00A86B.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("rodape")
        .setDescription("Texto do rodapé do painel.")
        .setMaxLength(2048)
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("limpar_imagem")
        .setDescription("Remove o banner atual do painel.")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("limpar_miniatura")
        .setDescription("Remove a miniatura atual do painel.")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Abre um ticket de atendimento.")
    .addStringOption((option) =>
      option
        .setName("motivo")
        .setDescription("Motivo do atendimento.")
        .setRequired(false)
    )
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(config.token);

async function main() {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: commands }
  );

  console.log("Comandos registrados com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
