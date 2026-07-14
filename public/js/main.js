// --- Offline detection banner ---
function updateOfflineStatus() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  if (navigator.onLine) {
    banner.classList.add('d-none');
  } else {
    banner.classList.remove('d-none');
  }
}
window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);
document.addEventListener('DOMContentLoaded', updateOfflineStatus);

// --- Register service worker for offline mode ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed', err));
  });
}

// --- Gallery main image swap ---
document.addEventListener('click', (e) => {
  const thumb = e.target.closest('.gallery-thumb');
  if (thumb) {
    const main = document.getElementById('mainOfferImage');
    if (main) main.src = thumb.src;
  }
});

// --- Download itinerary for offline access (localStorage) ---
function saveOfflineItinerary(data) {
  try {
    const stored = JSON.parse(localStorage.getItem('azulink_offline_trips') || '[]');
    const exists = stored.find(t => t.id === data.id);
    if (!exists) stored.push(data);
    localStorage.setItem('azulink_offline_trips', JSON.stringify(stored));
    return true;
  } catch (e) {
    console.error('Erreur sauvegarde locale', e);
    return false;
  }
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-download-offline');
  if (!btn) return;
  const data = JSON.parse(btn.getAttribute('data-trip'));
  const ok = saveOfflineItinerary(data);
  if (ok) {
    btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Programme enregistré hors-ligne';
    btn.classList.remove('btn-azulink-outline');
    btn.classList.add('btn-azulink-primary');
    btn.disabled = true;
  }
});

// --- Render offline-saved trips on /hors-connexion page ---
function renderOfflineTrips() {
  const container = document.getElementById('offlineTripsList');
  if (!container) return;
  const stored = JSON.parse(localStorage.getItem('azulink_offline_trips') || '[]');
  if (stored.length === 0) {
    container.innerHTML = '<p class="text-muted">Aucun programme téléchargé pour le moment. Depuis la page d\'une offre, cliquez sur "Télécharger pour hors-ligne".</p>';
    return;
  }
  container.innerHTML = stored.map(t => `
    <div class="card mb-3">
      <div class="card-body">
        <h5 class="card-title">${t.title}</h5>
        <p class="mb-1"><i class="bi bi-geo-alt"></i> ${t.address || ''}</p>
        <p class="mb-1"><i class="bi bi-clock"></i> ${t.duration || ''}</p>
        <p class="text-muted small mb-0">${t.program ? t.program.replace(/\n/g, '<br>') : ''}</p>
      </div>
    </div>
  `).join('');
}
document.addEventListener('DOMContentLoaded', renderOfflineTrips);
