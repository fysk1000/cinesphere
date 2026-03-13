/**
 * CineSphere - Frontend Phase 4
 * Consume la API FastAPI local (películas, favoritos).
 * Vanilla JS, sin frameworks.
 */

// URL base del backend FastAPI. Cambia el puerto aquí si lo modificas.
const API_BASE_URL = 'http://127.0.0.1:8000';
const USER_ID = 'alejandro';

// Referencias a elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchBtnText = document.getElementById('searchBtnText');
const searchSpinner = document.getElementById('searchSpinner');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchStatus = document.getElementById('searchStatus');
const backendStatus = document.getElementById('backendStatus');
const feedback = document.getElementById('feedback');
const resultSection = document.getElementById('resultSection');
const resultsGrid = document.getElementById('resultsGrid');
const resultsEmpty = document.getElementById('resultsEmpty');
const favoritesList = document.getElementById('favoritesList');
const favoritesEmpty = document.getElementById('favoritesEmpty');
const refreshFavoritesBtn = document.getElementById('refreshFavoritesBtn');

// Modal
const movieModal = document.getElementById('movieModal');
const movieModalContent = document.getElementById('movieModalContent');
const movieModalClose = document.getElementById('movieModalClose');
const movieModalBackdropWrapper = document.getElementById('movieModalBackdropWrapper');
const movieModalBackdrop = document.getElementById('movieModalBackdrop');
const movieModalPoster = document.getElementById('movieModalPoster');
const movieModalTitle = document.getElementById('movieModalTitle');
const movieModalBadges = document.getElementById('movieModalBadges');
const movieModalOverview = document.getElementById('movieModalOverview');
const movieModalGenres = document.getElementById('movieModalGenres');
const movieModalRelease = document.getElementById('movieModalRelease');
const movieModalRuntime = document.getElementById('movieModalRuntime');
const movieModalRating = document.getElementById('movieModalRating');
const movieModalTrailerContainer = document.getElementById('movieModalTrailerContainer');
const movieModalTrailerEmbed = document.getElementById('movieModalTrailerEmbed');
const movieModalTrailerIframe = document.getElementById('movieModalTrailerIframe');
const movieModalTrailerFallback = document.getElementById('movieModalTrailerFallback');
const movieModalGallerySection = document.getElementById('movieModalGallerySection');
const movieModalImages = document.getElementById('movieModalImages');

// --- Utilidades ---

function showFeedback(message, type = 'info') {
  feedback.classList.remove('hidden');
  feedback.className = 'mb-6 p-4 rounded-xl text-sm ';
  if (type === 'error') feedback.className += 'bg-red-900/60 border border-red-600 text-red-100';
  else if (type === 'success') feedback.className += 'bg-emerald-900/60 border border-emerald-600 text-emerald-100';
  else feedback.className += 'bg-gray-800/80 border border-gray-600 text-gray-100';
  feedback.textContent = message;
}

function hideFeedback() {
  feedback.classList.add('hidden');
}

function setSearchLoading(loading) {
  searchBtn.disabled = loading;
  if (loading) {
    searchBtnText.textContent = 'Buscando...';
    searchSpinner.classList.remove('hidden');
    searchStatus.textContent = 'Consultando la API de CineSphere...';
    searchStatus.classList.remove('hidden');
  } else {
    searchBtnText.textContent = 'Buscar';
    searchSpinner.classList.add('hidden');
    searchStatus.classList.add('hidden');
  }
}

// --- Búsqueda ---

async function searchMovie() {
  let criterio = (searchInput.value || '').trim();
  criterio = criterio.replace(/\s+/g, ' ');
  if (!criterio) {
    showFeedback('Escribe el nombre de una película para buscar.', 'error');
    return;
  }

  hideFeedback();
  setSearchLoading(true);
  resultSection.classList.add('hidden');
  resultsGrid.innerHTML = '';
  resultsEmpty.classList.add('hidden');

  try {
    console.log('[CineSphere] Buscando películas con criterio:', criterio);
    const movies = await searchWithFallback(criterio);

    if (!movies.length) {
      resultsEmpty.textContent = 'No se encontraron películas para tu búsqueda.';
      resultsEmpty.classList.remove('hidden');
      resultSection.classList.remove('hidden');
      return;
    }

    resultsEmpty.classList.add('hidden');
    renderResultsGrid(movies);
    resultSection.classList.remove('hidden');
  } catch (err) {
    console.error('[CineSphere] Error al buscar películas:', err);
    showFeedback('Ocurrió un error al consultar la API.', 'error');
    resultsEmpty.textContent = 'Ocurrió un error al consultar la API.';
    resultsEmpty.classList.remove('hidden');
  } finally {
    setSearchLoading(false);
  }
}

// Intenta /peliculas y si falla, hace fallback a /pelicula y devuelve siempre un array de películas
async function searchWithFallback(criterio) {
  // 1) Intentar /peliculas (múltiples resultados)
  try {
    const res = await fetch(`${API_BASE_URL}/peliculas/${encodeURIComponent(criterio)}`);
    console.log('[CineSphere] Respuesta /peliculas status:', res.status);
    if (res.ok) {
      const data = await res.json().catch(() => []);
      return Array.isArray(data) ? data : [];
    }
    if (res.status !== 404) {
      console.warn('[CineSphere] /peliculas devolvió error, intentando /pelicula:', res.status);
    } else {
      console.log('[CineSphere] /peliculas sin resultados (404), intentando /pelicula.');
    }
  } catch (err) {
    console.error('[CineSphere] Error de red al llamar /peliculas:', err);
    // seguimos al fallback
  }

  // 2) Fallback a /pelicula (un solo resultado)
  try {
    const res = await fetch(`${API_BASE_URL}/pelicula/${encodeURIComponent(criterio)}`);
    console.log('[CineSphere] Respuesta /pelicula status:', res.status);
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.id) {
        return [data];
      }
      return [];
    }
    if (res.status === 404) {
      return [];
    }
    console.warn('[CineSphere] /pelicula devolvió error:', res.status);
    return [];
  } catch (err) {
    console.error('[CineSphere] Error de red al llamar /pelicula:', err);
    throw err;
  }

function renderResultsGrid(movies) {
  resultsGrid.innerHTML = '';
  movies.forEach(movie => {
    const card = document.createElement('article');
    card.className = 'bg-cinema-card rounded-2xl overflow-hidden shadow-xl flex flex-col border border-gray-800/60 hover:border-cinema-accent/70 transition-colors group cursor-pointer';

    const imgHtml = movie.image
      ? `<img src="${movie.image}" alt="${escapeHtml(movie.title)}" class="w-full h-64 object-cover" />`
      : '<div class="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-500">Sin imagen</div>';
    const rating = movie.rating != null ? movie.rating.toFixed(1) : null;
    const ratingLabel = rating != null ? rating.toFixed(1) : 'Sin calificación';
    const date = movie.release_date || 'Sin fecha';

    card.innerHTML = `
      ${imgHtml}
      <div class="p-4 flex flex-col gap-2 flex-1">
        <div class="flex-1">
          <h3 class="font-semibold text-lg line-clamp-2">${escapeHtml(movie.title)}</h3>
          <div class="flex flex-wrap gap-2 mt-2 text-xs">
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/40">
                ⭐ <span class="font-semibold">${ratingLabel}</span>
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/40">
              📅 <span>${date}</span>
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-200 border border-purple-500/40 uppercase tracking-wide">
              ${escapeHtml(movie.media_type || 'movie')}
            </span>
          </div>
        </div>
        <div class="mt-2">
          <label class="block text-xs text-gray-400 mb-1">Notas (opcional)</label>
          <input
            type="text"
            class="notes-input w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-cinema-accent outline-none text-sm"
            placeholder="Ej: Verla el fin de semana"
          />
        </div>
        <div class="mt-2 flex gap-2">
          <button
            type="button"
            class="save-fav-btn px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-sm transition-colors"
          >
            Guardar en favoritos
          </button>
          <button
            type="button"
            class="details-btn px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-100 border border-gray-600 transition-colors"
          >
            Ver más
          </button>
        </div>
      </div>
    `;

    const notesInput = card.querySelector('.notes-input');
    const saveBtn = card.querySelector('.save-fav-btn');
    const detailsBtn = card.querySelector('.details-btn');

    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleSaveFavorite(movie, notesInput, saveBtn);
    });

    const openDetails = () => openMovieDetailModal(movie.id);
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDetails();
    });
    card.addEventListener('click', openDetails);

    resultsGrid.appendChild(card);
  });
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Guardar favorito desde una tarjeta ---

async function handleSaveFavorite(movie, notesInputEl, buttonEl) {
  const payload = {
    external_id: movie.id,
    title: movie.title,
    media_type: movie.media_type || 'movie',
    rating: movie.rating ?? null,
    release_date: movie.release_date || null,
    image: movie.image || null,
    notas_personales: (notesInputEl.value || '').trim() || null
  };

  hideFeedback();

  const originalText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = 'Guardando...';

  try {
    const res = await fetch(`${API_BASE_URL}/recursos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': USER_ID
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (res.status === 201) {
      showFeedback('Película guardada en favoritos.', 'success');
      loadFavorites();
    } else if (res.status === 409) {
      showFeedback(data.detail || 'Esta película ya está en tu lista de favoritos.', 'error');
    } else {
      showFeedback(data.detail || `Error ${res.status}`, 'error');
    }
  } catch (err) {
    console.error('[CineSphere] Error de red al guardar favorito:', err);
    showFeedback('Error de conexión al guardar.', 'error');
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = originalText;
  }

// --- Modal de detalle ---

function openModal() {
  movieModal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
}

function closeModal() {
  movieModal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  // limpiar trailer para detener reproducción
  movieModalTrailerIframe.src = '';
}

async function openMovieDetailModal(tmdbId) {
  if (!tmdbId) return;

  openModal();

  // Estado de carga inicial
  movieModalBackdrop.classList.add('hidden');
  movieModalTitle.textContent = 'Cargando detalles...';
  movieModalBadges.innerHTML = '';
  movieModalOverview.textContent = '';
  movieModalGenres.textContent = '';
  movieModalRelease.textContent = '';
  movieModalRuntime.textContent = '';
  movieModalRating.textContent = '';
  movieModalTrailerEmbed.classList.add('hidden');
  movieModalTrailerFallback.classList.remove('hidden');
  movieModalGallerySection.classList.add('hidden');
  movieModalImages.innerHTML = '';
  movieModalPoster.src = '';
  movieModalPoster.alt = '';

  try {
    const res = await fetch(`${API_BASE_URL}/pelicula-detalle/${tmdbId}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      showFeedback(data.detail || `Error ${res.status} al cargar detalle.`, 'error');
      movieModalTitle.textContent = 'No se pudo cargar el detalle';
      return;
    }

    renderMovieDetailInModal(data);
  } catch (err) {
    console.error('[CineSphere] Error de red al cargar detalle:', err);
    showFeedback('No se pudo conectar con el servidor para cargar el detalle.', 'error');
    movieModalTitle.textContent = 'No se pudo cargar el detalle';
  }
}

function renderMovieDetailInModal(detail) {
  movieModalTitle.textContent = detail.title || 'Sin título';

  // Badges
  movieModalBadges.innerHTML = '';
  const rating = detail.rating != null ? detail.rating.toFixed(1) : '-';
  const release = detail.release_date || '-';
  const runtime = detail.runtime ? `${detail.runtime} min` : '-';

  movieModalBadges.innerHTML = `
    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/40 text-xs">
      ⭐ <span class="font-semibold">${rating}</span>
    </span>
    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-200 border border-blue-500/40 text-xs">
      📅 <span>${release}</span>
    </span>
    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-500/10 text-teal-200 border border-teal-500/40 text-xs">
      ⏱ <span>${runtime}</span>
    </span>
  `;

  // Poster y backdrop
  if (detail.poster_image) {
    movieModalPoster.src = detail.poster_image;
    movieModalPoster.alt = detail.title || '';
  } else {
    movieModalPoster.src = '';
    movieModalPoster.alt = '';
  }

  if (detail.backdrop_image) {
    movieModalBackdrop.src = detail.backdrop_image;
    movieModalBackdrop.alt = detail.title || '';
    movieModalBackdrop.classList.remove('hidden');
  } else {
    movieModalBackdrop.classList.add('hidden');
  }

  // Texto
  movieModalOverview.textContent = detail.overview || 'No hay sinopsis disponible.';
  movieModalGenres.textContent = Array.isArray(detail.genres) && detail.genres.length
    ? detail.genres.join(', ')
    : 'Sin información de géneros.';
  movieModalRelease.textContent = release;
  movieModalRuntime.textContent = runtime;
  movieModalRating.textContent = rating;

  // Trailer
  if (detail.trailer_url) {
    movieModalTrailerIframe.src = detail.trailer_url;
    movieModalTrailerEmbed.classList.remove('hidden');
    movieModalTrailerFallback.classList.add('hidden');
  } else {
    movieModalTrailerIframe.src = '';
    movieModalTrailerEmbed.classList.add('hidden');
    movieModalTrailerFallback.classList.remove('hidden');
  }

  // Galería de imágenes
  const images = Array.isArray(detail.images) ? detail.images : [];
  if (images.length) {
    movieModalImages.innerHTML = '';
    images.forEach((url) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = detail.title || '';
      img.className = 'w-full h-20 md:h-24 object-cover rounded-lg border border-gray-800 bg-gray-900';
      movieModalImages.appendChild(img);
    });
    movieModalGallerySection.classList.remove('hidden');
  } else {
    movieModalGallerySection.classList.add('hidden');
  }
}

// --- Lista de favoritos ---

async function loadFavorites() {
  favoritesEmpty.textContent = 'Cargando favoritos...';
  favoritesEmpty.classList.remove('hidden');
  favoritesList.querySelectorAll('.favorite-card').forEach(el => el.remove());

  try {
    console.log('[CineSphere] Cargando favoritos del backend...');
    const res = await fetch(`${API_BASE_URL}/recursos`, {
      headers: { 'X-User-Id': USER_ID }
    });
    const data = await res.json().catch(() => []);

    if (!res.ok) {
      favoritesEmpty.textContent = 'Error al cargar favoritos.';
      return;
    }

    const items = Array.isArray(data) ? data : [];
    favoritesEmpty.classList.add('hidden');

    if (items.length === 0) {
      favoritesEmpty.textContent = 'Aún no tienes favoritos. Busca una película y guárdala.';
      favoritesEmpty.classList.remove('hidden');
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'favorite-card bg-gray-800 rounded-xl p-4 flex gap-4 items-start';
      const img = item.image
        ? `<img src="${item.image}" alt="${escapeHtml(item.title)}" class="w-20 h-28 object-cover rounded-lg flex-shrink-0" />`
        : '<div class="w-20 h-28 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">Sin imagen</div>';
      const rating = item.rating != null ? item.rating.toFixed(1) : '-';
      card.innerHTML = `
        ${img}
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-gray-400 mt-1">⭐ ${rating} · ${escapeHtml(item.release_date || '-')}</p>
          ${item.notas_personales ? `<p class="text-sm text-gray-500 mt-2 italic">${escapeHtml(item.notas_personales)}</p>` : ''}
        </div>
        <button type="button" class="delete-fav px-3 py-1.5 rounded-lg bg-red-900/70 hover:bg-red-700 text-sm flex-shrink-0" data-id="${item.id}">
          Eliminar
        </button>
      `;
      card.querySelector('.delete-fav').addEventListener('click', () => deleteFavorite(item.id));
      favoritesList.appendChild(card);
    });
  } catch (err) {
    console.error('[CineSphere] Error de red al cargar favoritos:', err);
    favoritesEmpty.textContent = 'No se pudo conectar con el servidor.';
    favoritesEmpty.classList.remove('hidden');
  }
}

async function deleteFavorite(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/recursos/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': USER_ID }
    });
    if (res.ok) {
      showFeedback('Favorito eliminado.', 'success');
      loadFavorites();
    } else {
      const data = await res.json().catch(() => ({}));
      showFeedback(data.detail || 'Error al eliminar.', 'error');
    }
  } catch (err) {
    console.error('[CineSphere] Error de red al eliminar favorito:', err);
    showFeedback('Error de conexión al eliminar.', 'error');
  }
}

// --- Eventos ---

searchBtn.addEventListener('click', searchMovie);
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchMovie(); });
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  resultsGrid.innerHTML = '';
  resultSection.classList.add('hidden');
  resultsEmpty.textContent = '';
  resultsEmpty.classList.add('hidden');
  hideFeedback();
});
refreshFavoritesBtn.addEventListener('click', () => { hideFeedback(); loadFavorites(); });

// Cierre del modal
movieModalClose.addEventListener('click', closeModal);
movieModal.addEventListener('click', (e) => {
  if (e.target === movieModal) {
    closeModal();
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !movieModal.classList.contains('hidden')) {
    closeModal();
  }
});

// Cargar favoritos al abrir la página
checkBackendHealth();
loadFavorites();

// --- Health check básico del backend (/config) ---

async function checkBackendHealth() {
  if (!backendStatus) return;
  try {
    console.log('[CineSphere] Comprobando estado del backend...');
    const res = await fetch(`${API_BASE_URL}/config`);
    if (res.ok) {
      backendStatus.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-emerald-900/40 text-emerald-200 border border-emerald-500/60';
      backendStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Backend en línea';
    } else {
      backendStatus.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-red-900/40 text-red-200 border border-red-500/60';
      backendStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Backend con problemas (' + res.status + ')';
    }
  } catch (err) {
    console.error('[CineSphere] No se pudo comprobar el backend:', err);
    backendStatus.className = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-red-900/40 text-red-200 border border-red-500/60';
    backendStatus.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span> Backend no disponible';
  }
}
