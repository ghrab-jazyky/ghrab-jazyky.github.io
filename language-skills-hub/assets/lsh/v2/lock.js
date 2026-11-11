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
  // Students see the card in the locked language, so the lock texts follow it
  // (same wording as the Reading Lab cards).
  const t = {
    en: {note: 'Teacher-selected language and CEFR level.', lang: 'Language set by your teacher.', level: 'Level set by your teacher.', hint: 'Controls are locked in this view only.'},
    es: {note: 'Idioma y nivel MCER seleccionados por el profesor.', lang: 'Idioma elegido por el profesor.', level: 'Nivel elegido por el profesor.', hint: 'Los controles solo están bloqueados en esta vista.'},
    de: {note: 'Sprache und GER-Niveau wurden von der Lehrkraft gewählt.', lang: 'Sprache von der Lehrkraft festgelegt.', level: 'Niveau von der Lehrkraft festgelegt.', hint: 'Die Auswahl ist nur in dieser Ansicht gesperrt.'},
    fr: {note: 'Langue et niveau CECR définis par l’enseignant.', lang: 'Langue choisie par l’enseignant.', level: 'Niveau choisi par l’enseignant.', hint: 'Les choix sont verrouillés dans cet affichage uniquement.'}
  }[lang];
  langSelect.disabled = true;
  langSelect.title = t.lang;
  buttons.forEach(b => { b.disabled = true; b.title = t.level; });
  const controls = document.querySelector('.controls');
  if (controls) {
    const note = document.createElement('span');
    note.className = 'pill';
    note.lang = lang;
    note.textContent = '🔒 ' + t.note;
    note.title = t.hint;
    note.setAttribute('role','status');
    controls.appendChild(note);
  }
})();
