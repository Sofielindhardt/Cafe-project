"use strict";

// ===== APP INITIALISERING =====
document.addEventListener("DOMContentLoaded", initApp);

let allGames = [];

// #1: Initialize the app - sæt event listeners og hent data
function initApp() {
  getGames(); // Hent spil data fra JSON fil

  document
    .querySelector("#search-input")
    .addEventListener("input", filterGames);
  document
    .querySelector("#number-players")
    .addEventListener("change", filterGames);
  document.querySelector("#time").addEventListener("change", filterGames);
  document.querySelector("#category").addEventListener("change", filterGames);

  // Event listener for clear-knappen - rydder alle filtre
  document
    .querySelector("#clear-filters")
    .addEventListener("click", clearAllFilters);
}

// #2: Fetch games from JSON file
async function getGames() {
  const response = await fetch(
    "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json"
  );
  allGames = await response.json();

  populateCategoryDropdown();
  displayGames(allGames);
}

// ===== VISNING AF SPIL =====
function displayGames(games) {
  const gameList = document.querySelector("#game-list");
  gameList.innerHTML = "";

  if (!games || games.length === 0) {
    gameList.innerHTML =
      '<p class="no-results">Ingen spil matchede dine filtre 😢</p>';
    return;
  }

  for (const game of games) {
    displayGame(game);
  }
}

function playersText(game) {
  const min = game.players?.min;
  const max = game.players?.max;
  if (min == null && max == null) return "";
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return min === max ? `${min} spillere` : `${min}-${max} spillere`;
  }
  if (Number.isFinite(min) && !Number.isFinite(max)) return `${min}+ spillere`;
  return "";
}
function playtimeText(game) {
  const m = Number(game.playtime);
  return Number.isFinite(m) ? `${m} min.` : "";
}

function displayGame(game) {
  const gameList = document.querySelector("#game-list");
  const gameHTML = /*html*/ `
    <article class="game-card" tabindex="0">
      <img src="${game.image}" alt="Poster of ${
    game.title
  }" class="game-poster"/>
      <div class="game-info">
        <h3>${game.title}</h3>
        <p class="game-genre">${String(game.genre ?? "")}</p>
        <p class="game-players"><strong>Spillere:</strong> ${playersText(
          game
        )}</p>
        <p class="game-playtime"><strong>Varighed:</strong> ${playtimeText(
          game
        )}</p>
         <p class="game-rating">⭐ ${game.rating ?? ""}</p>
      </div>
    </article>
  `;

  gameList.insertAdjacentHTML("beforeend", gameHTML);

  const newCard = gameList.lastElementChild;

  newCard.addEventListener("click", function () {
    showGameModal(game);
  });

  newCard.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showGameModal(game);
    }
  });
}

// ===== DROPDOWN OG MODAL FUNKTIONER =====
function populateCategoryDropdown() {
  const categorySelect = document.querySelector("#category");
  const categories = new Set();

  for (const game of allGames) {
    if (game.genre) categories.add(String(game.genre));
  }

  categorySelect.innerHTML = /*html*/ `<option value="all">Kategori</option>`;
  const sorted = [...categories].sort();
  for (const cat of sorted) {
    categorySelect.insertAdjacentHTML(
      "beforeend",
      /*html*/ `<option value="${cat}">${cat}</option>`
    );
  }
}

// #6: Modal
function showGameModal(game) {
  document.querySelector("#dialog-content").innerHTML = /*html*/ `
    <img src="${game.image}" alt="Poster af ${game.title}" class="game-poster">
    <div class="dialog-details">
      <h2>${game.title}</h2>
      <p class="game-genre">${String(game.genre ?? "")}</p>
      <p class="players"><strong>Spillere:</strong> ${playersText(game)}</p>
      <p class="playtime"><strong>Varighed:</strong> ${playtimeText(game)}</p>
      ${game.rating ? `<p class="game-rating">⭐ ${game.rating}</p>` : ""}
      ${
        game.description
          ? `<p class="game-description">${game.description}</p>`
          : ""
      }
    </div>
  `;
  document.querySelector("#game-dialog").showModal();
}

// ===== FILTER FUNKTIONER =====
// #7: Ryd alle filtre
function clearAllFilters() {
  document.querySelector("#search-input").value = "";
  document.querySelector("#number-players").value = "all";
  document.querySelector("#time").value = "all";
  document.querySelector("#category").value = "all";
  filterGames();
}

// #8: Komplet filtrering (søgefelt + 3 kategorier)
function filterGames() {
  const searchValue = document
    .querySelector("#search-input")
    .value.toLowerCase();
  const playersValue = document.querySelector("#number-players").value;
  const timeValue = document.querySelector("#time").value;
  const categoryValue = document.querySelector("#category").value;

  let filtered = allGames.slice();

  // 1) Søg i titel
  if (searchValue) {
    filtered = filtered.filter((g) =>
      g.title?.toLowerCase().includes(searchValue)
    );
  }

  // 2) Antal spillere — brug JSONs {min,max}
  if (playersValue !== "all") {
    let wantMin, wantMax;
    if (playersValue.endsWith("+")) {
      wantMin = parseInt(playersValue, 10);
      wantMax = Infinity;
    } else if (playersValue.includes("-")) {
      const [a, b] = playersValue.split("-").map((n) => parseInt(n, 10));
      wantMin = a;
      wantMax = b;
    } else {
      const n = parseInt(playersValue, 10);
      wantMin = n;
      wantMax = n;
    }

    filtered = filtered.filter((g) => {
      const haveMin = g.players?.min ?? -Infinity;
      const haveMax = g.players?.max ?? Infinity;

      return !(wantMax < haveMin || haveMax < wantMin);
    });
  }

  if (timeValue !== "all") {
    if (timeValue.endsWith("+")) {
      const n = parseInt(timeValue, 10);
      filtered = filtered.filter((g) => Number(g.playtime) >= n);
    } else {
      const n = parseInt(timeValue, 10);

      filtered = filtered.filter((g) => Number(g.playtime) === n);
    }
  }

  // 4) Kategori/genre — streng i JSON
  if (categoryValue !== "all") {
    filtered = filtered.filter((g) => String(g.genre) === categoryValue);
  }

  displayGames(filtered);
}
