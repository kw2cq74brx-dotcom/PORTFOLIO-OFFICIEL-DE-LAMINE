import { ScrollTrigger } from '../lib/gsap.js';

// Lance une animation d'entrée au bon moment :
//  - sur sa propre page : à l'ouverture de la page (événement page:enter) ;
//  - dans une section de l'accueil ([data-section]) : quand le visiteur arrive sur la section.
export function onReveal(target, play) {
  const section = target?.closest('[data-section]');
  if (section) ScrollTrigger.create({ trigger: section, start: 'top 75%', once: true, onEnter: play });
  else document.addEventListener('page:enter', play, { once: true });
}
