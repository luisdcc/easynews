// Scraper de EasyNews.
//
// Recorre los feeds RSS definidos en sources.mjs, extrae las últimas noticias
// (título, enlace, imagen, resumen, fecha) y escribe un único archivo estático
// `data/news.json` que la SPA consume directamente. No necesita servidor.
//
// Uso:  node scrape.mjs

import Parser from 'rss-parser';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sources } from './sources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, '..', 'data', 'news.json');

const PER_SOURCE = 14; // máximo de noticias que guardamos por medio
const TIMEOUT_MS = 15000;

const parser = new Parser({
  timeout: TIMEOUT_MS,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; EasyNewsBot/1.0; +https://github.com/)',
    Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

// --- Helpers ---------------------------------------------------------------

function urlFrom(node) {
  if (!node) return null;
  if (typeof node === 'string') return node;
  if (node.$ && node.$.url) return node.$.url;
  if (node.url) return node.url;
  return null;
}

const IMG_TAG_RE = /<img[^>]+src=["']([^"']+)["']/i;
const IMG_EXT_RE = /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i;

// Intenta encontrar la imagen de portada de una noticia, probando los lugares
// habituales donde los feeds la publican, en orden de preferencia.
function extractImage(item) {
  const candidates = [];

  if (Array.isArray(item.mediaContent)) {
    for (const m of item.mediaContent) {
      const type = m?.$?.type || '';
      const medium = m?.$?.medium || '';
      if (medium === 'image' || type.startsWith('image') || (!type && !medium)) {
        candidates.push(urlFrom(m));
      }
    }
  }
  if (Array.isArray(item.mediaThumbnail)) {
    for (const m of item.mediaThumbnail) candidates.push(urlFrom(m));
  }
  if (item.enclosure) {
    const type = item.enclosure.type || '';
    if (type.startsWith('image') || IMG_EXT_RE.test(item.enclosure.url || '')) {
      candidates.push(item.enclosure.url);
    }
  }
  candidates.push(urlFrom(item['itunes:image']));

  const html =
    item.contentEncoded || item['content:encoded'] || item.content || item.summary || item.description || '';
  const match = IMG_TAG_RE.exec(html);
  if (match) candidates.push(match[1]);

  // Nos quedamos con la primera candidata válida, forzando https para que el
  // navegador no la bloquee por contenido mixto en el sitio (que sí es https).
  for (let url of candidates) {
    if (!url) continue;
    url = url.trim();
    if (url.startsWith('//')) url = 'https:' + url;
    else if (url.startsWith('http://')) url = 'https://' + url.slice(7);
    if (url.startsWith('https://')) return url;
  }
  return null;
}

function stripHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function makeId(link, title) {
  return createHash('sha1')
    .update(`${link || ''}|${title || ''}`)
    .digest('hex')
    .slice(0, 12);
}

// --- Scraping --------------------------------------------------------------

async function scrapeSource(src) {
  const feed = await parser.parseURL(src.url);
  return (feed.items || [])
    .slice(0, PER_SOURCE)
    .map((it) => {
      const link = (it.link || it.guid || '').trim();
      const title = stripHtml(it.title);
      const isoDate =
        it.isoDate || (it.pubDate ? safeIso(it.pubDate) : null);
      return {
        id: makeId(link, title),
        title,
        link,
        image: extractImage(it),
        snippet: stripHtml(it.contentSnippet || it.summary || it.description).slice(0, 180),
        source: src.name,
        sourceId: src.id,
        country: src.country,
        countryLabel: src.countryLabel,
        isoDate,
      };
    })
    .filter((x) => x.title && /^https?:\/\//.test(x.link));
}

function safeIso(value) {
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

async function main() {
  console.log(`Scrapeando ${sources.length} medios...\n`);

  const results = await Promise.allSettled(sources.map(scrapeSource));

  const items = [];
  const okSources = [];
  let failed = 0;

  results.forEach((res, i) => {
    const src = sources[i];
    if (res.status === 'fulfilled') {
      items.push(...res.value);
      okSources.push({
        id: src.id,
        name: src.name,
        country: src.country,
        countryLabel: src.countryLabel,
      });
      console.log(`  ✓ ${src.name.padEnd(22)} ${res.value.length} noticias`);
    } else {
      failed++;
      console.warn(`  ✗ ${src.name.padEnd(22)} ${res.reason?.message || res.reason}`);
    }
  });

  // Elimina duplicados (misma noticia sindicada en varios feeds).
  const seen = new Set();
  const deduped = items.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));

  // Ordena de más reciente a más antigua; las sin fecha quedan al final.
  deduped.sort((a, b) => {
    const ta = a.isoDate ? Date.parse(a.isoDate) : 0;
    const tb = b.isoDate ? Date.parse(b.isoDate) : 0;
    return tb - ta;
  });

  const output = {
    updatedAt: new Date().toISOString(),
    count: deduped.length,
    sources: okSources.sort((a, b) => a.name.localeCompare(b.name, 'es')),
    items: deduped,
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(
    `\nListo: ${deduped.length} noticias de ${okSources.length}/${sources.length} medios` +
      (failed ? ` (${failed} fallaron)` : '') +
      `\nEscrito en ${OUT_FILE}`
  );
}

main().catch((err) => {
  console.error('Error fatal en el scraper:', err);
  process.exit(1);
});
