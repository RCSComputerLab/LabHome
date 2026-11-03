/* Pixel Art: color-by-number Thanksgiving pictures, or free drawing on a blank grid. */
(function () {
  const { COLORS, PICTURES, FREE_COLORS } = window.PixelPictures;
  const FREE_SIZES = { small: 10, medium: 16, large: 24 };
  const GRADE_SIZE = { K: 'small', 1: 'small', 2: 'small', 3: 'medium', 4: 'medium', 5: 'large', 6: 'large' };
  const CONFIG_URL = '../../data/config.json';

  const board = document.getElementById('board');
  const palette = document.getElementById('palette');
  const picturesEl = document.getElementById('pictures');
  const picturePanel = document.getElementById('picture-panel');
  const paletteTitle = document.getElementById('palette-title');
  const progress = document.getElementById('progress');
  const doneBanner = document.getElementById('done-banner');
  const startOver = document.getElementById('start-over');

  let mode = 'number';
  let size = 'medium';
  let sizeChosen = false;   // once a student picks a size, the lab's grade no longer changes it
  let pictureIdx = 0;
  let selected = null;      // number (color by number), color hex, or 'erase' (free draw)
  let numberColors = [];    // color by number: index + 1 is the number shown in the squares
  let painting = false;
  let lastCell = null;

  Sky.buildSky();

  /* ---------- Building the board ---------- */

  function picture() {
    return PICTURES[size][pictureIdx];
  }

  function build() {
    board.classList.remove('complete');
    doneBanner.hidden = true;
    lastCell = null;
    if (mode === 'number') buildNumber(); else buildFree();
    renderPickers();
    sizeNumbers();
  }

  function buildNumber() {
    const rows = picture().rows;
    const letters = [];
    rows.join('').split('').forEach(ch => { if (ch !== '.' && !letters.includes(ch)) letters.push(ch); });
    numberColors = letters.map(ch => COLORS[ch].hex);

    board.style.setProperty('--n', rows.length);
    board.innerHTML = rows.map(row => row.split('').map(ch => ch === '.'
      ? '<div class="cell bg"></div>'
      : `<div class="cell" data-num="${letters.indexOf(ch) + 1}">${letters.indexOf(ch) + 1}</div>`).join('')).join('');

    selected = 1;
    renderNumberPalette();
    updateProgress();
  }

  function buildFree() {
    const n = FREE_SIZES[size];
    board.style.setProperty('--n', n);
    board.innerHTML = '<div class="cell"></div>'.repeat(n * n);
    if (!FREE_COLORS.includes(selected)) selected = FREE_COLORS[0];
    renderFreePalette();
    progress.textContent = '';
  }

  function sizeNumbers() {
    const n = +getComputedStyle(board).getPropertyValue('--n');
    board.style.setProperty('--num-size', Math.max(8, Math.round(board.clientWidth / n * 0.48)) + 'px');
  }

  /* ---------- Pickers and palette ---------- */

  function renderPickers() {
    document.querySelectorAll('#mode-picker button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === mode));
    document.querySelectorAll('#size-picker button').forEach(b => b.setAttribute('aria-selected', b.dataset.size === size));
    picturePanel.hidden = mode !== 'number';
    paletteTitle.textContent = mode === 'number' ? 'Pick a color, then fill its squares' : 'Pick a color';
    picturesEl.innerHTML = PICTURES[size].map((p, i) => `
      <button type="button" class="picture-btn" data-picture="${i}" aria-pressed="${i === pictureIdx}">
        ${thumbnail(p.rows)}${p.name}
      </button>`).join('');
  }

  /** A tiny finished version of the picture, so kids see exactly what they'll make. */
  function thumbnail(rows) {
    const n = rows.length;
    const rects = [];
    rows.forEach((row, y) => row.split('').forEach((ch, x) => {
      if (ch !== '.') rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${COLORS[ch].hex}"/>`);
    }));
    return `<svg class="pic-thumb" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true">${rects.join('')}</svg>`;
  }

  function renderNumberPalette() {
    palette.innerHTML = numberColors.map((hex, i) => `
      <button type="button" class="swatch" data-num="${i + 1}" style="--c:${hex};--txt:${textOn(hex)}"
        aria-pressed="${selected === i + 1}" aria-label="Color ${i + 1}">${i + 1}</button>`).join('');
    markHints();
  }

  function renderFreePalette() {
    palette.innerHTML = FREE_COLORS.map(hex => `
      <button type="button" class="swatch" data-color="${hex}" style="--c:${hex}"
        aria-pressed="${selected === hex}" aria-label="Color"></button>`).join('') +
      `<button type="button" class="swatch eraser" data-color="erase" aria-pressed="${selected === 'erase'}"
        aria-label="Eraser" title="Eraser">🧽</button>`;
  }

  /** Light the squares that still need the chosen number. */
  function markHints() {
    board.querySelectorAll('.cell[data-num]').forEach(c => {
      c.classList.toggle('hint', +c.dataset.num === selected && !c.classList.contains('filled'));
    });
    palette.querySelectorAll('.swatch').forEach(s => {
      const num = +s.dataset.num;
      s.classList.toggle('done', !board.querySelector(`.cell[data-num="${num}"]:not(.filled)`));
    });
  }

  function textOn(hex) {
    const v = parseInt(hex.slice(1), 16);
    const lum = 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
    return lum > 170 ? '#3a2a10' : '#ffffff';
  }

  document.getElementById('mode-picker').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (!b || b.dataset.mode === mode) return;
    mode = b.dataset.mode;
    build();
  });

  document.getElementById('size-picker').addEventListener('click', e => {
    const b = e.target.closest('[data-size]');
    if (!b) return;
    sizeChosen = true;
    if (b.dataset.size === size) return;
    size = b.dataset.size;
    build();
  });

  picturesEl.addEventListener('click', e => {
    const b = e.target.closest('[data-picture]');
    if (!b) return;
    pictureIdx = +b.dataset.picture;
    build();
  });

  palette.addEventListener('click', e => {
    const s = e.target.closest('.swatch');
    if (!s) return;
    selected = s.dataset.num ? +s.dataset.num : s.dataset.color;
    palette.querySelectorAll('.swatch').forEach(x => x.setAttribute('aria-pressed', x === s));
    if (mode === 'number') markHints();
  });

  /* ---------- Painting ---------- */

  board.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    e.preventDefault();
    painting = true;
    lastCell = null;
    lastPoint = { x: e.clientX, y: e.clientY };
    paintAt(e.clientX, e.clientY);
  });

  // Fill every square between pointer events, so a quick swipe doesn't skip any.
  let lastPoint = null;
  window.addEventListener('pointermove', e => {
    if (!painting) return;
    const step = board.clientWidth / +getComputedStyle(board).getPropertyValue('--n') / 3;
    const dx = e.clientX - lastPoint.x, dy = e.clientY - lastPoint.y;
    const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step));
    for (let i = 1; i <= count; i++) paintAt(lastPoint.x + dx * i / count, lastPoint.y + dy * i / count);
    lastPoint = { x: e.clientX, y: e.clientY };
  });
  window.addEventListener('pointerup', () => { painting = false; });
  window.addEventListener('pointercancel', () => { painting = false; });

  function paintAt(x, y) {
    const cell = document.elementFromPoint(x, y);
    if (!cell || !cell.classList.contains('cell') || cell.parentElement !== board || cell === lastCell) return;
    lastCell = cell;
    if (mode === 'number') paintNumber(cell); else paintFree(cell);
  }

  function paintFree(cell) {
    cell.style.background = selected === 'erase' ? '' : selected;
  }

  function paintNumber(cell) {
    if (!cell.dataset.num || cell.classList.contains('filled')) return;
    if (+cell.dataset.num !== selected) {
      cell.classList.remove('wrong');
      void cell.offsetWidth;
      cell.classList.add('wrong');
      return;
    }
    cell.classList.add('filled');
    cell.classList.remove('hint');
    cell.style.background = numberColors[selected - 1];
    if (!board.querySelector(`.cell[data-num="${selected}"]:not(.filled)`)) markHints();
    updateProgress();
  }

  function updateProgress() {
    const total = board.querySelectorAll('.cell[data-num]').length;
    const done = board.querySelectorAll('.cell.filled').length;
    progress.textContent = `${done} of ${total} squares colored`;
    if (total && done === total) finish();
  }

  function finish() {
    painting = false;
    board.classList.add('complete');
    doneBanner.textContent = `🎉 You made a ${picture().name}!`;
    doneBanner.hidden = false;
    Sky.celebrate();
  }

  // Ask twice so one stray click doesn't erase the picture.
  let confirmTimer = null;
  startOver.addEventListener('click', () => {
    if (!startOver.classList.contains('confirm')) {
      startOver.classList.add('confirm');
      startOver.textContent = '❓ Tap again to clear';
      confirmTimer = setTimeout(resetStartOver, 3000);
      return;
    }
    clearTimeout(confirmTimer);
    resetStartOver();
    build();
  });

  function resetStartOver() {
    startOver.classList.remove('confirm');
    startOver.textContent = '🔄 Start over';
  }

  window.addEventListener('resize', sizeNumbers);

  /* ---------- Start: grid size follows the grade picked in the control center ---------- */

  build();
  fetch(CONFIG_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(c => {
      const wanted = c && GRADE_SIZE[c.currentGrade];
      if (wanted && !sizeChosen && wanted !== size) {
        size = wanted;
        build();
      }
    })
    .catch(() => {});
})();
