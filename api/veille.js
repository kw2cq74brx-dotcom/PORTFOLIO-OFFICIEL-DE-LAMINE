// Veille — fonction serveur (Vercel) : lit les flux RSS des quatre sources et renvoie,
// en JSON, les derniers articles qui parlent d'intelligence artificielle.
// La page Veille l'appelle au chargement (src/js/components/veilleFeed.js) ; le CDN de Vercel
// garde la réponse 30 minutes, donc une nouveauté apparaît au plus tard une demi-heure après
// sa publication. En local, vite.config.js branche la même fonction sur /api/veille.

const SOURCES = [
  { id: 'eenews', name: 'eeNews Europe', lang: 'FR', feed: 'https://www.eenewseurope.com/fr/feed/' },
  { id: 'embedded', name: 'Embedded.com', lang: 'EN', feed: 'https://www.embedded.com/feed/' },
  { id: 'nngroup', name: 'Nielsen Norman Group', lang: 'EN', feed: 'https://www.nngroup.com/feed/rss/' },
  { id: 'smashing', name: 'Smashing Magazine', lang: 'EN', feed: 'https://www.smashingmagazine.com/feed/' },
];

const PER_SOURCE = 2; // articles retenus par source pour le carrousel
const SUMMARY_LENGTH = 220;

// Un article est retenu si son titre parle d'IA (français ou anglais)
const AI_PATTERN =
  /\b(ia|ai|intelligence artificielle|machine learning|apprentissage automatique|tinyml|npu|llms?|neural|neuronal\w*|agenti\w*|agents?|genai|génératif|generative|chatbots?|inference|inférence|copilot)\b/i;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—' };

const decode = (text) =>
  text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });

// Texte brut : sans CDATA, sans balises (le HTML des flux arrive souvent échappé)
const clean = (raw = '') =>
  decode(decode(raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')).replace(/<[^>]+>/g, ' '))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (block, name) => {
  const match = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? match[1] : '';
};

const shorten = (text, length) => {
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.–—-]+$/, '')}…`;
};

// Lien propre : https uniquement, sans paramètres de suivi utm_*
const cleanLink = (raw) => {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:') return null;
    [...url.searchParams.keys()].filter((key) => key.startsWith('utm_')).forEach((key) => url.searchParams.delete(key));
    return url.toString();
  } catch {
    return null;
  }
};

function parseFeed(xml, source) {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>|<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  return blocks
    .map((block) => {
      const title = clean(tag(block, 'title'));
      const link = cleanLink(clean(tag(block, 'link')) || block.match(/<link\b[^>]*href="([^"]+)"/i)?.[1] || '');
      const date = new Date(clean(tag(block, 'pubDate') || tag(block, 'published') || tag(block, 'updated') || tag(block, 'dc:date')));
      const summary = clean(tag(block, 'description') || tag(block, 'summary') || tag(block, 'content:encoded'))
        .replace(/^Summary:\s*/i, '')
        .replace(/\s*(Read Full Article|The post .*? appeared first on .*)$/i, '');
      return { title, link, date, summary: shorten(summary, SUMMARY_LENGTH) };
    })
    .filter((item) => item.title && item.link && !Number.isNaN(item.date.getTime()) && AI_PATTERN.test(item.title))
    .sort((a, b) => b.date - a.date)
    .map((item) => ({ ...item, date: item.date.toISOString(), source: source.name, sourceId: source.id, lang: source.lang }));
}

async function readSource(source) {
  const response = await fetch(source.feed, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; PortfolioVeille/1.0)', accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${source.name} : HTTP ${response.status}`);
  return parseFeed(await response.text(), source);
}

export async function getVeille() {
  const results = await Promise.allSettled(SOURCES.map(readSource));
  const sources = {};
  const articles = [];
  results.forEach((result, i) => {
    const items = result.status === 'fulfilled' ? result.value : [];
    sources[SOURCES[i].id] = { latest: items[0] ?? null };
    articles.push(...items.slice(0, PER_SOURCE));
  });
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return { updatedAt: new Date().toISOString(), sources, articles };
}

// Compatible avec les fonctions Node de Vercel et avec le serveur de Vite (API Node brute)
export default async function handler(req, res) {
  try {
    const data = await getVeille();
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400');
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Flux indisponibles' }));
  }
}
