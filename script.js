// ===== Configuração =====
const URL_LISTA = "https://pokeapi.co/api/v2/pokemon?limit=151"; // 151 originais (anos 90/2000)
const container = document.getElementById("cards");
const statusEl = document.getElementById("status");
const campoBusca = document.getElementById("busca");
const btnFavoritos = document.getElementById("btn-favoritos");

let pokemons = [];          // dados vindos da API
let somenteFavoritos = false;

// Favoritos ficam salvos no navegador (localStorage)
let favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");

// ===== 1) Consumo da API com fetch =====
async function carregarPokemons() {
  try {
    const resposta = await fetch(URL_LISTA);
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    const lista = await resposta.json();

    // A lista traz só nome e URL. Cada detalhe exige outro fetch.
    pokemons = await Promise.all(
      lista.results.map((item) => fetch(item.url).then((r) => r.json()))
    );

    statusEl.textContent = "";
    mostrarCards();
  } catch (erro) {
    console.error(erro);
    statusEl.textContent = "Não foi possível carregar os dados. Verifique sua conexão e recarregue a página.";
  }
}

// ===== 2) Criação dinâmica dos cards (DOM) =====
function criarCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  const numero = document.createElement("span");
  numero.className = "numero";
  numero.textContent = "#" + String(p.id).padStart(3, "0");

  const coracao = document.createElement("button");
  coracao.type = "button";
  coracao.className = "coracao" + (favoritos.includes(p.id) ? " ativo" : "");
  coracao.textContent = "♥";
  coracao.setAttribute("aria-label", "Favoritar " + p.name);
  coracao.addEventListener("click", () => alternarFavorito(p.id));

  const nome = document.createElement("h2");
  nome.textContent = p.name;

  const imagem = document.createElement("img");
  imagem.className = "imagem";
  imagem.src = p.sprites.other["official-artwork"].front_default || p.sprites.front_default;
  imagem.alt = "Imagem de " + p.name;
  imagem.loading = "lazy";

  const tipos = document.createElement("div");
  tipos.className = "tipos";
  p.types.forEach((t) => {
    const tag = document.createElement("span");
    tag.className = "tipo t-" + t.type.name;
    tag.textContent = t.type.name;
    tipos.appendChild(tag);
  });

  const info = document.createElement("p");
  info.className = "info";
  info.textContent =
    "Altura: " + p.height / 10 + " m | Peso: " + p.weight / 10 + " kg\n" +
    "Habilidade: " + p.abilities[0].ability.name;
  info.style.whiteSpace = "pre-line";

  card.append(numero, coracao, nome, imagem, tipos, info);
  return card;
}

function mostrarCards() {
  const termo = campoBusca.value.trim().toLowerCase();
  const filtrados = pokemons.filter((p) =>
    p.name.includes(termo) && (!somenteFavoritos || favoritos.includes(p.id))
  );

  container.replaceChildren(); // limpa antes de redesenhar
  filtrados.forEach((p) => container.appendChild(criarCard(p)));

  statusEl.textContent = filtrados.length === 0 && pokemons.length > 0
    ? (somenteFavoritos ? "Você ainda não tem favoritos. Clique no ♥ de um card." : "Nenhum Pokémon encontrado.")
    : "";
}

// ===== 3) Interações =====
function alternarFavorito(id) {
  favoritos = favoritos.includes(id) ? favoritos.filter((f) => f !== id) : [...favoritos, id];
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  mostrarCards();
}

campoBusca.addEventListener("input", mostrarCards);
btnFavoritos.addEventListener("click", () => {
  somenteFavoritos = !somenteFavoritos;
  btnFavoritos.setAttribute("aria-pressed", somenteFavoritos);
  mostrarCards();
});

carregarPokemons();
