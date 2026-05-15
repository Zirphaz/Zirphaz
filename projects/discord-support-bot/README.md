# Discord Support Ticket Bot

Bot de atendimento para Discord criado em Node.js com Discord.js, voltado para comunidades, lojas e servidores que precisam organizar suporte por tickets.

## Objetivo

Centralizar pedidos de suporte em canais privados, com categorias, permissao para equipe, logs e acoes administrativas dentro do proprio Discord. O projeto demonstra integracao com API externa, uso de variaveis de ambiente, automacao de setup, componentes interativos e preparo para deploy.

## Recursos

- Painel de abertura de ticket com titulo, descricao, cor, banner, GIF e miniatura configuraveis.
- Categorias de atendimento como suporte, doacoes, bug, denuncia, fale owner e auxilio lore.
- Criacao de canais privados para usuario e equipe de suporte.
- Botoes para assumir, fechar, transferir, criar call, adicionar/remover membros, renomear e notificar.
- Logs por categoria e log geral privado para o owner.
- Envio de DM ao usuario quando o ticket e fechado.
- Script de setup para preparar servidor, categorias e canais.
- Suporte a deploy com Docker, Railway, Render, Pterodactyl ou VPS com PM2.

## Stack

- Node.js
- Discord.js
- dotenv
- JSON para persistencia simples de configuracao visual
- Docker / Procfile para hospedagem

## Estrutura

```text
src/
  index.js             # inicializacao do bot e eventos principais
  config.js            # leitura e validacao de variaveis de ambiente
  deploy-commands.js   # registro de comandos slash
  setup-server.js      # assistente de configuracao do servidor
  tickets.js           # fluxo de tickets e acoes administrativas
  components.js        # componentes interativos do Discord
  panel-settings.js    # configuracao visual do painel
data/
  panel-settings.json  # configuracao inicial do painel
```

## Configuracao local

1. Instale as dependencias:

```bash
npm install
```

2. Copie o exemplo de ambiente:

```bash
copy .env.example .env
```

3. Preencha as variaveis do `.env`:

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
SUPPORT_ROLE_ID=
TICKET_CATEGORY_ID=
```

4. Configure o servidor:

```bash
npm run setup
```

5. Registre os comandos slash:

```bash
npm run deploy
```

6. Inicie o bot:

```bash
npm start
```

## Scripts

| Script | Funcao |
| --- | --- |
| `npm start` | Inicia o bot |
| `npm run setup` | Prepara estrutura do servidor |
| `npm run deploy` | Registra comandos slash |

## Deploy

Configure as variaveis de ambiente na plataforma escolhida. Nunca envie `.env` para o GitHub.

Docker:

```bash
docker build -t discord-support-bot .
docker run --env-file .env discord-support-bot
```

VPS com PM2:

```bash
npm install -g pm2
pm2 start npm --name discord-support-bot -- start
pm2 save
```

## Seguranca

O token do Discord e secreto. Se um token for exposto, gere outro no Discord Developer Portal e atualize as variaveis de ambiente da hospedagem.
