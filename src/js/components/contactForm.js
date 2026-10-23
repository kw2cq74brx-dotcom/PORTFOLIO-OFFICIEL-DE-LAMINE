// Formulaire sans serveur : il prépare un e-mail dans la messagerie du visiteur.
export function initContactForm() {
  const form = document.querySelector('.js-contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const sender = `${data.get('firstName')} ${data.get('lastName')}`.trim();
    const subject = `Contact portfolio — ${sender}`;
    const body = [
      data.get('message'),
      '',
      '—',
      sender,
      data.get('email'),
      data.get('phone'),
    ]
      .filter((line) => line !== null)
      .join('\n');

    window.location.href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}
