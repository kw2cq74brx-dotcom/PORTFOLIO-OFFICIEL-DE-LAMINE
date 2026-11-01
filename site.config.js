// =========================================================
//  Informations personnelles du portfolio
//  Chaque valeur est injectée dans les pages HTML via {{ cle }}.
//  ⚠️ Les lignes marquées « À COMPLÉTER » contiennent des valeurs d'exemple.
// =========================================================
export default {
  firstName: 'Baye Lamine',
  lastName: 'Gueye',
  fullName: 'Baye Lamine Gueye',
  role: 'Étudiant en BTS SIO — option SLAM',
  city: 'Paris, France',
  year: new Date().getFullYear(),

  email: 'bayelamine.gueye19@gmail.com',
  phone: '07 59 06 20 43',
  phoneLink: '+33759062043', // format international, sans espaces, pour le lien tel:
  whatsapp: '33759062043', // indicatif + numéro, sans « + » ni espaces

  // Fichiers à déposer dans /public
  photo: 'images/profil.jpg',
  photoHero: 'images/profil-hero.jpg',
  cv: 'docs/cv-baye-lamine-gueye.pdf',

  // Réseaux
  linkedin: 'https://www.linkedin.com/in/baye-lamine-gueye-b760a8341',
  github: 'https://github.com/kw2cq74brx-dotcom/PORTFOLIO-OFFICIEL-DE-LAMINE',

  // Liens des projets
  mdsAvisUrl: 'https://mds-avis-frontend.vercel.app',
  pythonAppUrl: '#', // À COMPLÉTER : URL de l'application Python
  modelsMapsUrl: 'https://modelsmap-web.onrender.com',

  // Années des formations
  yearsSio: '2025 — 2027',
  yearsEsat: '2022 — 2024',
  yearsBac: '2022',
  yearsClaude: '2026',
  // Page de vérification de mon certificat Claude 101
  claudeCertUrl: 'https://academy.claude.com/verify/cb0e75c2228d372075a6510725b82a47',
};
