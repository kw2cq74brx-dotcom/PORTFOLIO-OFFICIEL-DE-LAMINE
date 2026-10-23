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
  siSqlite,
  siPrisma,
  siVirtualbox,
  siLinux,
  siGit,
  siGithub,
  siMarkdown,
  siJira,
  siOwasp,
  siLetsencrypt,
  siJsonwebtokens,
  siBitwarden,
  siWireshark,
  siKalilinux,
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
  itil: {
    title: 'ITIL',
    // Cycle de vie des services
    svg: '<path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" /><path d="M17.7 2.8v3.8h-3.8M6.3 21.2v-3.8h3.8" /><circle cx="12" cy="12" r="2.2" />',
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
};

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
  sqlite: siSqlite,
  prisma: siPrisma,
  virtualbox: siVirtualbox,
  linux: siLinux,
  git: siGit,
  github: siGithub,
  markdown: siMarkdown,
  jira: siJira,
  owasp: siOwasp,
  letsencrypt: siLetsencrypt,
  jwt: siJsonwebtokens,
  bitwarden: siBitwarden,
  wireshark: siWireshark,
  kali: siKalilinux,
  ...customIcons,
};
