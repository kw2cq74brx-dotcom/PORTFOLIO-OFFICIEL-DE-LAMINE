# Portfolio — Baye Lamine Gueye (BTS SIO SLAM)

Site multipage en HTML, CSS et JavaScript (fichiers séparés), construit avec Vite.
Animations : GSAP + ScrollTrigger, défilement fluide : Lenis, composants : Tailwind CSS + daisyUI.

## Lancer le projet

```bash
npm install
npm run dev       # serveur de développement → http://localhost:5173
npm run build     # version de production dans dist/
npm run preview   # tester la version de production
```

## Personnaliser

| Quoi | Où |
|---|---|
| Nom, e-mail, téléphone, WhatsApp, liens, années | `site.config.js` (valeurs injectées via `{{ cle }}`) |
| Photo de profil | `public/images/` puis `photo` dans `site.config.js` |
| CV | `public/docs/cv-baye-lamine-gueye.pdf` |
| Captures des projets | `public/images/projets/` (garder les mêmes noms ou modifier les `<img>`) |
| Textes des pages | les fichiers `.html` à la racine |
| En-tête / menu / pied de page | `partials/` (communs à toutes les pages) |

Les mentions « À COMPLÉTER » et « 20XX » signalent les informations à renseigner.

## Structure

```
*.html                  9 pages (accueil, à propos, formations, compétences,
                        expériences, projets, veille, synthèse, contact)
partials/               head, header (+ menu mobile), footer (+ bouton WhatsApp)
src/styles/             base · layout · components · pages
src/js/core/            défilement (Lenis), navigation, transition de page
src/js/components/      header, menu mobile, formulaire de contact
src/js/animations/      titres, images pixelisées, transitions en pixels,
                        boîtes flottantes, tableau de synthèse
```

## Crédits

Design et animations adaptés de [Atelier North](https://github.com/codrops/atelier-north)
de Kaisei Sadatoki pour Codrops — licence MIT.
