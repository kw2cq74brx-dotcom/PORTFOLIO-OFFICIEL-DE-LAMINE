// Veille — mise à jour automatique depuis les flux RSS (fonction serveur api/veille.js).
// Les cartes écrites dans la page servent de repli : sans réseau ou si un flux ne répond pas,
// elles restent affichées. Sinon, chaque emplacement du carrousel reçoit un article récent
// (le nombre de cartes ne change pas, l'animation n'a donc pas à être reconstruite) et chaque
// source affiche son dernier article.

const ENDPOINT = '/api/veille';

const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Même article malgré un « www. » ou une barre finale en plus ou en moins
const sameLink = (url) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

const isSafe = (url) => typeof url === 'string' && url.startsWith('https://');

export async function initVeilleFeed() {
  const cards = [...document.querySelectorAll('.js-reads-card')];
  const sources = [...document.querySelectorAll('.js-depth-card[data-feed]')];
  if (!cards.length && !sources.length) return;

  let data;
  try {
    const response = await fetch(ENDPOINT, { headers: { accept: 'application/json' } });
    if (!response.ok) return;
    data = await response.json();
  } catch {
    return;
  }

  // Dernier article de chaque source
  sources.forEach((card) => {
    const latest = data.sources?.[card.dataset.feed]?.latest;
    const link = card.querySelector('.js-feed-latest');
    if (!latest || !link || !isSafe(latest.link)) return;
    link.href = latest.link;
    link.textContent = latest.title;
    card.querySelector('.js-feed-date').textContent = formatDate(latest.date);
  });

  // Les résumés rédigés à la main sont conservés tant que l'article reste dans la sélection
  const summaries = new Map(
    cards.map((card) => [sameLink(card.querySelector('.p-reads__link').href), card.querySelector('.p-reads__summary').textContent]),
  );

  const articles = (data.articles ?? []).filter((article) => isSafe(article.link));
  cards.forEach((card, i) => {
    const article = articles[i];
    if (!article) return;
    const [source, date] = card.querySelectorAll('.p-reads__meta span');
    source.textContent = article.source;
    date.textContent = `${formatDate(article.date)} · ${article.lang}`;
    card.querySelector('.p-reads__name').textContent = article.title;
    card.querySelector('.p-reads__summary').textContent = summaries.get(sameLink(article.link)) ?? article.summary;
    const link = card.querySelector('.p-reads__link');
    link.href = article.link;
    link.setAttribute('aria-label', `Lire l'article : ${article.title} (nouvel onglet)`);
  });
}
