// TMDb API Configuration
const TMDB_API_KEY = 'YOUR_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Deutsche Streaming-Anbieter mit besserer Erkennung
const providerNames = {
    8: 'Netflix',
    119: 'Amazon Prime Video',
    337: 'Disney+',
    29: 'Sky Go',
    130: 'Sky Ticket', // Often replaced by WOW
    283: 'Crunchyroll',
    350: 'Apple TV+',
    279: 'Rakuten TV',
    62: 'Paramount+',
    546: 'WOW', // New name for Sky Ticket
    178: 'WOW' // Another ID for WOW, handle duplicates
};

// Global variable to store the last search results
let lastSearchResults = [];

// Function to fetch movie details (genres, runtime)
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=de-DE`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching details for movie ID ${movieId}:`, error);
        return null;
    }
}

// Function to fetch streaming providers for a movie
async function fetchProviders(movieId) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter for Germany (DE) and return the providers
        return data.results.DE || {};
    } catch (error) {
        console.error(`Error fetching providers for movie ID ${movieId}:`, error);
        return {};
    }
}

// Function to render a single movie card for grid sections (Recommended, Popular, New)
// This is now also used for search results previews
function renderMovieGridItem(movie) {
    const title = movie.title;
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const posterPath = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : 'https://via.placeholder.com/220x330?text=Kein+Poster+verf%C3%BCgbar';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    return `
        <div class="movie-grid-item" onclick="displayMovieSearchDetail(${movie.id})">
            <img src="${posterPath}" alt="${title} Poster" class="movie-grid-poster">
            <div class="movie-grid-info">
                <div class="movie-grid-title">${title}</div>
                <div class="movie-grid-year">${year}</div>
            </div>
            <div class="movie-grid-rating">⭐ ${rating}</div>
        </div>
    `;
}

// NEW FUNCTION: Display a single detailed movie view (for search result click or grid item click)
async function displayMovieSearchDetail(movieId) {
    const resultsDiv = document.getElementById('results');
    const movieSections = document.querySelector('.movie-sections');
    const apiNote = document.querySelector('.api-note');
    const header = document.querySelector('.header');

    // Hide initial movie sections, API note, and header
    if (movieSections) movieSections.style.display = 'none';
    if (apiNote) apiNote.style.display = 'none';
    if (header) header.style.display = 'none';

    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Lade Filminformationen...</p></div>';

    try {
        const movieDetails = await fetchMovieDetails(movieId);
        if (!movieDetails) {
            resultsDiv.innerHTML = '<div class="error">Filminformationen konnten nicht geladen werden.</div>';
            return;
        }

        const title = movieDetails.title;
        const year = movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 'N/A';
        const posterPath = movieDetails.poster_path ? `${TMDB_IMAGE_BASE}${movieDetails.poster_path}` : 'https://via.placeholder.com/250x375?text=Kein+Poster+verf%C3%BCgbar';
        const plot = movieDetails.overview || 'Keine Plot-Zusammenfassung verfügbar.';
        const rating = movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) : 'N/A';
        const runtime = movieDetails.runtime ? `${movieDetails.runtime} Min.` : 'N/A';
        
        const genres = movieDetails.genres && movieDetails.genres.length > 0
            ? movieDetails.genres.map(g => g.name).join(', ')
            : 'N/A';
        
        const genreTags = movieDetails.genres && movieDetails.genres.length > 0
            ? movieDetails.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join('')
            : '';

        let streamingFlatrateHTML = '';
        let streamingRentBuyHTML = '';
        let hasProviders = false;

        const providers = await fetchProviders(movieId);
        if (providers) {
            if (providers.flatrate && providers.flatrate.length > 0) {
                hasProviders = true;
                streamingFlatrateHTML = providers.flatrate.map(p => {
                    const providerName = providerNames[p.provider_id] || p.provider_name;
                    return `<div class="provider-badge">
                                <img src="${TMDB_IMAGE_BASE}/t/p/w45/${p.logo_path}" alt="${providerName}" class="provider-logo">
                                <span>${providerName}</span>
                            </div>`;
                }).join('');
            }

            const rentBuyProviders = [];
            if (providers.rent && providers.rent.length > 0) {
                hasProviders = true;
                providers.rent.forEach(p => {
                    const providerName = providerNames[p.provider_id] || p.provider_name;
                    rentBuyProviders.push(`<div class="provider-badge">
                                                <img src="${TMDB_IMAGE_BASE}/t/p/w45/${p.logo_path}" alt="${providerName}" class="provider-logo">
                                                <span>${providerName}</span>
                                            </div>`);
                });
            }
            if (providers.buy && providers.buy.length > 0) {
                hasProviders = true;
                providers.buy.forEach(p => {
                    const providerName = providerNames[p.provider_id] || p.provider_name;
                    rentBuyProviders.push(`<div class="provider-badge">
                                                <img src="${TMDB_IMAGE_BASE}/t/p/w45/${p.logo_path}" alt="${providerName}" class="provider-logo">
                                                <span>${providerName}</span>
                                            </div>`);
                });
            }
            streamingRentBuyHTML = rentBuyProviders.join('');
        }

        const movieDetailCard = `
            <div class="movie-card detailed-view" id="movie-card-${movieDetails.id}">
                <img src="${posterPath}" alt="${title} Poster" class="movie-poster">
                <div class="movie-info">
                    <div class="movie-title">${title}</div>
                    <div class="movie-details">
                        <strong>Jahr:</strong> ${year}<br>
                        <strong>Genre:</strong> ${genres}<br>
                        <strong>Laufzeit:</strong> ${runtime}<br>
                        <strong>Bewertung:</strong> 
                        <span class="rating">
                            ⭐ ${rating}/10
                            ${movieDetails.vote_count ? `(${movieDetails.vote_count.toLocaleString()} Bewertungen)` : ''}
                        </span>
                    </div>
                    ${genreTags ? `<div class="genre-tags">${genreTags}</div>` : ''}
                    <div class="movie-plot">
                        ${plot}
                    </div>
                    <div class="streaming-section">
                        <div class="streaming-title">📺 Verfügbar bei:</div>
                        ${hasProviders ? `
                        <div class="streaming-table-header">
                            <div class="table-header-item">Abo</div>
                            <div class="table-header-item">Kaufen & Mieten</div>
                        </div>
                        <div class="streaming-table-content">
                            <div class="streaming-column">
                                ${streamingFlatrateHTML || '<div class="no-providers">Keine Abo-Optionen</div>'}
                            </div>
                            <div class="streaming-column">
                                ${streamingRentBuyHTML || '<div class="no-providers">Keine Kauf-/Miet-Optionen</div>'}
                            </div>
                        </div>
                        ` : '<div class="no-providers-message">Keine Streaming-Optionen in Deutschland verfügbar.</div>'}
                    </div>
                </div>
            </div>
            <button class="back-to-results-btn" onclick="goBackToSearchResults()">← Zurück zu den Suchergebnissen</button>
        `;
        resultsDiv.innerHTML = `<div class="results-detail-view">${movieDetailCard}</div>`;
    } catch (error) {
        console.error("Error displaying movie detail:", error);
        resultsDiv.innerHTML = `<div class="error">Fehler beim Laden der Filminformationen: ${error.message}.</div>`;
    }
}

// MODIFIED FUNCTION: Display search results as a grid of preview items
function displaySearchResults(movies) {
    const resultsDiv = document.getElementById('results');
    const movieSections = document.querySelector('.movie-sections');
    const apiNote = document.querySelector('.api-note');
    const header = document.querySelector('.header');

    // Store results for "back" functionality
    lastSearchResults = movies;

    // Hide initial movie sections and API note when search results are displayed
    if (movieSections) {
        movieSections.style.display = 'none';
    }
    if (apiNote) {
        apiNote.style.display = 'none';
    }
    if (header) {
        header.style.display = 'none';
    }

    if (!movies || movies.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Leider keine Filme zu Ihrer Suche gefunden. Bitte versuchen Sie einen anderen Titel.</div>';
        return;
    }

    // Render as a grid of preview items
    const moviePreviews = movies.map(movie => renderMovieGridItem(movie)).join('');

    resultsDiv.innerHTML = `
        <div class="search-results-grid">
            ${moviePreviews}
        </div>
        <button class="back-to-sections-btn" onclick="showInitialSections()">← Zurück zu den Empfehlungen</button>
    `;
}

// NEW FUNCTION: Go back to the previous search results
function goBackToSearchResults() {
    if (lastSearchResults.length > 0) {
        displaySearchResults(lastSearchResults); // Re-display the previous search results
    } else {
        showInitialSections(); // If no previous search, go to initial sections
    }
}

// Ensure initial sections are shown when page loads or search is cleared/back button is clicked
function showInitialSections() {
    const movieSections = document.querySelector('.movie-sections');
    const apiNote = document.querySelector('.api-note');
    const header = document.querySelector('.header');
    const resultsDiv = document.getElementById('results');

    // Clear last search results when going back to initial sections
    lastSearchResults = []; 

    if (movieSections) {
        movieSections.style.display = 'flex';
    }
    if (apiNote) {
        apiNote.style.display = 'block';
    }
    if (header) {
        header.style.display = 'block';
    }
    resultsDiv.innerHTML = ''; // Clear previous results
}

// Modified searchMovies function to ensure initial sections are hidden
async function searchMovies() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('results');
    const movieSections = document.querySelector('.movie-sections');
    const apiNote = document.querySelector('.api-note');
    const header = document.querySelector('.header');

    if (!query) {
        resultsDiv.innerHTML = '<div class="error">Bitte geben Sie einen Filmtitel ein.</div>';
        return;
    }

    // Hide initial sections immediately when search starts
    if (movieSections) {
        movieSections.style.display = 'none';
    }
    if (apiNote) {
        apiNote.style.display = 'none';
    }
    if (header) {
        header.style.display = 'none';
    }

    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div><p>Suche Filme...</p></div>';

    try {
        const response = await fetch(`${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=de-DE`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Fetch detailed information for each movie (genres, runtime, etc.)
            // We need this for the `lastSearchResults` to allow full detail display without re-fetching
            const detailedMoviesPromises = data.results.map(async movie => {
                const movieDetailsResponse = await fetch(`${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=de-DE`);
                if (!movieDetailsResponse.ok) {
                    console.error(`Failed to fetch details for movie ID ${movie.id}`);
                    return movie; // Return original movie if details fail
                }
                const details = await movieDetailsResponse.json();
                return { ...movie, ...details }; // Merge details with original movie object
            });

            const detailedMovies = await Promise.all(detailedMoviesPromises);
            displaySearchResults(detailedMovies); // Now displays previews
        } else {
            resultsDiv.innerHTML = '<div class="error">Leider keine Filme zu Ihrer Suche gefunden. Bitte versuchen Sie einen anderen Titel.</div>';
        }
    } catch (error) {
        console.error("Fehler beim Suchen nach Filmen:", error);
        resultsDiv.innerHTML = `<div class="error">Ein Fehler ist aufgetreten: ${error.message}. Bitte versuchen Sie es später erneut.</div>`;
    }
}

// Load Recommended Movies
async function loadRecommendedMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=1`);
        if (!response.ok) throw new Error('Failed to fetch recommended movies.');
        const data = await response.json();
        const recommendedMoviesDiv = document.getElementById('recommendedMovies');
        recommendedMoviesDiv.innerHTML = data.results.slice(0, 10).map(renderMovieGridItem).join(''); // Limit to 10
    } catch (error) {
        console.error("Error loading recommended movies:", error);
        document.getElementById('recommendedMovies').innerHTML = '<div class="error">Empfohlene Filme konnten nicht geladen werden.</div>';
    }
}

// Load Popular Movies
async function loadPopularMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=de-DE&page=1`);
        if (!response.ok) throw new Error('Failed to fetch popular movies.');
        const data = await response.json();
        const popularMoviesDiv = document.getElementById('popularMovies');
        popularMoviesDiv.innerHTML = data.results.slice(0, 10).map(renderMovieGridItem).join(''); // Limit to 10
    } catch (error) {
        console.error("Error loading popular movies:", error);
        document.getElementById('popularMovies').innerHTML = '<div class="error">Beliebte Filme konnten nicht geladen werden.</div>';
    }
}

// Load New Movies (using 'now_playing' as a proxy for new releases)
async function loadNewMovies() {
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=de-DE&page=1`);
        if (!response.ok) throw new Error('Failed to fetch new movies.');
        const data = await response.json();
        const newMoviesDiv = document.getElementById('newMovies');
        newMoviesDiv.innerHTML = data.results.slice(0, 10).map(renderMovieGridItem).join(''); // Limit to 10
    } catch (error) {
        console.error("Error loading new movies:", error);
        document.getElementById('newMovies').innerHTML = '<div class="error">Neuerscheinungen konnten nicht geladen werden.</div>';
    }
}


// Initialisation on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('searchInput').focus();
    showInitialSections(); // Make sure initial sections are visible on page load
    loadRecommendedMovies();
    loadPopularMovies();
    loadNewMovies();
});

// Add an event listener to the search input for 'Enter' key
document.getElementById('searchInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        searchMovies();
    }
});