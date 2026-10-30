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
  cv: 'docs/cv-baye-lamine-gueye.pdf', // À COMPLÉTER : dépose ton CV à cet emplacement

  // Réseaux
  linkedin: 'https://www.linkedin.com/', // À COMPLÉTER
  github: 'https://github.com/', // À COMPLÉTER

  // Liens des projets
  mdsAvisUrl: '#', // À COMPLÉTER : URL du site MDS Avis
  pythonAppUrl: '#', // À COMPLÉTER : URL de l'application Python
  modelsMapsUrl: '#', // À COMPLÉTER : URL de Model's Maps (si en ligne)

  // Années des formations
  yearsSio: '20XX — 20XX', // À COMPLÉTER
  yearsEsat: '20XX — 20XX', // À COMPLÉTER
  yearsBac: '20XX', // À COMPLÉTER
  yearsClaude: '20XX', // À COMPLÉTER : année de la certification Claude
  // Page du cours Claude 101 (Anthropic Academy) ; à remplacer par le lien personnel
  // de vérification du certificat (verify.skilljar.com/c/…) une fois obtenu
  claudeCertUrl: 'https://anthropic.skilljar.com/claude-101',
};
