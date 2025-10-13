"use strict";

// ===== APP INITIALISERING =====
// Start app når DOM er loaded (hele HTML siden er færdig med at indlæse)
document.addEventListener("DOMContentLoaded", initApp);

// Global variabel til alle film - tilgængelig for alle funktioner
let allMovies = [];

// #1: Initialize the app - sæt event listeners og hent data
function initApp() {
  getMovies(); // Hent film data fra JSON fil

  // Event listeners for alle filtre - kører filterMovies når brugeren ændrer noget
  document
    .querySelector("#search-input")
    .addEventListener("input", filterMovies);
  document
    .querySelector("#genre-select")
    .addEventListener("change", filterMovies);
  document
    .querySelector("#sort-select")
    .addEventListener("change", filterMovies);
  document.querySelector("#year-from").addEventListener("input", filterMovies);
  document.querySelector("#year-to").addEventListener("input", filterMovies);
  document
    .querySelector("#rating-from")
    .addEventListener("input", filterMovies);
  document.querySelector("#rating-to").addEventListener("input", filterMovies);

  // Event listener for clear-knappen - rydder alle filtre
  document
    .querySelector("#clear-filters")
    .addEventListener("click", clearAllFilters);
}

// #2: Fetch movies from JSON file - asynkron funktion der henter data
async function getMovies() {
  // Hent data fra URL - await venter på svar før vi går videre
  const response = await fetch(
    "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/movies.json"
  );

  // Pars JSON til JS array og gem i global variabel, der er tilgængelig for alle funktioner
  allMovies = await response.json();

  populateGenreDropdown(); // Udfyld dropdown med genrer fra data
  displayMovies(allMovies); // Vis alle film ved start
}

// ===== VISNING AF FILM =====
// #3: Display all movies - vis en liste af film på siden
function displayMovies(movies) {
  const movieList = document.querySelector("#movie-list"); // Find container til film
  movieList.innerHTML = ""; // Ryd gammel liste (fjern alt HTML indhold)

  // Hvis ingen film matcher filtrene, vis en besked til brugeren
  if (movies.length === 0) {
    movieList.innerHTML =
      '<p class="no-results">Ingen film matchede dine filtre 😢</p>';
    return; // Stop funktionen her - return betyder "stop her og gå ikke videre"
  }

  // Loop gennem alle film og vis hver enkelt
  for (const movie of movies) {
    displayMovie(movie); // Kald displayMovie for hver film
  }
}

// #4: Render a single movie card and add event listeners - lav et film kort
function displayMovie(movie) {
  const movieList = document.querySelector("#movie-list"); // Find container til film

  // Byg HTML struktur dynamisk - template literal med ${} til at indsætte data
  const movieHTML = /*html*/ `
    <article class="movie-card" tabindex="0">
      <img src="${movie.image}" 
           alt="Poster of ${movie.title}" 
           class="movie-poster" />
      <div class="movie-info">
        <h3>${movie.title} <span class="movie-year">(${movie.year})</span></h3>
        <p class="movie-genre">${movie.genre.join(", ")}</p>
        <p class="movie-rating">⭐ ${movie.rating}</p>
        <p class="movie-director"><strong>Director:</strong> ${
          movie.director
        }</p>
      </div>
    </article>
  `;

  // Tilføj movie card til DOM (HTML) - insertAdjacentHTML sætter HTML ind uden at overskrive
  movieList.insertAdjacentHTML("beforeend", movieHTML);

  // Find det kort vi lige har tilføjet (det sidste element)
  const newCard = movieList.lastElementChild;

  // Tilføj click event til kortet - når brugeren klikker på kortet
  newCard.addEventListener("click", function () {
    showMovieModal(movie); // Vis modal med film detaljer
  });

  // Tilføj keyboard support (Enter og mellemrum) for tilgængelighed
  newCard.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // Forhindre scroll ved mellemrum
      showMovieModal(movie); // Vis modal med film detaljer
    }
  });
}

// ===== DROPDOWN OG MODAL FUNKTIONER =====
// #5: Udfyld genre-dropdown med alle unikke genrer fra data
function populateGenreDropdown() {
  const genreSelect = document.querySelector("#genre-select"); // Find genre dropdown
  const genres = new Set(); // Set fjerner automatisk dubletter

  // Samle alle unikke genrer fra alle film
  // Hver film kan have flere genrer (array), så vi løber gennem dem alle
  for (const movie of allMovies) {
    for (const genre of movie.genre) {
      genres.add(genre); // Set sikrer kun unikke værdier
    }
  }

  // Fjern gamle options undtagen 'Alle genrer' (reset dropdown)
  genreSelect.innerHTML = /*html*/ `<option value="all">Alle genrer</option>`;

  // Sortér genres alfabetisk og tilføj dem som options
  const sortedGenres = [...genres].sort(); // Konvertér Set til Array og sortér genrer
  for (const genre of sortedGenres) {
    genreSelect.insertAdjacentHTML(
      "beforeend",
      /*html*/ `<option value="${genre}">${genre}</option>`
    );
  }
}

// #6: Vis movie i modal dialog - popup vindue med film detaljer
function showMovieModal(movie) {
  // Find modal indhold container og byg HTML struktur dynamisk
  document.querySelector("#dialog-content").innerHTML = /*html*/ `
    <img src="${movie.image}" alt="Poster af ${
    movie.title
  }" class="movie-poster">
    <div class="dialog-details">
      <h2>${movie.title} <span class="movie-year">(${movie.year})</span></h2>
      <p class="movie-genre">${movie.genre.join(", ")}</p>
      <p class="movie-rating">⭐ ${movie.rating}</p>
      <p><strong>Director:</strong> ${movie.director}</p>
      <p><strong>Actors:</strong> ${movie.actors.join(", ")}</p>
      <p class="movie-description">${movie.description}</p>
    </div>
  `;

  // Åbn modalen - showModal() er en built-in browser funktion
  document.querySelector("#movie-dialog").showModal();
}

// ===== FILTER FUNKTIONER =====
// #7: Ryd alle filtre - reset alle filter felter til tomme værdier
function clearAllFilters() {
  // Ryd alle input felter - sæt value til tom string eller standard værdi
  document.querySelector("#search-input").value = "";
  document.querySelector("#genre-select").value = "all";
  document.querySelector("#sort-select").value = "none";
  document.querySelector("#year-from").value = "";
  document.querySelector("#year-to").value = "";
  document.querySelector("#rating-from").value = "";
  document.querySelector("#rating-to").value = "";

  // Kør filtrering igen (vil vise alle film da alle filtre er ryddet)
  filterMovies();
}

// #8: Komplet filtrering med alle funktioner - den vigtigste funktion!
function filterMovies() {
  // Hent alle filter værdier fra input felterne
  const searchValue = document
    .querySelector("#search-input")
    .value.toLowerCase(); // Konvertér til lowercase for case-insensitive søgning
  const genreValue = document.querySelector("#genre-select").value;
  const sortValue = document.querySelector("#sort-select").value;

  // Number() konverterer string til tal, || 0 giver default værdi hvis tomt
  const yearFrom = Number(document.querySelector("#year-from").value) || 0;
  const yearTo = Number(document.querySelector("#year-to").value) || 9999;
  const ratingFrom = Number(document.querySelector("#rating-from").value) || 0;
  const ratingTo = Number(document.querySelector("#rating-to").value) || 10;

  // Start med alle film - kopiér til ny variabel så vi ikke ændrer originalen
  let filteredMovies = allMovies;

  // FILTER 1: Søgetekst - filtrer på film titel
  if (searchValue) {
    // Kun filtrer hvis der er indtastet noget
    filteredMovies = filteredMovies.filter((movie) => {
      // includes() checker om søgeteksten findes i titlen
      return movie.title.toLowerCase().includes(searchValue);
    });
  }

  // FILTER 2: Genre - filtrer på valgt genre
  if (genreValue !== "all") {
    // Kun filtrer hvis ikke "all" er valgt
    filteredMovies = filteredMovies.filter((movie) => {
      // includes() checker om genren findes i filmens genre array
      return movie.genre.includes(genreValue);
    });
  }

  // FILTER 3: År range - filtrer film mellem to årstal
  if (yearFrom > 0 || yearTo < 9999) {
    // Kun filtrer hvis der er sat grænser
    filteredMovies = filteredMovies.filter((movie) => {
      // Check om filmens år er mellem min og max værdi
      return movie.year >= yearFrom && movie.year <= yearTo;
    });
  }

  // FILTER 4: Rating range - filtrer film mellem to ratings
  if (ratingFrom > 0 || ratingTo < 10) {
    // Kun filtrer hvis der er sat grænser
    filteredMovies = filteredMovies.filter((movie) => {
      // Check om filmens rating er mellem min og max værdi
      return movie.rating >= ratingFrom && movie.rating <= ratingTo;
    });
  }

  // SORTERING (altid til sidst efter alle filtre er anvendt)
  if (sortValue === "title") {
    // Alfabetisk sortering - localeCompare() håndterer danske bogstaver korrekt
    filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortValue === "year") {
    // Sortér på år (nyeste først) - b - a giver descending order
    filteredMovies.sort((a, b) => b.year - a.year);
  } else if (sortValue === "rating") {
    // Sortér på rating (højeste først) - b - a giver descending order
    filteredMovies.sort((a, b) => b.rating - a.rating);
  }

  // Vis de filtrerede film på siden
  displayMovies(filteredMovies);
}
