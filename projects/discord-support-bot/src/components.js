const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} = require("discord.js");

function ticketPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:create")
      .setLabel("Abrir Ticket")
      .setStyle(ButtonStyle.Success)
  );
}

function openCategoryRow() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("ticket:open_category_select")
      .setPlaceholder("Selecione o tipo de atendimento")
      .addOptions(
        {
          label: "Suporte",
          description: "Ajuda geral, dúvidas e atendimento padrão.",
          value: "suporte"
        },
        {
          label: "Doações",
          description: "Pagamentos, benefícios, compras e doações da loja.",
          value: "doacoes"
        },
        {
          label: "Bug",
          description: "Erros, falhas ou algo que não funcionou.",
          value: "bug"
        },
        {
          label: "Denúncia",
          description: "Denúncias de jogadores, condutas ou situações.",
          value: "denuncia"
        },
        {
          label: "Fale Owner",
          description: "Atendimento privado diretamente com a dona do servidor.",
          value: "fale_owner"
        },
        {
          label: "Auxilio Lore",
          description: "Ajuda com lore, história, personagens e RP.",
          value: "auxilio_lore"
        }
      )
  );
}

function ticketDescriptionModal(category) {
  return new ModalBuilder()
    .setCustomId(`ticket:open_description_modal:${category}`)
    .setTitle("Abrir ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Descreva seu atendimento")
          .setPlaceholder("Explique com detalhes o que você precisa.")
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(10)
          .setMaxLength(1500)
          .setRequired(true)
      )
    );
}

function ticketControlsRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("Assumir")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:close")
        .setLabel("Fechar")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket:transfer")
        .setLabel("Transferir")
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:voice")
        .setLabel("Criar Call")
        .setStyle(ButtonStyle.Success)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:add_member")
        .setLabel("Adicionar membro")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:remove_member")
        .setLabel("Remover membros")
        .setStyle(ButtonStyle.Secondary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:rename")
        .setLabel("Renomear")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:notify")
        .setLabel("Notificar membros")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function closeConfirmRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:close_confirm")
        .setLabel("Confirmar fechamento")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket:close_cancel")
        .setLabel("Cancelar")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function transferCategoryRow(categories) {
  if (categories.length > 0) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket:transfer_select")
        .setPlaceholder("Escolha a categoria")
        .addOptions(
          categories.slice(0, 25).map((category) => ({
            label: category.name,
            value: category.id
          }))
        )
    );
  }

  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId("ticket:transfer_channel_select")
      .setPlaceholder("Escolha a categoria")
      .setChannelTypes(ChannelType.GuildCategory)
  );
}

function memberSelectRow(customId, placeholder) {
  return new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .setMinValues(1)
      .setMaxValues(10)
  );
}

function renameModal(currentName) {
  return new ModalBuilder()
    .setCustomId("ticket:rename_modal")
    .setTitle("Renomear ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Novo nome do canal")
          .setPlaceholder("Ex: ticket-pagamento")
          .setValue(currentName.slice(0, 100))
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(90)
          .setRequired(true)
      )
    );
}

function notifyModal() {
  return new ModalBuilder()
    .setCustomId("ticket:notify_modal")
    .setTitle("Notificar membros")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("message")
          .setLabel("Mensagem")
          .setPlaceholder("Ex: Seu atendimento está aguardando resposta.")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(true)
      )
    );
}

function closeReasonModal() {
  return new ModalBuilder()
    .setCustomId("ticket:close_reason_modal")
    .setTitle("Fechar ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Motivo do fechamento")
          .setPlaceholder("Descreva o motivo")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setRequired(false)
      )
    );
}

module.exports = {
  closeConfirmRows,
  closeReasonModal,
  memberSelectRow,
  notifyModal,
  openCategoryRow,
  renameModal,
  ticketControlsRows,
  ticketDescriptionModal,
  ticketPanelRow,
  transferCategoryRow
};
