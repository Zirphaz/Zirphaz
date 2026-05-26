const properties = [
  {
    id: "MC-101",
    title: "Apartamento 101",
    neighborhood: "São José",
    status: "disponivel",
    price: 1850,
    area: 62,
    rooms: 2,
    parking: 1,
    image: "assets/apt-living.png",
    description:
      "Unidade cadastrada para consulta. Confirme fotos, valor e condições com a equipe.",
    tags: ["são josé", "juazeiro do norte", "2 quartos", "vaga"]
  },
  {
    id: "MC-204",
    title: "Apartamento 204",
    neighborhood: "São José",
    status: "disponivel",
    price: 2200,
    area: 78,
    rooms: 3,
    parking: 2,
    image: "assets/apt-kitchen.png",
    description:
      "Apartamento disponível no residencial. Dados sujeitos à confirmação no atendimento.",
    tags: ["são josé", "juazeiro do norte", "3 quartos", "duas vagas"]
  },
  {
    id: "MC-312",
    title: "Apartamento 312",
    neighborhood: "São José",
    status: "alugado",
    price: 1450,
    area: 38,
    rooms: 1,
    parking: 0,
    image: "assets/apt-bedroom.png",
    description: "Unidade já alugada, mantida como referência de cadastro.",
    tags: ["são josé", "juazeiro do norte", "1 quarto"]
  },
  {
    id: "MC-418",
    title: "Apartamento 418",
    neighborhood: "São José",
    status: "disponivel",
    price: 2650,
    area: 91,
    rooms: 3,
    parking: 2,
    image: "assets/apt-living.png",
    description: "Unidade cadastrada como disponível. Consulte a equipe para confirmar visita.",
    tags: ["são josé", "juazeiro do norte", "3 quartos"]
  },
  {
    id: "MC-506",
    title: "Apartamento 506",
    neighborhood: "São José",
    status: "alugado",
    price: 1750,
    area: 55,
    rooms: 2,
    parking: 1,
    image: "assets/apt-kitchen.png",
    description: "Apartamento já locado, mantido apenas como referência.",
    tags: ["são josé", "juazeiro do norte", "2 quartos", "vaga"]
  },
  {
    id: "MC-619",
    title: "Apartamento 619",
    neighborhood: "São José",
    status: "disponivel",
    price: 1980,
    area: 48,
    rooms: 1,
    parking: 1,
    image: "assets/apt-bedroom.png",
    description: "Unidade disponível para consulta. Confirme valor atualizado antes da visita.",
    tags: ["são josé", "juazeiro do norte", "1 quarto", "vaga"]
  }
];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const contactConfig = {
  whatsappNumber: "",
  fallbackTarget: "#contato"
};

const grid = document.querySelector("#propertyGrid");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const filterButtons = document.querySelectorAll(".filter-button");
const propertySelect = document.querySelector("#propertySelect");
const form = document.querySelector("#contactForm");
const feedback = document.querySelector("#formFeedback");
const floatingWhatsApp = document.querySelector("#floatingWhatsApp");
const mobileWhatsAppQuery = window.matchMedia("(max-width: 720px)");

let currentFilter = "todos";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

function statusLabel(status) {
  return status === "disponivel" ? "Disponível" : "Alugado";
}

function updateMetrics() {
  const available = properties.filter((property) => property.status === "disponivel").length;
  const rented = properties.length - available;

  document.querySelector("#availableCount").textContent = available;
  document.querySelector("#rentedCount").textContent = rented;
  document.querySelector("#heroTotal").textContent = `${properties.length} apartamentos`;
  document.querySelector("#heroAvailable").textContent = `${available} disponíveis hoje`;
}

function propertyMatchesSearch(property, query) {
  const haystack = [
    property.id,
    property.title,
    property.neighborhood,
    property.description,
    ...property.tags
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function getVisibleProperties() {
  const query = searchInput.value.trim().toLowerCase();
  const sort = sortSelect.value;

  return properties
    .filter((property) => currentFilter === "todos" || property.status === currentFilter)
    .filter((property) => propertyMatchesSearch(property, query))
    .sort((a, b) => {
      if (sort === "priceAsc") return a.price - b.price;
      if (sort === "priceDesc") return b.price - a.price;
      if (sort === "areaDesc") return b.area - a.area;
      return Number(b.status === "disponivel") - Number(a.status === "disponivel");
    });
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderProperties() {
  const visibleProperties = getVisibleProperties();
  grid.replaceChildren();

  if (!visibleProperties.length) {
    grid.append(
      createElement("div", "empty-state", "Nenhum apartamento encontrado com esses filtros.")
    );
    return;
  }

  const cards = visibleProperties.map((property) => {
    const card = createElement("article", "property-card");
    const media = createElement("div", "property-media");
    const image = document.createElement("img");
    image.src = property.image;
    image.alt = property.title;

    const badge = createElement(
      "span",
      `status-badge ${property.status}`,
      statusLabel(property.status)
    );
    const note = createElement("span", "photo-note", "substituir por foto real");
    media.append(image, badge, note);

    const content = createElement("div", "property-content");
    const topline = createElement("div", "property-topline");
    topline.append(
      createElement("span", "", property.id),
      createElement("span", "", property.neighborhood)
    );

    const title = createElement("h3", "", property.title);
    const description = createElement("p", "", property.description);

    const features = createElement("div", "features");
    features.setAttribute("aria-label", "Características");
    features.append(
      createElement("span", "", `${property.area} m²`),
      createElement("span", "", `${property.rooms} quarto${property.rooms > 1 ? "s" : ""}`),
      createElement(
        "span",
        "",
        property.parking ? `${property.parking} vaga${property.parking > 1 ? "s" : ""}` : "sem vaga"
      )
    );

    const price = createElement("div", "price");
    price.append(
      createElement("strong", "", money.format(property.price)),
      createElement("small", "", "mensal")
    );

    const action = createElement(
      "button",
      "card-action",
      property.status === "disponivel" ? "Tenho interesse" : "Já alugado"
    );
    action.type = "button";
    action.dataset.property = property.id;
    action.disabled = property.status === "alugado";

    content.append(topline, title, description, features, price, action);
    card.append(media, content);
    return card;
  });

  grid.append(...cards);

  document.querySelectorAll(".card-action:not(:disabled)").forEach((button) => {
    button.addEventListener("click", () => {
      propertySelect.value = button.dataset.property;
      updateWhatsAppLink();
      document.querySelector("#contato").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function fillPropertySelect() {
  const options = properties
    .filter((property) => property.status === "disponivel")
    .map((property) => {
      const option = document.createElement("option");
      option.value = property.id;
      option.textContent = `${property.id} - ${property.title}`;
      return option;
    });

  propertySelect.replaceChildren(...options);
}

function getSelectedPropertyLabel() {
  const selected = properties.find((property) => property.id === propertySelect.value);
  return selected ? `${selected.id} - ${selected.title}` : "uma unidade disponível";
}

function buildWhatsAppUrl(propertyLabel = getSelectedPropertyLabel()) {
  const message = `Olá, tenho interesse em alugar no Residencial Matilde Carreiro. Gostaria de informações sobre ${propertyLabel}.`;
  return `https://wa.me/${contactConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function updateWhatsAppLink() {
  if (!floatingWhatsApp) return;

  if (!contactConfig.whatsappNumber) {
    floatingWhatsApp.href = contactConfig.fallbackTarget;
    floatingWhatsApp.classList.add("is-disabled");
    floatingWhatsApp.setAttribute("aria-label", "Adicionar número oficial para ativar WhatsApp");
    return;
  }

  floatingWhatsApp.href = buildWhatsAppUrl();
  floatingWhatsApp.classList.remove("is-disabled");
  floatingWhatsApp.setAttribute("aria-label", "Falar com a equipe pelo WhatsApp");
}

function updateFloatingWhatsAppMobileState() {
  if (!floatingWhatsApp) return;

  const shouldShow = !mobileWhatsAppQuery.matches || window.scrollY > window.innerHeight * 0.55;
  floatingWhatsApp.classList.toggle("is-mobile-visible", shouldShow);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderProperties();
  });
});

searchInput.addEventListener("input", renderProperties);
sortSelect.addEventListener("change", renderProperties);
propertySelect.addEventListener("change", updateWhatsAppLink);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get("name").toString().trim();
  const phone = data.get("phone").toString().trim();
  const property = data.get("property");
  const bestTime = data.get("bestTime");

  feedback.textContent = `${name}, seu interesse no aluguel ${property} foi registrado com o WhatsApp ${phone}. Melhor horário para retorno: ${bestTime}. Em um site publicado, esse envio iria para a equipe de atendimento.`;
  form.reset();
  fillPropertySelect();
  updateWhatsAppLink();
});

updateMetrics();
fillPropertySelect();
renderProperties();
updateWhatsAppLink();
updateFloatingWhatsAppMobileState();

window.addEventListener("scroll", updateFloatingWhatsAppMobileState, { passive: true });
window.addEventListener("resize", updateFloatingWhatsAppMobileState);
mobileWhatsAppQuery.addEventListener("change", updateFloatingWhatsAppMobileState);

if (!window.location.hash) {
  window.scrollTo(0, 0);
}
