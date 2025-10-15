"use strict";

// ===== APP INITIALISERING =====
document.addEventListener("DOMContentLoaded", initApp);

// Global variabel til alle spil
let allGames = [];

// #1: Initialize the app - sæt event listeners og hent data
function initApp() {
  getGames(); // Hent spil data fra JSON fil

  // Event listeners for alle filtre - kører filterGames når brugeren ændrer noget
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

  populateCategoryDropdown(); // Udfyld dropdown med kategorier/genre fra data
  displayGames(allGames); // Vis alle spil ved start
}

// ===== VISNING AF SPIL =====
// #3: Display all games
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

// #4: Render a single game card and add event listeners
function displayGame(game) {
  const gameList = document.querySelector("#game-list");
  const genreText = Array.isArray(game.genre)
    ? game.genre.join(", ")
    : game.genre ?? "";

  const gameHTML = /*html*/ `
    <article class="game-card" tabindex="0">
      <img src="${game.image}" alt="Poster of ${
    game.title
  }" class="game-poster"/>
      <div class="game-info">
        <h3>${game.title}</h3>
        <p class="game-genre">${genreText}</p>
        <p class="game-players"><strong>Spillere:</strong> ${
          game.players ?? ""
        }</p>
        <p class="game-playtime"><strong>Varighed:</strong> ${
          game.playtime ?? ""
        }</p>
        ${game.rating ? `<p class="game-rating">⭐ ${game.rating}</p>` : ""}
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
// #5: Udfyld kategori-dropdown
function populateCategoryDropdown() {
  const categorySelect = document.querySelector("#category");
  const categories = new Set();

  for (const game of allGames) {
    const list = Array.isArray(game.genre) ? game.genre : [game.genre];
    for (const g of list) if (g) categories.add(g);
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
  const genreText = Array.isArray(game.genre)
    ? game.genre.join(", ")
    : game.genre ?? "";
  document.querySelector("#dialog-content").innerHTML = /*html*/ `
    <img src="${game.image}" alt="Poster af ${game.title}" class="game-poster">
    <div class="dialog-details">
      <h2>${game.title}</h2>
      <p class="game-genre">${genreText}</p>
      <p class="players"><strong>Spillere:</strong> ${game.players ?? ""}</p>
      <p class="playtime"><strong>Varighed:</strong> ${game.playtime ?? ""}</p>
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

// ===== HJÆLPERE TIL ROBUST MATCH =====
function parsePlayers(text) {
  // "2-6 spillere", "6+ spillere", "2 spillere"
  const t = String(text ?? "").toLowerCase();
  const nums = t.match(/\d+/g)?.map(Number) ?? [];
  if (t.includes("+") && nums.length >= 1)
    return { min: nums[0], max: Infinity };
  if (t.includes("-") && nums.length >= 2)
    return { min: nums[0], max: nums[1] };
  if (nums.length >= 1) return { min: nums[0], max: nums[0] };
  return { min: -Infinity, max: Infinity };
}
function parseMinutes(text) {
  // "ca. 30 min.", "90-120 min."
  const nums =
    String(text ?? "")
      .match(/\d+/g)
      ?.map(Number) ?? [];
  if (nums.length === 0) return { min: -Infinity, max: Infinity };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  nums.sort((a, b) => a - b);
  return { min: nums[0], max: nums[nums.length - 1] };
}
function overlaps(a, b) {
  return !(a.max < b.min || b.max < a.min);
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
  const playersValue = document.querySelector("#number-players").value; // "1-2","3","4","5","6+"
  const timeValue = document.querySelector("#time").value; // "20","30","40","45","60+"
  const categoryValue = document.querySelector("#category").value; // fx "Strategispil"

  let filtered = allGames.slice();

  // Søgetekst i titel
  if (searchValue) {
    filtered = filtered.filter((game) =>
      game.title?.toLowerCase().includes(searchValue)
    );
  }

  // Antal spillere (robust: overlap)
  if (playersValue !== "all") {
    const want = playersValue.endsWith("+")
      ? { min: parseInt(playersValue), max: Infinity }
      : playersValue.includes("-")
      ? {
          min: parseInt(playersValue.split("-")[0]),
          max: parseInt(playersValue.split("-")[1]),
        }
      : { min: parseInt(playersValue), max: parseInt(playersValue) };

    filtered = filtered.filter((game) =>
      overlaps(parsePlayers(game.players), want)
    );
  }

  // Varighed (robust: 60+ matcher 90-120 osv.)
  if (timeValue !== "all") {
    if (timeValue.endsWith("+")) {
      const n = parseInt(timeValue);
      filtered = filtered.filter(
        (game) => parseMinutes(game.playtime).max >= n
      );
    } else {
      const n = parseInt(timeValue);
      filtered = filtered.filter((game) => {
        const have = parseMinutes(game.playtime);
        return have.min <= n && n <= have.max;
      });
    }
  }

  // Kategori/genre
  if (categoryValue !== "all") {
    filtered = filtered.filter((game) => {
      const g = Array.isArray(game.genre) ? game.genre : [game.genre];
      return g.filter(Boolean).includes(categoryValue);
    });
  }

  displayGames(filtered);
}
