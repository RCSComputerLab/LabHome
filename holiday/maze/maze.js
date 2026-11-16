/* Turkey Code Maze: drag code blocks, press Go, and the turkey follows them. */
(function () {
  'use strict';

  const LEVELS = window.MazeLevels;
  const FOODS = window.MazeFoods;
  const MOVES = {
    up:    { dx: 0,  dy: -1, icon: '⬆️', word: 'Up' },
    down:  { dx: 0,  dy: 1,  icon: '⬇️', word: 'Down' },
    left:  { dx: -1, dy: 0,  icon: '⬅️', word: 'Left' },
    right: { dx: 1,  dy: 0,  icon: '➡️', word: 'Right' }
  };
  const STEP_MS = 450;
  const MAX_COUNT = 9;
  const SAVE_KEY = 'turkeyMazeReached';

  const $ = s => document.querySelector(s);
  const boardEl = $('#board');
  const trayEl = $('#tray');
  const programEl = $('#program');
  const programHint = $('#program-hint');
  const goBtn = $('#go');
  const messageEl = $('#message');

  let levelIndex = 0;
  let reached = loadReached();
  let level, walls, start, turkeyPos, foods, turkeyEl, facingLeft;
  let program = [];
  let nextId = 1;
  let running = false;
  let stopAsked = false;

  if (window.Sky) Sky.buildSky();

  /* ---------- Remembering which levels a student has reached ----------
     Kept only until the browser closes, so every new login starts again at level 1.
     (Going Back to the Holiday page and returning keeps their place.) */
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* older saved progress: no longer used */ }
  function loadReached() {
    try { return Math.max(0, Math.min(LEVELS.length - 1, parseInt(sessionStorage.getItem(SAVE_KEY), 10) || 0)); }
    catch (e) { return 0; }
  }
  function saveReached() {
    try { sessionStorage.setItem(SAVE_KEY, String(reached)); } catch (e) { /* private window: fine */ }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Level picker ---------- */
  function renderLevels() {
    const nav = $('#levels');
    nav.innerHTML = '<span class="label">Level</span>';
    LEVELS.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.level = i;
      b.textContent = i <= reached ? String(i + 1) : '🔒';
      b.disabled = i > reached;
      if (i < reached) b.classList.add('done');
      b.setAttribute('aria-current', i === levelIndex ? 'true' : 'false');
      b.setAttribute('aria-label', i <= reached ? 'Level ' + (i + 1) : 'Level ' + (i + 1) + ' locked');
      nav.appendChild(b);
    });
  }
  $('#levels').addEventListener('click', e => {
    const b = e.target.closest('button[data-level]');
    if (!b || b.disabled || running) return;
    loadLevel(Number(b.dataset.level));
  });

  /* ---------- Board ---------- */
  function loadLevel(i) {
    levelIndex = i;
    level = LEVELS[i];
    program = [];
    hideMessage();
    $('#hint').textContent = level.hint;
    walls = [];
    foods = [];
    level.rows.forEach((row, y) => {
      walls.push([...row].map(ch => ch === '#'));
      [...row].forEach((ch, x) => {
        if (ch === 'T') start = { x, y };
        else if (FOODS[ch]) foods.push({ x, y, img: FOODS[ch] });
      });
    });
    drawBoard();
    renderTray();
    renderProgram();
    renderLevels();
  }

  function drawBoard() {
    const rows = level.rows.length, cols = level.rows[0].length;
    boardEl.style.setProperty('--cols', cols);
    boardEl.style.setProperty('--rows', rows);
    boardEl.style.aspectRatio = cols + ' / ' + rows;
    boardEl.innerHTML = '';
    walls.forEach(row => row.forEach(isWall => {
      const c = document.createElement('div');
      c.className = 'cell ' + (isWall ? 'wall' : 'path');
      boardEl.appendChild(c);
    }));
    foods.forEach(f => {
      f.el = document.createElement('div');
      f.el.className = 'sprite food';
      f.el.style.setProperty('--x', f.x);
      f.el.style.setProperty('--y', f.y);
      f.el.innerHTML = '<img src="' + f.img + '" alt="">';
      boardEl.appendChild(f.el);
    });
    turkeyEl = document.createElement('div');
    turkeyEl.className = 'sprite turkey';
    turkeyEl.innerHTML = '<div class="bird"><img src="turkey.png" alt="Turkey"></div>';
    boardEl.appendChild(turkeyEl);

    const list = $('#food-list');
    list.innerHTML = '<span>Eat:</span>';
    foods.forEach(f => {
      f.chip = document.createElement('img');
      f.chip.src = f.img;
      f.chip.alt = '';
      list.appendChild(f.chip);
    });
    resetTurkey(false);
  }

  function resetTurkey(animate) {
    if (!animate) turkeyEl.style.transition = 'none';
    turkeyPos = { ...start };
    facingLeft = level.rows[start.y][start.x + 1] === '#' || start.x === level.rows[0].length - 1;
    placeTurkey();
    turkeyEl.classList.remove('bonk');
    turkeyEl.querySelector('.bubble')?.remove();
    foods.forEach(f => { f.eaten = false; f.el.classList.remove('eaten'); f.chip.classList.remove('eaten'); });
    if (!animate) { void turkeyEl.offsetWidth; turkeyEl.style.transition = ''; }
  }

  function placeTurkey(x = turkeyPos.x, y = turkeyPos.y) {
    turkeyEl.style.setProperty('--x', x);
    turkeyEl.style.setProperty('--y', y);
    turkeyEl.classList.toggle('face-left', facingLeft);
  }

  function isOpen(x, y) {
    return y >= 0 && y < walls.length && x >= 0 && x < walls[0].length && !walls[y][x];
  }

  /* ---------- Blocks ---------- */
  function renderTray() {
    trayEl.innerHTML = '';
    const types = ['up', 'down', 'left', 'right'];
    if (level.repeat) types.push('repeat');
    types.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'block ' + t;
      b.dataset.type = t;
      b.innerHTML = t === 'repeat'
        ? '<span class="icon">🔁</span>Repeat'
        : '<span class="icon">' + MOVES[t].icon + '</span>' + MOVES[t].word;
      b.setAttribute('aria-label', 'Add ' + (t === 'repeat' ? 'Repeat' : MOVES[t].word) + ' block');
      trayEl.appendChild(b);
    });
  }

  // keyboard: Enter or Space on a tray block adds it (mouse/touch taps are handled below)
  trayEl.addEventListener('click', e => {
    const b = e.target.closest('.block');
    if (b && e.detail === 0 && !running) addItem(newItem(b.dataset.type), program, program.length);
  });

  function newItem(type) {
    return type === 'repeat' ? { id: nextId++, type, count: 2, body: [] } : { id: nextId++, type };
  }

  function blockEl(item) {
    const el = document.createElement('div');
    el.className = 'block ' + item.type;
    el.dataset.id = item.id;
    if (item.type === 'repeat') {
      el.innerHTML = '<div class="repeat-head"><span class="icon">🔁</span>' +
        '<button type="button" class="count" aria-label="Times to repeat">' + item.count + '×</button></div>';
      const body = document.createElement('div');
      body.className = 'repeat-body';
      body.dataset.parent = item.id;
      item.body.forEach(child => body.appendChild(blockEl(child)));
      el.appendChild(body);
    } else {
      el.innerHTML = '<span class="icon">' + MOVES[item.type].icon + '</span>' + MOVES[item.type].word;
    }
    return el;
  }

  function renderProgram() {
    programEl.querySelectorAll('.block, .drop-mark').forEach(b => b.remove());
    program.forEach(item => programEl.appendChild(blockEl(item)));
    programHint.hidden = program.length > 0;
  }

  // find where an item lives: { list, index }
  function locate(id, list = program) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { list, index: i };
      if (list[i].body) {
        const found = locate(id, list[i].body);
        if (found) return found;
      }
    }
    return null;
  }

  // the repeat count button: tap to change 2 → 3 → … → 9 → 2
  programEl.addEventListener('click', e => {
    const btn = e.target.closest('.count');
    if (!btn || running) return;
    const spot = locate(Number(btn.closest('.block').dataset.id));
    const item = spot.list[spot.index];
    item.count = item.count >= MAX_COUNT ? 2 : item.count + 1;
    btn.textContent = item.count + '×';
    hideMessage();
  });

  /* ---------- Drag and drop (mouse and touch) ---------- */
  let drag = null;

  document.addEventListener('pointerdown', e => {
    if (running || e.button > 0) return;
    if (e.target.closest('.count')) return;
    const src = e.target.closest('.tray .block, .program .block');
    if (!src) return;
    e.preventDefault();
    drag = {
      fromTray: !!src.closest('.tray'),
      el: src,
      type: src.dataset.type || null,
      id: src.dataset.id ? Number(src.dataset.id) : null,
      startX: e.clientX,
      startY: e.clientY,
      started: false
    };
    if (!drag.fromTray) drag.type = locate(drag.id).list[locate(drag.id).index].type;
  });

  document.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6) return;
      beginDrag(e);
    }
    moveGhost(e);
  });

  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.started) {
      // a tap on a tray block adds it to the end
      if (d.fromTray) addItem(newItem(d.type), program, program.length);
      return;
    }
    finishDrag(d, e);
  });

  document.addEventListener('pointercancel', () => {
    if (!drag) return;
    if (drag.started) cleanupDrag(drag);
    drag = null;
  });

  function beginDrag(e) {
    drag.started = true;
    const r = drag.el.getBoundingClientRect();
    drag.offX = drag.startX - r.left;
    drag.offY = drag.startY - r.top;
    drag.ghost = drag.el.cloneNode(true);
    drag.ghost.classList.add('ghost');
    drag.ghost.style.width = r.width + 'px';
    drag.ghost.style.height = r.height + 'px';
    document.body.appendChild(drag.ghost);
    if (!drag.fromTray) drag.el.classList.add('dragging');
    drag.mark = document.createElement('div');
    drag.mark.className = 'drop-mark';
    hideMessage();
  }

  function moveGhost(e) {
    drag.ghost.style.left = (e.clientX - drag.offX) + 'px';
    drag.ghost.style.top = (e.clientY - drag.offY) + 'px';
    const target = dropTarget(e.clientX, e.clientY);
    document.querySelectorAll('.drop-here').forEach(n => n.classList.remove('drop-here'));
    drag.ghost.classList.toggle('remove', !target);
    if (!target) { drag.mark.remove(); drag.target = null; return; }
    target.container.classList.add('drop-here');
    const kids = blockKids(target.container);
    if (target.index < kids.length) target.container.insertBefore(drag.mark, kids[target.index]);
    else target.container.appendChild(drag.mark);
    drag.target = target;
  }

  function blockKids(container) {
    return [...container.children].filter(k => k.classList.contains('block') && !k.classList.contains('dragging'));
  }

  function dropTarget(x, y) {
    const under = document.elementFromPoint(x, y);
    if (!under) return null;
    let container = null;
    const body = under.closest('.repeat-body');
    // a Repeat can't go inside another Repeat (or inside itself)
    if (body && drag.type !== 'repeat' && !body.closest('.dragging')) container = body;
    else if (under.closest('#program')) container = programEl;
    if (!container) return null;
    // ignore the drop mark itself when measuring
    const kids = blockKids(container);
    let index = kids.length;
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) { index = i; break; }
    }
    return { container, index };
  }

  function finishDrag(d) {
    const target = d.target;
    let item;
    if (d.fromTray) item = newItem(d.type);
    else {
      const spot = locate(d.id);
      item = spot.list.splice(spot.index, 1)[0];
    }
    if (target) {
      const list = target.container === programEl
        ? program
        : locate(Number(target.container.dataset.parent)).list[locate(Number(target.container.dataset.parent)).index].body;
      addItem(item, list, target.index);
    } else {
      renderProgram(); // dragged out = removed
    }
    cleanupDrag(d);
  }

  function cleanupDrag(d) {
    d.ghost?.remove();
    d.mark?.remove();
    d.el.classList.remove('dragging');
    document.querySelectorAll('.drop-here').forEach(n => n.classList.remove('drop-here'));
  }

  function addItem(item, list, index) {
    list.splice(index, 0, item);
    hideMessage();
    renderProgram();
  }

  $('#clear').addEventListener('click', () => {
    if (running) return;
    program = [];
    renderProgram();
    hideMessage();
    resetTurkey(false);
  });

  /* ---------- Running the code ---------- */
  function flatten(list, out = [], loop = null) {
    list.forEach(item => {
      if (item.type === 'repeat') {
        for (let n = 0; n < item.count; n++) flatten(item.body, out, item.id);
      } else {
        out.push({ id: item.id, type: item.type, loop });
      }
    });
    return out;
  }

  function lightUp(step) {
    programEl.querySelectorAll('.active, .active-loop').forEach(n => n.classList.remove('active', 'active-loop'));
    if (!step) return;
    programEl.querySelector('.block[data-id="' + step.id + '"]')?.classList.add('active');
    if (step.loop) programEl.querySelector('.block[data-id="' + step.loop + '"]')?.classList.add('active-loop');
  }

  goBtn.addEventListener('click', () => {
    if (running) { stopAsked = true; return; }
    run();
  });

  async function run() {
    const steps = flatten(program);
    hideMessage();
    if (!steps.length) {
      showMessage(program.length
        ? 'Put some arrow blocks inside the 🔁 Repeat block!'
        : 'Drag some arrow blocks into <b>My code</b> first! 👆');
      return;
    }
    resetTurkey(false);
    running = true;
    stopAsked = false;
    document.body.classList.add('running');
    goBtn.textContent = '⏹️ Stop';
    goBtn.classList.add('stop');
    await sleep(250);

    let result = 'short';
    for (const step of steps) {
      if (stopAsked) { result = 'stopped'; break; }
      lightUp(step);
      const m = MOVES[step.type];
      if (m.dx) facingLeft = m.dx < 0;
      const nx = turkeyPos.x + m.dx, ny = turkeyPos.y + m.dy;
      if (!isOpen(nx, ny)) {
        await bonk(m);
        result = 'bonk';
        break;
      }
      turkeyPos = { x: nx, y: ny };
      placeTurkey();
      await sleep(STEP_MS);
      const food = foods.find(f => !f.eaten && f.x === nx && f.y === ny);
      if (food) {
        food.eaten = true;
        food.el.classList.add('eaten');
        food.chip.classList.add('eaten');
      }
      if (foods.every(f => f.eaten)) { result = 'win'; break; }
    }

    lightUp(null);
    running = false;
    document.body.classList.remove('running');
    goBtn.textContent = '▶️ Go!';
    goBtn.classList.remove('stop');

    if (result === 'win') win();
    else if (result === 'bonk') {
      resetTurkey(true);
      showMessage('Oops! The turkey bumped into a hay bale. Fix your code and try again!');
    } else if (result === 'short') {
      const left = foods.filter(f => !f.eaten).length;
      showMessage('Good try! There ' + (left === 1 ? 'is 1 more food' : 'are ' + left + ' more foods') +
        ' to eat. Add more blocks and press Go!');
    }
  }

  async function bonk(m) {
    // lean toward the wall, then wobble back
    placeTurkey(turkeyPos.x + m.dx * 0.3, turkeyPos.y + m.dy * 0.3);
    await sleep(200);
    placeTurkey();
    turkeyEl.classList.add('bonk');
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = 'Oops!';
    turkeyEl.appendChild(bubble);
    await sleep(1300);
  }

  function win() {
    if (window.Sky && Sky.celebrate) Sky.celebrate();
    const last = levelIndex === LEVELS.length - 1;
    if (!last && reached < levelIndex + 1) { reached = levelIndex + 1; saveReached(); }
    renderLevels();
    showMessage(last
      ? '🎉 Yum! You finished every level! You are a coding star! ⭐'
      : '🎉 Yum! You did it!<br><button type="button" class="pill-btn" id="next-level">Next level ➡️</button>', true);
    $('#next-level')?.addEventListener('click', () => loadLevel(levelIndex + 1));
  }

  function showMessage(html, isWin) {
    messageEl.innerHTML = html;
    messageEl.classList.toggle('win', !!isWin);
    messageEl.hidden = false;
  }
  function hideMessage() { messageEl.hidden = true; }

  /* ---------- Start over: two taps clears this level's code ---------- */
  const startOver = $('#start-over');
  let confirmTimer = null;
  startOver.addEventListener('click', () => {
    if (running) return;
    if (!startOver.classList.contains('confirm')) {
      startOver.classList.add('confirm');
      startOver.textContent = '❓ Tap again to clear';
      confirmTimer = setTimeout(resetStartOver, 3000);
      return;
    }
    resetStartOver();
    loadLevel(levelIndex);
  });
  function resetStartOver() {
    clearTimeout(confirmTimer);
    startOver.classList.remove('confirm');
    startOver.textContent = '🔄 Start over';
  }

  loadLevel(reached);
})();
