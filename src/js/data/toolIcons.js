// Logos officiels (Simple Icons, licence CC0) et pictogrammes maison utilisés par les cartes de la page compétences.
// La clé correspond à l'attribut data-icon d'une carte : <span class="c-tool__logo" data-icon="react">
import {
  siHtml5,
  siCss,
  siJavascript,
  siReact,
  siNextdotjs,
  siTailwindcss,
  siPhp,
  siPython,
  siMysql,
  siMariadb,
  siPostgresql,
  siPrisma,
  siVirtualbox,
  siGit,
  siGithub,
  siJira,
  siLetsencrypt,
  siJsonwebtokens,
} from 'simple-icons';

// Pictogrammes maison (tracé au trait) pour les notions sans logo officiel
const customIcons = {
  merise: {
    title: 'Merise',
    // Deux entités reliées par une association
    svg: '<rect x="2" y="3" width="7" height="5" rx="1" /><rect x="15" y="3" width="7" height="5" rx="1" /><ellipse cx="12" cy="17.5" rx="4.5" ry="3" /><path d="M5.5 8v4.5l3.2 3M18.5 8v4.5l-3.2 3" />',
  },
  uml: {
    title: 'UML',
    // Classe en trois compartiments et flèche d'héritage
    svg: '<rect x="4" y="2.5" width="16" height="12" rx="1" /><path d="M4 6.5h16M4 10.5h16M12 14.5v3" /><path d="M12 17.5l3.5 4h-7z" />',
  },
  sql: {
    title: 'SQL',
    // Base de données (cylindre)
    svg: '<ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />',
  },
  glpi: {
    title: 'GLPI',
    // Fiche d'inventaire cochée
    svg: '<rect x="5" y="3.5" width="14" height="18" rx="2" /><path d="M9 2.5h6v3H9z" /><path d="M8.5 10l1.5 1.5 2.5-2.5M14 10.5h2.5M8.5 15.5l1.5 1.5 2.5-2.5M14 16h2.5" />',
  },
  rgpd: {
    title: 'RGPD',
    // Cercle d'étoiles européen et cadenas
    svg: '<circle cx="21.50" cy="12.00" r="0.9" fill="currentColor" stroke="none" /><circle cx="20.23" cy="16.75" r="0.9" fill="currentColor" stroke="none" /><circle cx="16.75" cy="20.23" r="0.9" fill="currentColor" stroke="none" /><circle cx="12.00" cy="21.50" r="0.9" fill="currentColor" stroke="none" /><circle cx="7.25" cy="20.23" r="0.9" fill="currentColor" stroke="none" /><circle cx="3.77" cy="16.75" r="0.9" fill="currentColor" stroke="none" /><circle cx="2.50" cy="12.00" r="0.9" fill="currentColor" stroke="none" /><circle cx="3.77" cy="7.25" r="0.9" fill="currentColor" stroke="none" /><circle cx="7.25" cy="3.77" r="0.9" fill="currentColor" stroke="none" /><circle cx="12.00" cy="2.50" r="0.9" fill="currentColor" stroke="none" /><circle cx="16.75" cy="3.77" r="0.9" fill="currentColor" stroke="none" /><circle cx="20.23" cy="7.25" r="0.9" fill="currentColor" stroke="none" /><rect x="8.5" y="11" width="7" height="6" rx="1" /><path d="M10 11V9.3a2 2 0 0 1 4 0V11" />',
  },
  mfa: {
    title: 'Authentification multifacteur',
    // Téléphone et bouclier validé
    svg: '<rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M10.5 18.5h3" /><path d="M12 6.5l3.5 1.3v2.7c0 2.2-1.5 3.7-3.5 4.5-2-.8-3.5-2.3-3.5-4.5V7.8z" /><path d="M10.6 10.6l1 1 1.8-1.9" />',
  },
  // Modules du programme (page formations)
  support: {
    title: 'Support et services',
    // Casque d'assistance
    svg: '<path d="M4 14v-2a8 8 0 0 1 16 0v2" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.7-2 2.5-5 2.5h-1.5" />',
  },
  code: {
    title: 'Développement',
    // Fenêtre d'éditeur et chevrons
    svg: '<rect x="2.5" y="4" width="19" height="16" rx="2" /><path d="M2.5 8h19" /><path d="M9.5 11.5L7 14l2.5 2.5M14.5 11.5L17 14l-2.5 2.5" />',
  },
  shield: {
    title: 'Cybersécurité',
    // Bouclier et serrure
    svg: '<path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6z" /><rect x="9" y="11" width="6" height="5" rx="1" /><path d="M10.3 11V9.6a1.7 1.7 0 0 1 3.4 0V11" />',
  },
  book: {
    title: 'Enseignements généraux',
    // Livre ouvert
    svg: '<path d="M12 6.5C10 5 7 4.5 3 5v13.5c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z" /><path d="M12 6.5V20" />',
  },
  rocket: {
    title: 'Débouchés',
    // Fusée au décollage
    svg: '<path d="M12 2.5c3 2.2 4.5 5.5 4.5 9.5l-2 3.5h-5l-2-3.5c0-4 1.5-7.3 4.5-9.5z" /><circle cx="12" cy="9.5" r="1.8" /><path d="M7.5 12L5 15.5l2.8.5M16.5 12l2.5 3.5-2.8.5M10.5 18.5L12 21.5l1.5-3" />',
  },
};

// Remplace chaque [data-icon] par son SVG : logo officiel (tracé plein) ou pictogramme maison (tracé au trait)
export function injectIcons(root) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const icon = toolIcons[el.dataset.icon];
    if (!icon) return;
    el.innerHTML = icon.path
      ? `<svg viewBox="0 0 24 24" role="img" aria-label="${icon.title}"><path d="${icon.path}" /></svg>`
      : `<svg viewBox="0 0 24 24" role="img" aria-label="${icon.title}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`;
  });
}

export const toolIcons = {
  html5: siHtml5,
  css: siCss,
  javascript: siJavascript,
  react: siReact,
  nextjs: siNextdotjs,
  tailwind: siTailwindcss,
  php: siPhp,
  python: siPython,
  mysql: siMysql,
  mariadb: siMariadb,
  postgresql: siPostgresql,
  prisma: siPrisma,
  virtualbox: siVirtualbox,
  git: siGit,
  github: siGithub,
  jira: siJira,
  letsencrypt: siLetsencrypt,
  jwt: siJsonwebtokens,
  ...customIcons,
};
