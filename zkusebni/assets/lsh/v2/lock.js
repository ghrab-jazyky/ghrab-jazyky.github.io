/* LSH E2: UI-only teacher preset lock for existing Conversation Lab cards.
   Not a security control. No network, local storage, or analytics. */
(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  if (params.getAll('zamek').length !== 1 || params.get('zamek') !== '1') return;
  const langs = ['en','es','de','fr'];
  const levels = ['A1','A2','B1','B2','C1','C2'];
  if (params.getAll('lang').length !== 1 || params.getAll('level').length !== 1) return;
  const lang = params.get('lang');
  const level = params.get('level');
  if (!langs.includes(lang) || !levels.includes(level)) return;
  const langSelect = document.getElementById('languageSelect');
  const buttons = Array.from(document.querySelectorAll('#levelSwitch button[data-level]'));
  if (!langSelect || !buttons.length) return;
  // Validate that the original card actually honoured the requested preset.
  if (langSelect.value !== lang || !buttons.some(b => b.dataset.level === level && b.classList.contains('active'))) return;
  langSelect.disabled = true;
  langSelect.title = 'Jazyk přednastavil učitel (zámek pouze v rozhraní).';
  buttons.forEach(b => { b.disabled = true; b.title = 'Úroveň přednastavil učitel (zámek pouze v rozhraní).'; });
  const controls = document.querySelector('.controls');
  if (controls) {
    const note = document.createElement('span');
    note.className = 'pill';
    note.textContent = '🔒 Jazyk a úroveň určeny učitelem';
    note.title = 'Pouze zámek ovládání. Odkaz není zabezpečen.';
    note.setAttribute('role','status');
    controls.appendChild(note);
  }
})();
