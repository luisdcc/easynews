// EasyNews — SPA estática.
// Carga data/news.json (generado por el scraper) y pinta la grilla de noticias
// con filtros por país y búsqueda por texto. Sin dependencias ni build.

const DATA_URL = 'data/news.json';

// Emoji de bandera por código de país (INT = internacional).
const FLAGS = {
  ES: '🇪🇸', MX: '🇲🇽', AR: '🇦🇷', CL: '🇨🇱', CO: '🇨🇴',
  PE: '🇵🇪', VE: '🇻🇪', UY: '🇺🇾', INT: '🌎',
};

// Orden preferido de los filtros de país.
const COUNTRY_ORDER = ['ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE', 'UY', 'INT'];

const state = {
  items: [],
  labels: {}, // country -> countryLabel
  country: 'all',
  query: '',
};

const els = {};

// --- Utilidades ------------------------------------------------------------

function timeAgo(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const secs = Math.max(0, (Date.now() - t) / 1000);
  if (secs < 90) return 'hace instantes';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

// Color determinista para el fondo del fallback, derivado del nombre del medio.
function hueFor(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function flag(country) {
  return FLAGS[country] || '📰';
}

// --- Render ----------------------------------------------------------------

function buildCard(item) {
  const card = document.createElement('a');
  card.className = 'card';
  card.href = item.link;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  // Miniatura (imagen real o fallback con la inicial del medio).
  const thumb = document.createElement('div');
  thumb.className = 'thumb';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = `${flag(item.country)} ${item.source}`;

  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => applyFallback(thumb, item), { once: true });
    thumb.appendChild(img);
  } else {
    applyFallback(thumb, item);
  }
  thumb.appendChild(badge);

  // Cuerpo.
  const body = document.createElement('div');
  body.className = 'card-body';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const src = document.createElement('span');
  src.textContent = item.source;
  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = timeAgo(item.isoDate);
  meta.append(src);
  if (time.textContent) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.textContent = '•';
    meta.append(dot, time);
  }

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;

  body.append(meta, title);

  if (item.snippet) {
    const snippet = document.createElement('p');
    snippet.className = 'card-snippet';
    snippet.textContent = item.snippet;
    body.append(snippet);
  }

  card.append(thumb, body);
  return card;
}

function applyFallback(thumb, item) {
  thumb.innerHTML = '';
  thumb.classList.add('thumb--fallback');
  const hue = hueFor(item.sourceId || item.source || '');
  thumb.style.background = `linear-gradient(135deg, hsl(${hue} 42% 26%), hsl(${(hue + 40) % 360} 46% 16%))`;
  const letter = document.createElement('span');
  letter.className = 'fallback-letter';
  letter.textContent = (item.source || '?').trim().charAt(0).toUpperCase();
  thumb.appendChild(letter);

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = `${flag(item.country)} ${item.source}`;
  thumb.appendChild(badge);
}

function applyFilters() {
  const q = state.query.trim().toLowerCase();
  const filtered = state.items.filter((item) => {
    if (state.country !== 'all' && item.country !== state.country) return false;
    if (q) {
      const hay = `${item.title} ${item.source} ${item.snippet || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const frag = document.createDocumentFragment();
  for (const item of filtered) frag.appendChild(buildCard(item));
  els.grid.replaceChildren(frag);

  if (filtered.length === 0) {
    els.status.textContent = 'No hay noticias que coincidan con el filtro.';
    els.status.classList.remove('error');
  } else {
    const total = state.items.length;
    els.status.textContent =
      filtered.length === total
        ? `${total} noticias`
        : `${filtered.length} de ${total} noticias`;
    els.status.classList.remove('error');
  }
}

function buildChips() {
  // Cuenta noticias por país presente en los datos.
  const counts = {};
  for (const item of state.items) counts[item.country] = (counts[item.country] || 0) + 1;

  const present = Object.keys(counts).sort(
    (a, b) => COUNTRY_ORDER.indexOf(a) - COUNTRY_ORDER.indexOf(b)
  );

  const chips = [{ code: 'all', label: 'Todos', count: state.items.length }];
  for (const code of present) {
    chips.push({ code, label: `${flag(code)} ${state.labels[code] || code}`, count: counts[code] });
  }

  els.chips.replaceChildren();
  for (const c of chips) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (c.code === state.country ? ' active' : '');
    btn.dataset.code = c.code;
    btn.innerHTML = `${c.label} <span class="count">${c.count}</span>`;
    btn.addEventListener('click', () => {
      state.country = c.code;
      for (const el of els.chips.children) el.classList.toggle('active', el.dataset.code === c.code);
      applyFilters();
      window.scrollTo({ top: els.grid.offsetTop - 120, behavior: 'smooth' });
    });
    els.chips.appendChild(btn);
  }
}

// --- Carga de datos --------------------------------------------------------

async function loadData({ bust = false } = {}) {
  els.refresh.classList.add('is-loading');
  try {
    const url = bust ? `${DATA_URL}?t=${Date.now()}` : DATA_URL;
    const res = await fetch(url, { cache: bust ? 'reload' : 'default' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    state.items = Array.isArray(data.items) ? data.items : [];
    state.labels = {};
    for (const s of data.sources || []) state.labels[s.country] = s.countryLabel;

    els.updated.textContent = data.updatedAt
      ? `Actualizado ${timeAgo(data.updatedAt)}`
      : '';

    buildChips();
    applyFilters();
  } catch (err) {
    els.status.textContent =
      'No se pudieron cargar las noticias. Ejecuta el scraper para generar data/news.json.';
    els.status.classList.add('error');
    els.grid.replaceChildren();
    console.error(err);
  } finally {
    els.refresh.classList.remove('is-loading');
  }
}

// --- Init ------------------------------------------------------------------

function init() {
  els.grid = document.getElementById('grid');
  els.status = document.getElementById('status');
  els.chips = document.getElementById('chips');
  els.search = document.getElementById('search');
  els.updated = document.getElementById('updated');
  els.refresh = document.getElementById('refresh');

  let debounce;
  els.search.addEventListener('input', (e) => {
    clearTimeout(debounce);
    const value = e.target.value;
    debounce = setTimeout(() => {
      state.query = value;
      applyFilters();
    }, 120);
  });

  els.refresh.addEventListener('click', () => loadData({ bust: true }));

  loadData();
}

init();
