/* Build a Turkey: drag parts from the tray onto the meadow, then resize, turn and flip them. */
(function () {
  const count = n => Array.from({ length: n }, (_, i) => i + 1);
  // `size` evens out pictures that came from sheets drawn at different scales.
  const KINDS = [
    { id: 'body', label: 'Body', layer: 2, items: count(12), size: 1 },
    { id: 'head', label: 'Head', layer: 4, items: count(12), size: 1 },
    { id: 'tail', label: 'Tail', layer: 0, items: count(6), size: 0.55 },
    { id: 'wing', label: 'Wings', layer: 3, items: count(22), size: 0.4 },   // left and right of each color
    { id: 'feet', label: 'Feet', layer: 1, items: [1, 2, 4], size: 1 }       // yellow, orange, brown
  ];
  const SCENE_PX = 1536;   // width of the meadow picture the parts were drawn for
  const BASE_SIZE = 1.9;   // how big a part starts, compared with its picture size on that meadow
  const MIN_SCALE = 0.4;
  const MAX_SCALE = 2.4;
  const SCALE_STEP = 0.15;
  const TURN_STEP = 15;
  const DRAG_START_PX = 6;

  const scene = document.getElementById('scene');
  const tray = document.getElementById('tray');
  const tabsEl = document.getElementById('tray-tabs');
  const itemsEl = document.getElementById('tray-items');
  const toolsHint = document.getElementById('tools-hint');
  const toolsButtons = document.getElementById('tools-buttons');
  const startOver = document.getElementById('start-over');

  let currentKind = 'body';
  let selected = null;

  Sky.buildSky();

  function src(kind, n) {
    return 'parts/' + kind + '-' + String(n).padStart(2, '0') + '.png';
  }

  // Load every part up front so sizes are known and dragging never waits.
  KINDS.forEach(k => k.items.forEach(n => { new Image().src = src(k.id, n); }));

  /* ---------- Tray ---------- */

  function renderTabs() {
    tabsEl.innerHTML = KINDS.map(k => `
      <button type="button" class="tray-tab" role="tab" data-kind="${k.id}" aria-selected="${k.id === currentKind}">
        <img src="${src(k.id, 1)}" alt="">${k.label}
      </button>`).join('');
  }

  function renderItems() {
    const kind = kindOf(currentKind);
    itemsEl.classList.toggle('many', kind.items.length > 12);
    itemsEl.innerHTML = kind.items.map(n => `
      <div class="tray-item" tabindex="0" role="button" data-src="${src(currentKind, n)}" data-kind="${currentKind}"
        aria-label="${currentKind} ${n}"><img src="${src(currentKind, n)}" alt=""></div>`).join('');
  }

  tabsEl.addEventListener('click', e => {
    const tab = e.target.closest('.tray-tab');
    if (!tab) return;
    currentKind = tab.dataset.kind;
    renderTabs();
    renderItems();
  });

  // Drag a copy out of the tray. A tap without dragging drops it in the middle of the meadow.
  itemsEl.addEventListener('pointerdown', e => {
    const item = e.target.closest('.tray-item');
    if (!item || e.button > 0) return;
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    let ghost = null;

    const move = ev => {
      if (!ghost && Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_START_PX) return;
      if (!ghost) {
        ghost = document.createElement('img');
        ghost.className = 'ghost';
        ghost.src = item.dataset.src;
        ghost.style.width = partWidthPx(item.dataset.kind, item.querySelector('img').naturalWidth, 1) + 'px';
        document.body.appendChild(ghost);
      }
      ghost.style.left = ev.clientX + 'px';
      ghost.style.top = ev.clientY + 'px';
      scene.classList.toggle('drop-ready', overScene(ev));
    };
    const up = ev => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      scene.classList.remove('drop-ready');
      if (ghost) {
        ghost.remove();
        if (ev.type === 'pointerup' && overScene(ev)) addPart(item.dataset.kind, item.dataset.src, toScene(ev));
      } else if (ev.type === 'pointerup') {
        addPart(item.dataset.kind, item.dataset.src, nearCenter());
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });

  itemsEl.addEventListener('keydown', e => {
    const item = e.target.closest('.tray-item');
    if (!item || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    addPart(item.dataset.kind, item.dataset.src, nearCenter());
  });

  /* ---------- Placed parts ---------- */

  function partWidthPx(kind, naturalWidth, scale) {
    return scene.clientWidth * naturalWidthPct(kind, naturalWidth, scale) / 100;
  }

  function naturalWidthPct(kind, naturalWidth, scale) {
    return (naturalWidth || 140) * kindOf(kind).size * BASE_SIZE / SCENE_PX * scale * 100;
  }

  function kindOf(id) {
    return KINDS.find(k => k.id === id) || KINDS[0];
  }

  function layerOf(kind) {
    return kindOf(kind).layer;
  }

  function addPart(kind, imgSrc, pos) {
    const el = document.createElement('img');
    el.className = 'part';
    el.src = imgSrc;
    el.alt = kind;
    el.draggable = false;
    el.dataset.kind = kind;
    el._state = { x: pos.x, y: pos.y, scale: 1, rot: 0, flip: false };

    // Tail at the back, then feet, body, wings, and the head on top. Newer parts go above older ones of the same kind.
    const layer = layerOf(kind);
    const above = Array.from(scene.children).find(p => layerOf(p.dataset.kind) > layer);
    scene.insertBefore(el, above || null);

    const size = () => { el.style.width = naturalWidthPct(kind, el.naturalWidth, el._state.scale) + '%'; };
    if (el.complete) size(); else el.addEventListener('load', size, { once: true });
    applyTransform(el);
    select(el);

    const r = scene.getBoundingClientRect();
    Sky.burst(r.left + pos.x * r.width, r.top + pos.y * r.height, 10, 70);
  }

  function applyTransform(el) {
    const s = el._state;
    el.style.left = (s.x * 100) + '%';
    el.style.top = (s.y * 100) + '%';
    el.style.width = naturalWidthPct(el.dataset.kind, el.naturalWidth, s.scale) + '%';
    el.style.transform = `translate(-50%, -50%) rotate(${s.rot}deg) scaleX(${s.flip ? -1 : 1})`;
  }

  // Move a placed part. Dropping it back on the tray throws it away.
  scene.addEventListener('pointerdown', e => {
    const el = e.target.closest('.part');
    if (!el) { select(null); return; }
    if (e.button > 0) return;
    e.preventDefault();
    select(el);
    el.setPointerCapture(e.pointerId);
    el.classList.add('dragging');
    const start = toScene(e);
    const from = { x: el._state.x, y: el._state.y };

    const move = ev => {
      const p = toScene(ev);
      el._state.x = from.x + (p.x - start.x);
      el._state.y = from.y + (p.y - start.y);
      applyTransform(el);
      const leaving = overTray(ev);
      el.classList.toggle('leaving', leaving);
      tray.classList.toggle('drop-remove', leaving);
    };
    const up = ev => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.classList.remove('dragging', 'leaving');
      tray.classList.remove('drop-remove');
      if (ev.type === 'pointerup' && overTray(ev)) { removePart(el); return; }
      el._state.x = clamp(el._state.x, 0, 1);
      el._state.y = clamp(el._state.y, 0, 1);
      applyTransform(el);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  });

  function removePart(el) {
    if (selected === el) select(null);
    el.remove();
  }

  function select(el) {
    if (selected) selected.classList.remove('selected');
    selected = el;
    if (el) el.classList.add('selected');
    toolsHint.hidden = !!el;
    toolsButtons.hidden = !el;
  }

  /* ---------- Tools ---------- */

  toolsButtons.addEventListener('click', e => {
    const btn = e.target.closest('button[data-tool]');
    if (!btn || !selected) return;
    const s = selected._state;
    switch (btn.dataset.tool) {
      case 'smaller': s.scale = Math.max(MIN_SCALE, +(s.scale - SCALE_STEP).toFixed(2)); break;
      case 'bigger': s.scale = Math.min(MAX_SCALE, +(s.scale + SCALE_STEP).toFixed(2)); break;
      case 'left': s.rot -= TURN_STEP; break;
      case 'right': s.rot += TURN_STEP; break;
      case 'flip': s.flip = !s.flip; break;
      case 'front': scene.appendChild(selected); break;
      case 'back': scene.insertBefore(selected, scene.firstChild); break;
      case 'remove': removePart(selected); return;
    }
    applyTransform(selected);
  });

  document.addEventListener('keydown', e => {
    if (!selected || e.target.closest('input, textarea')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removePart(selected); }
    if (e.key === 'Escape') select(null);
  });

  // Ask twice so one stray click doesn't erase a turkey.
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
    select(null);
    scene.innerHTML = '';
  });

  function resetStartOver() {
    startOver.classList.remove('confirm');
    startOver.textContent = '🔄 Start over';
  }

  /* ---------- Helpers ---------- */

  function toScene(e) {
    const r = scene.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function overScene(e) {
    const p = toScene(e);
    return p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
  }

  function overTray(e) {
    const r = tray.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  function nearCenter() {
    return { x: 0.5 + (Math.random() - 0.5) * 0.12, y: 0.55 + (Math.random() - 0.5) * 0.12 };
  }

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  renderTabs();
  renderItems();
})();
