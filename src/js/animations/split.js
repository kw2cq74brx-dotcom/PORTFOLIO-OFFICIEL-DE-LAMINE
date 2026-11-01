// Découpe un texte en lettres animables (<span class="char">), regroupées par mot
// pour que les retours à la ligne se fassent entre les mots et pas au milieu.
// Les <br> sont conservés ; le texte original reste lisible par les lecteurs d'écran.
export function splitChars(target) {
  const label = target.textContent.replace(/\s+/g, ' ').trim();
  const nodes = [...target.childNodes];
  const chars = [];

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');

  nodes.forEach((node) => {
    if (node.nodeName === 'BR') {
      visual.appendChild(node);
      return;
    }

    node.textContent.split(/(\s+)/).forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        visual.appendChild(document.createTextNode(' '));
        return;
      }

      const word = document.createElement('span');
      word.className = 'word';
      [...token].forEach((letter) => {
        const char = document.createElement('span');
        char.className = 'char';
        char.textContent = letter;
        word.appendChild(char);
        chars.push(char);
      });
      visual.appendChild(word);
    });
  });

  const srOnly = document.createElement('span');
  srOnly.className = 'sr-only';
  srOnly.textContent = label;

  target.replaceChildren(srOnly, visual);
  return chars;
}

// Découpe un texte en mots animables, sans toucher aux balises qu'il contient (<strong>, <a>…)
export function splitWords(target) {
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  const words = [];
  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        fragment.appendChild(document.createTextNode(' '));
        return;
      }
      const word = document.createElement('span');
      word.className = 'word';
      word.textContent = token;
      fragment.appendChild(word);
      words.push(word);
    });
    node.replaceWith(fragment);
  });
  return words;
}
