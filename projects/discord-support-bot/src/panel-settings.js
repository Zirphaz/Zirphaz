const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const settingsPath = path.join(dataDir, "panel-settings.json");

const defaultSettings = {
  title: "Bem-vindo ao Atendimento",
  description: [
    "Abra um ticket para falar com a equipe da loja.",
    "Escolha a categoria correta e descreva sua solicitação com detalhes para agilizar o atendimento."
  ].join("\n"),
  imageUrl: "",
  thumbnailUrl: "",
  color: "00A86B",
  footer: "Atendimento da loja"
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readSettings() {
  ensureDataDir();

  if (!fs.existsSync(settingsPath)) {
    writeSettings(defaultSettings);
    return { ...defaultSettings };
  }

  try {
    const saved = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return { ...defaultSettings, ...saved };
  } catch {
    return { ...defaultSettings };
  }
}

function writeSettings(settings) {
  ensureDataDir();
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf8");
}

function updateSettings(patch) {
  const current = readSettings();
  const next = { ...current, ...patch };
  writeSettings(next);
  return next;
}

function parseColor(rawColor) {
  const color = String(rawColor || defaultSettings.color).replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(color)) {
    return parseInt(defaultSettings.color, 16);
  }
  return parseInt(color, 16);
}

function isImageUrl(url) {
  if (!url) return false;
  return /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url) ||
    /^https?:\/\/cdn\.discordapp\.com\/.+/i.test(url) ||
    /^https?:\/\/media\.discordapp\.net\/.+/i.test(url);
}

module.exports = {
  defaultSettings,
  isImageUrl,
  parseColor,
  readSettings,
  updateSettings
};
