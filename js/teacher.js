/* Teacher control center: edit sites, sections and settings; publish to GitHub. */
(function () {
  const { escapeHtml, safeUrl, logoFor, colorFor, isFreeDayOpen, hostOf, makeId, normalize,
    GRADES, FREE_DAY_ID, PALETTE, CONFIG_PATH } = Lab;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  let draft = normalize({});
  let baseline = '';
  let creds = GitHub.loadCreds();
  let gh = null;
  let editor = null; // site being edited in the dialog

  Sky.buildSky({ starCount: 90 });

  // ---------------------------------------------------------------- startup

  async function init() {
    wireStatic();
    wireLock();
    if (creds.enc) await waitForUnlock();
    fillConnectForm();
    if (creds.token && creds.owner && creds.repo) {
      gh = GitHub.client(creds);
      try {
        await loadFromGitHub();
      } catch (err) {
        toast(err.message, 'error');
        gh = null;
        await loadLocal();
      }
    } else {
      await loadLocal();
    }
    renderAll();
    setInterval(renderFreeDay, 15000);
  }

  async function loadLocal() {
    try {
      draft = (await Lab.loadConfig()).config;
    } catch (err) {
      draft = normalize({});
    }
    setBaseline();
  }

  async function loadFromGitHub() {
    const file = await gh.getFile(CONFIG_PATH);
    draft = normalize(JSON.parse(file.text));
    setBaseline();
  }

  function setBaseline() {
    baseline = JSON.stringify(draft);
    updatePublishButton();
  }

  function isDirty() {
    return JSON.stringify(draft) !== baseline;
  }

  function changed() {
    updatePublishButton();
  }

  // ---------------------------------------------------------------- render

  function renderAll() {
    renderConnection();
    renderFreeDay();
    renderGradePicker();
    renderSpotlightSelect();
    renderSiteGroups();
    renderSectionList();
    renderSettings();
    updatePublishButton();
  }

  function renderConnection() {
    const pill = $('#conn-pill');
    const banner = $('#setup-banner');
    $('#lock-btn').hidden = !creds.enc;
    if (gh) {
      pill.innerHTML = '<span class="dot ok"></span> Connected to ' + escapeHtml(creds.owner + '/' + creds.repo);
      banner.hidden = !creds.legacyToken;
      banner.innerHTML = '🔒 <b>Add a password.</b> This computer remembers your GitHub connection without one, so anyone who opens this page here could make changes. ' +
        '<button class="btn small primary" data-goto="connect" data-focus="gh-password">Add a password</button>';
    } else {
      pill.innerHTML = '<span class="dot"></span> Not connected to GitHub';
      banner.hidden = false;
      banner.innerHTML = '🔗 <b>Not connected yet.</b> You can look around and make changes, but they won\'t reach the lab computers until you connect to GitHub. ' +
        '<button class="btn small primary" data-goto="connect">Connect now</button>';
    }
  }

  function updatePublishButton() {
    const btn = $('#publish-btn');
    const dirty = isDirty();
    if (!gh) {
      btn.disabled = false;
      btn.textContent = dirty ? '⬇️ Download changes' : '⬇️ Download config';
    } else {
      btn.disabled = !dirty;
      btn.textContent = dirty ? '🚀 Publish changes' : '✨ All changes published';
    }
    btn.classList.toggle('pulse', dirty);
  }

  function renderFreeDay() {
    const open = isFreeDayOpen(draft);
    const card = $('#freeday-card');
    card.classList.toggle('is-open', open);
    let state;
    if (open) {
      const until = draft.freeDay.until
        ? 'Locks itself at ' + new Date(draft.freeDay.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : 'Stays open until you lock it';
      state = `<div class="fd-big">🎉 Open</div><div class="muted">${until}</div>`;
    } else {
      state = '<div class="fd-big">🔒 Locked</div><div class="muted">Students can see it but can\'t click in</div>';
    }
    $('#freeday-state').innerHTML = state;
    const s = draft.settings;
    $('#freeday-actions').innerHTML = open
      ? '<button class="btn danger" data-fd="lock">🔒 Lock now</button>' +
        (draft.freeDay.until ? `<button class="btn ghost" data-fd="add">+${formatMinutes(s.freeDayExtend)}</button>` : '')
      : s.freeDayMinutes.map(m => `<button class="btn primary" data-fd="${m}">${formatMinutes(m)}</button>`).join('') +
        '<button class="btn primary" data-fd="day">Rest of today</button>' +
        '<button class="btn ghost" data-fd="forever">Until I lock it</button>';
    const msg = $('#freeday-message');
    if (document.activeElement !== msg) msg.value = draft.freeDay.message || '';
  }

  function renderGradePicker() {
    const options = [['all', 'All']].concat(GRADES.map(g => [g, g]));
    $('#grade-picker').innerHTML = options.map(([value, label]) =>
      `<button type="button" data-grade="${value}" class="${draft.currentGrade === value ? 'active' : ''}">${label}</button>`).join('');
  }

  function renderSpotlightSelect() {
    const sel = $('#spotlight-select');
    let html = '<option value="">— None —</option>';
    draft.sections.forEach(sec => {
      const sites = draft.sites.filter(s => s.section === sec.id);
      if (!sites.length) return;
      html += `<optgroup label="${escapeHtml(sec.name)}">` +
        sites.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`).join('') + '</optgroup>';
    });
    sel.innerHTML = html;
    sel.value = draft.sites.some(s => s.id === draft.spotlight) ? draft.spotlight : '';
  }

  function renderSiteGroups() {
    $('#site-groups').innerHTML = draft.sections.map(sec => {
      const sites = draft.sites.filter(s => s.section === sec.id);
      const rows = sites.map(siteRow).join('') || '<li class="empty-drop">Drop a website here, or click “Add here”.</li>';
      return `
        <div class="group glass" style="--accent:${escapeHtml(sec.color || '#a29bfe')}">
          <div class="group-head">
            <span class="section-emoji">${escapeHtml(sec.emoji || '✨')}</span>
            <h3>${escapeHtml(sec.name)}${sec.id === FREE_DAY_ID ? ' <span class="badge">locked until you open it</span>' : ''}</h3>
            <span class="muted count">${sites.length} ${sites.length === 1 ? 'site' : 'sites'}</span>
            <button class="btn ghost small" data-add="${escapeHtml(sec.id)}">➕ Add here</button>
          </div>
          <ul class="site-list" data-section="${escapeHtml(sec.id)}">${rows}</ul>
        </div>`;
    }).join('');
    wireMiniLogos($('#site-groups'));
  }

  function siteRow(site) {
    const grades = site.grades.length
      ? site.grades.map(g => `<span class="chip on">${g}</span>`).join('')
      : '<span class="muted">All grades</span>';
    return `
      <li class="site-row ${site.hidden ? 'is-hidden' : ''}" draggable="true" data-id="${escapeHtml(site.id)}" style="--accent:${colorFor(site)}">
        <span class="handle" title="Drag to move">⠿</span>
        ${miniLogo(site)}
        <div class="row-main">
          <div class="row-name">${escapeHtml(site.name)}${site.hidden ? ' <span class="badge">hidden</span>' : ''}${draft.spotlight === site.id ? ' <span class="badge gold">⭐ mission</span>' : ''}</div>
          <div class="row-url">${escapeHtml(hostOf(site.url) || site.url)}</div>
        </div>
        <div class="row-grades">${grades}</div>
        <div class="row-actions">
          <button class="icon-btn" data-act="up" title="Move up">↑</button>
          <button class="icon-btn" data-act="down" title="Move down">↓</button>
          <button class="icon-btn" data-act="hide" title="${site.hidden ? 'Show to students' : 'Hide from students'}">${site.hidden ? '🙈' : '👁️'}</button>
          <button class="btn ghost small" data-act="edit">✏️ Edit</button>
        </div>
      </li>`;
  }

  function miniLogo(site) {
    const src = site.logoData || logoFor(site);
    const letter = escapeHtml((site.name || '?').trim().charAt(0).toUpperCase());
    if (src) return `<div class="mini-logo"><img src="${escapeHtml(safeUrl(src))}" alt="" referrerpolicy="no-referrer" data-letter="${letter}" data-emoji="${escapeHtml(site.emoji || '')}"></div>`;
    return `<div class="mini-logo">${escapeHtml(site.emoji) || letter}</div>`;
  }

  function wireMiniLogos(root) {
    root.querySelectorAll('.mini-logo img, .logo-tile img').forEach(img => {
      const fallback = () => {
        const box = img.parentElement;
        if (!box) return;
        if (box.classList.contains('logo-tile')) {
          box.outerHTML = img.dataset.emoji
            ? `<div class="logo-tile"><span class="emoji">${escapeHtml(img.dataset.emoji)}</span></div>`
            : `<div class="logo-tile no-bg"><span class="letter">${escapeHtml(img.dataset.letter)}</span></div>`;
        } else {
          box.textContent = img.dataset.emoji || img.dataset.letter;
        }
      };
      if (img.complete && !img.naturalWidth && img.currentSrc) fallback();
      else img.addEventListener('error', fallback, { once: true });
    });
  }

  function renderSectionList() {
    $('#section-list').innerHTML = draft.sections.map((sec, i) => `
      <div class="sec-row glass" data-id="${escapeHtml(sec.id)}">
        <input class="emoji-input" type="text" maxlength="4" value="${escapeHtml(sec.emoji || '')}" data-field="emoji" aria-label="Emoji">
        <input class="name-input" type="text" maxlength="40" value="${escapeHtml(sec.name)}" data-field="name" aria-label="Section name" ${sec.id === FREE_DAY_ID ? 'title="You can rename Free Day"' : ''}>
        <input class="color-input" type="color" value="${escapeHtml(sec.color || '#a29bfe')}" data-field="color" aria-label="Color">
        <span class="muted count">${draft.sites.filter(s => s.section === sec.id).length} sites</span>
        <button class="icon-btn" data-sec="up" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button class="icon-btn" data-sec="down" ${i === draft.sections.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
        ${sec.id === FREE_DAY_ID
          ? '<span class="badge">special</span>'
          : '<button class="icon-btn danger" data-sec="delete" title="Remove section">🗑</button>'}
      </div>`).join('');
  }

  function renderSettings() {
    const s = draft.settings;
    $('#set-className').value = s.className;
    $('#set-tagline').value = s.tagline;
    $('#set-showClock').checked = !!s.showClock;
    $('#set-sparkles').checked = !!s.sparkles;
    $('#set-openInNewTab').checked = !!s.openInNewTab;
  }

  function fillConnectForm() {
    $('#gh-owner').value = creds.owner || '';
    $('#gh-repo').value = creds.repo || '';
    $('#gh-branch').value = creds.branch || 'main';
    $('#gh-token').value = creds.token || '';
    $('#gh-remember').checked = !sessionStorage.getItem('lab-github');
    togglePasswordFields();
  }

  function togglePasswordFields() {
    const remember = $('#gh-remember').checked;
    $('#password-fields').hidden = !remember;
    $('#password-note').hidden = !remember;
  }

  // ---------------------------------------------------------------- publishing

  /** Quick controls go live immediately and only touch their own fields. */
  async function quickCommit(label, mutate) {
    mutate(draft);
    if (gh) {
      const b = JSON.parse(baseline);
      mutate(b);
      baseline = JSON.stringify(b);
    }
    renderFreeDay();
    renderGradePicker();
    renderSpotlightSelect();
    renderSiteGroups();
    updatePublishButton();

    if (!gh) {
      toast('Changed here only. Connect to GitHub to make it live.', 'warn');
      return;
    }
    try {
      const file = await gh.getFile(CONFIG_PATH);
      const remote = normalize(JSON.parse(file.text));
      mutate(remote);
      await gh.putFile(CONFIG_PATH, GitHub.toBase64(serialize(remote)), label, file.sha);
      toast('✨ ' + label + '. Lab computers update in about a minute.');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function publish() {
    if (!gh) {
      downloadJson();
      toast('Downloaded config.json. Upload it to the data folder in your repo, or connect to GitHub to skip this step.', 'warn', 8000);
      return;
    }
    const btn = $('#publish-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Publishing…';
    try {
      for (const site of draft.sites.filter(s => s.logoData)) {
        const path = `logos/${site.id}-${Date.now()}.png`;
        await gh.putFile(path, site.logoData.split(',')[1], 'Add logo for ' + site.name);
        site.logo = path;
        delete site.logoData;
      }
      const sha = await gh.getSha(CONFIG_PATH);
      await gh.putFile(CONFIG_PATH, GitHub.toBase64(serialize(draft)), 'Update lab websites', sha);
      setBaseline();
      renderSiteGroups();
      toast('🚀 Published! Lab computers will update in about a minute.');
      Sky.burst(btn.getBoundingClientRect().left + 80, 40, 16, 80);
    } catch (err) {
      toast(err.message, 'error', 8000);
      updatePublishButton();
    }
  }

  /** JSON for saving. Pending uploaded logos are kept inline when there's no GitHub to upload to. */
  function serialize(c) {
    const copy = JSON.parse(JSON.stringify(c));
    copy.sites.forEach(s => {
      if (s.logoData) { s.logo = s.logoData; delete s.logoData; }
    });
    return JSON.stringify(copy, null, 2) + '\n';
  }

  function downloadJson() {
    const blob = new Blob([serialize(draft)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'config.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------------------------------------------------------------- free day

  function freeDay(action) {
    if (action === 'lock') {
      return quickCommit('Locked Free Day', c => { c.freeDay.unlocked = false; c.freeDay.until = null; });
    }
    if (action === 'add') {
      const extra = draft.settings.freeDayExtend;
      const base = Math.max(Date.now(), new Date(draft.freeDay.until).getTime());
      const until = new Date(base + extra * 60000).toISOString();
      return quickCommit('Added ' + formatMinutes(extra) + ' to Free Day', c => { c.freeDay.unlocked = true; c.freeDay.until = until; });
    }
    let until = null;
    if (action === 'day') {
      const end = new Date();
      end.setHours(23, 59, 0, 0);
      until = end.toISOString();
    } else if (action !== 'forever') {
      until = new Date(Date.now() + Number(action) * 60000).toISOString();
    }
    Sky.celebrate();
    return quickCommit('Unlocked Free Day', c => { c.freeDay.unlocked = true; c.freeDay.until = until; });
  }

  function formatMinutes(m) {
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const r = m % 60;
    return h + ' hr' + (r ? ' ' + r + ' min' : '');
  }

  function openTimesEditor() {
    $('#fd-times').value = draft.settings.freeDayMinutes.join(', ');
    $('#fd-extend').value = draft.settings.freeDayExtend;
    $('#fd-times-editor').hidden = false;
    $('#fd-times-toggle').hidden = true;
    $('#fd-times').focus();
  }

  function closeTimesEditor() {
    $('#fd-times-editor').hidden = true;
    $('#fd-times-toggle').hidden = false;
  }

  function saveTimes() {
    const minutes = Array.from(new Set(
      $('#fd-times').value.split(/[,\s]+/).map(Number).filter(n => Number.isInteger(n) && n > 0 && n <= 480)
    )).sort((a, b) => a - b);
    const extend = Number($('#fd-extend').value);
    if (!minutes.length) {
      toast('Type at least one time in minutes, like 10, 20, 45.', 'warn');
      return;
    }
    if (minutes.length > 6) {
      toast('Six time buttons at most, so they fit in the card.', 'warn');
      return;
    }
    if (!Number.isInteger(extend) || extend < 1 || extend > 120) {
      toast('The "add more time" amount should be between 1 and 120 minutes.', 'warn');
      return;
    }
    closeTimesEditor();
    quickCommit('Updated Free Day times', c => {
      c.settings.freeDayMinutes = minutes;
      c.settings.freeDayExtend = extend;
    });
  }

  // ---------------------------------------------------------------- site list actions

  function moveSite(id, dir) {
    const site = draft.sites.find(s => s.id === id);
    const same = draft.sites.filter(s => s.section === site.section);
    const pos = same.indexOf(site);
    const other = same[pos + dir];
    if (!other) return;
    const a = draft.sites.indexOf(site);
    const b = draft.sites.indexOf(other);
    [draft.sites[a], draft.sites[b]] = [draft.sites[b], draft.sites[a]];
    renderSiteGroups();
    changed();
  }

  /** After a drag, read the new order straight from the page. */
  function syncOrderFromDom() {
    const byId = new Map(draft.sites.map(s => [s.id, s]));
    const next = [];
    $$('.site-list').forEach(list => {
      list.querySelectorAll('.site-row').forEach(row => {
        const site = byId.get(row.dataset.id);
        if (!site) return;
        site.section = list.dataset.section;
        next.push(site);
        byId.delete(site.id);
      });
    });
    byId.forEach(site => next.push(site));
    const before = JSON.stringify(draft.sites.map(s => s.id + s.section));
    draft.sites = next;
    if (JSON.stringify(next.map(s => s.id + s.section)) !== before) changed();
    renderSiteGroups();
    renderSpotlightSelect();
    renderSectionList();
  }

  function wireDragAndDrop() {
    const root = $('#site-groups');
    let dragging = null;

    root.addEventListener('dragstart', e => {
      const row = e.target.closest('.site-row');
      if (!row) return;
      dragging = row;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.dataset.id);
    });

    root.addEventListener('dragover', e => {
      const list = e.target.closest('.site-list');
      if (!list || !dragging) return;
      e.preventDefault();
      const rows = Array.from(list.querySelectorAll('.site-row:not(.dragging)'));
      const after = rows.find(r => {
        const box = r.getBoundingClientRect();
        return e.clientY < box.top + box.height / 2;
      });
      const empty = list.querySelector('.empty-drop');
      if (empty) empty.hidden = true;
      if (after) list.insertBefore(dragging, after);
      else list.appendChild(dragging);
      $$('.site-list').forEach(l => l.classList.toggle('drop-target', l === list));
    });

    root.addEventListener('drop', e => e.preventDefault());

    root.addEventListener('dragend', () => {
      if (!dragging) return;
      dragging.classList.remove('dragging');
      dragging = null;
      syncOrderFromDom();
    });
  }

  // ---------------------------------------------------------------- sections

  function sectionAction(id, action) {
    const i = draft.sections.findIndex(s => s.id === id);
    if (action === 'up' || action === 'down') {
      const j = action === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= draft.sections.length) return;
      [draft.sections[i], draft.sections[j]] = [draft.sections[j], draft.sections[i]];
    } else if (action === 'delete') {
      const sec = draft.sections[i];
      const sites = draft.sites.filter(s => s.section === id);
      const target = draft.sections.find(s => s.id !== id && s.id !== FREE_DAY_ID) || draft.sections.find(s => s.id !== id);
      if (sites.length && !confirm(`"${sec.name}" has ${sites.length} site(s). Move them to "${target.name}" and remove the section?`)) return;
      if (!sites.length && !confirm(`Remove the "${sec.name}" section?`)) return;
      sites.forEach(s => { s.section = target.id; });
      draft.sections.splice(i, 1);
    }
    renderSectionList();
    renderSiteGroups();
    renderSpotlightSelect();
    changed();
  }

  function addSection() {
    const fd = draft.sections.findIndex(s => s.id === FREE_DAY_ID);
    const sec = { id: makeId(), name: 'New section', emoji: '✨', color: PALETTE[Math.floor(Math.random() * PALETTE.length)] };
    draft.sections.splice(fd === -1 ? draft.sections.length : fd, 0, sec);
    renderSectionList();
    renderSiteGroups();
    changed();
    const input = $(`.sec-row[data-id="${sec.id}"] .name-input`);
    if (input) { input.focus(); input.select(); }
  }

  // ---------------------------------------------------------------- site editor

  function openEditor(id, sectionId) {
    const existing = id && draft.sites.find(s => s.id === id);
    const firstRegular = draft.sections.find(s => s.id !== FREE_DAY_ID) || draft.sections[0];
    editor = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: makeId(), name: '', url: '', section: sectionId || firstRegular.id, grades: [], emoji: '',
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)] };
    editor._isNew = !existing;
    editor._mode = existing
      ? (existing.logoData || /^(logos\/|data:)/.test(existing.logo || '') ? 'upload'
        : existing.logo ? 'link'
        : existing.logoMode === 'emoji' ? 'emoji' : 'auto')
      : 'auto';

    $('#site-dialog-title').textContent = existing ? 'Edit ' + existing.name : 'Add a website';
    $('#f-name').value = editor.name;
    $('#f-url').value = editor.url;
    $('#f-emoji').value = editor.emoji || '';
    $('#f-logo-url').value = editor._mode === 'link' ? editor.logo : '';
    $('#f-hidden').checked = !!editor.hidden;
    $('#f-logo-file').value = '';
    $('#f-upload-note').textContent = editor._mode === 'upload' ? 'Using your uploaded picture. Choose another to replace it.' : 'PNG or JPG. It\'ll be shrunk to fit.';
    $('#f-delete').hidden = !existing;
    $('#f-section').innerHTML = draft.sections.map(s =>
      `<option value="${escapeHtml(s.id)}">${escapeHtml((s.emoji ? s.emoji + ' ' : '') + s.name)}</option>`).join('');
    $('#f-section').value = editor.section;

    renderEditorBits();
    $('#site-dialog').showModal();
    setTimeout(() => (existing ? $('#f-name') : $('#f-url')).focus(), 50);
  }

  function renderEditorBits() {
    $$('#f-logo-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === editor._mode));
    $$('.logo-extra').forEach(el => { el.hidden = el.dataset.for !== editor._mode; });

    const colors = PALETTE.includes(editor.color) ? PALETTE : PALETTE.concat(editor.color ? [editor.color] : []);
    $('#f-colors').innerHTML = colors.map(c =>
      `<button type="button" class="swatch ${c === editor.color ? 'active' : ''}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>`).join('') +
      `<label class="swatch custom" title="Pick any color"><input type="color" id="f-color-custom" value="${editor.color || '#a29bfe'}">🎨</label>`;

    $('#f-grades').innerHTML = GRADES.map(g =>
      `<button type="button" class="chip ${editor.grades.includes(g) ? 'on' : ''}" data-g="${g}">${g === 'K' ? 'K' : g}</button>`).join('');

    renderPreview();
  }

  function editorLogo() {
    switch (editor._mode) {
      case 'link': return $('#f-logo-url').value.trim();
      case 'upload': return editor.logoData || editor.logo || '';
      case 'emoji': return '';
      default: return logoFor({ url: normalizeUrl($('#f-url').value) });
    }
  }

  function renderPreview() {
    const name = $('#f-name').value.trim() || 'Website';
    const emoji = $('#f-emoji').value.trim();
    const src = editorLogo();
    const letter = escapeHtml(name.charAt(0).toUpperCase());
    const tile = src
      ? `<div class="logo-tile"><img src="${escapeHtml(safeUrl(src))}" alt="" referrerpolicy="no-referrer" data-letter="${letter}" data-emoji="${escapeHtml(emoji)}"></div>`
      : emoji
        ? `<div class="logo-tile"><span class="emoji">${escapeHtml(emoji)}</span></div>`
        : `<div class="logo-tile no-bg"><span class="letter">${letter}</span></div>`;
    $('#f-preview').innerHTML = `
      <div class="card holo-edge" style="--accent:${escapeHtml(editor.color || '#a29bfe')}">
        ${tile}
        <div class="card-name">${escapeHtml(name)}</div>
      </div>`;
    wireMiniLogos($('#f-preview'));
  }

  function normalizeUrl(url) {
    url = (url || '').trim();
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : 'https://' + url;
  }

  function saveEditor(e) {
    e.preventDefault();
    const name = $('#f-name').value.trim();
    const url = normalizeUrl($('#f-url').value);
    if (!name || !url || !hostOf(url)) {
      toast('Please add a name and a website address.', 'warn');
      return;
    }
    const site = {
      id: editor.id,
      name,
      url,
      section: $('#f-section').value,
      grades: GRADES.filter(g => editor.grades.includes(g)),
      color: editor.color,
      emoji: $('#f-emoji').value.trim()
    };
    if ($('#f-hidden').checked) site.hidden = true;
    if (editor._mode === 'link') site.logo = $('#f-logo-url').value.trim();
    if (editor._mode === 'upload') {
      if (editor.logoData) site.logoData = editor.logoData;
      else if (editor.logo) site.logo = editor.logo;
    }
    if (editor._mode === 'emoji') site.logoMode = 'emoji';

    const i = draft.sites.findIndex(s => s.id === site.id);
    if (i === -1) draft.sites.push(site);
    else draft.sites[i] = site;

    $('#site-dialog').close();
    renderSiteGroups();
    renderSpotlightSelect();
    renderSectionList();
    changed();
    toast(editor._isNew ? `Added ${name}. Press Publish when you're ready.` : `Saved ${name}.`);
  }

  function deleteEditing() {
    if (!confirm(`Remove ${editor.name} from the dashboard?`)) return;
    draft.sites = draft.sites.filter(s => s.id !== editor.id);
    $('#site-dialog').close();
    renderSiteGroups();
    renderSpotlightSelect();
    renderSectionList();
    changed();
  }

  /** Shrink an uploaded picture to a small PNG so it loads fast on every computer. */
  function readLogoFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('That file doesn\'t look like a picture.'));
      img.src = URL.createObjectURL(file);
    });
  }

  // ---------------------------------------------------------------- connect

  async function connect() {
    const next = {
      owner: $('#gh-owner').value.trim(),
      repo: $('#gh-repo').value.trim(),
      branch: $('#gh-branch').value.trim() || 'main',
      token: $('#gh-token').value.trim()
    };
    if (!next.owner || !next.repo || !next.token) {
      toast('Fill in the username, repository and token first.', 'warn');
      return;
    }
    const remember = $('#gh-remember').checked;
    const password = $('#gh-password').value;
    if (remember) {
      if (password.length < 6) {
        toast('Pick a password with at least 6 characters.', 'warn');
        $('#gh-password').focus();
        return;
      }
      if (password !== $('#gh-password2').value) {
        toast('The two passwords don\'t match. Try typing them again.', 'warn');
        $('#gh-password2').focus();
        return;
      }
    }
    const btn = $('#gh-connect');
    btn.disabled = true;
    btn.textContent = '⏳ Connecting…';
    try {
      const client = GitHub.client(next);
      await client.checkRepo();
      gh = client;
      await GitHub.saveCreds(next, remember, password);
      creds = Object.assign(GitHub.loadCreds(), { token: next.token });
      $('#gh-password').value = '';
      $('#gh-password2').value = '';
      lastActivity = Date.now();
      let fileExists = true;
      try {
        if (!isDirty()) await loadFromGitHub();
      } catch (err) {
        if (err.status !== 404) throw err;
        fileExists = false;
      }
      renderAll();
      toast((fileExists ? '🔗 Connected! Changes will now go live.' : '🔗 Connected! Press Publish to save your first version.') +
        (remember ? ' Your password now protects this computer.' : ''), 'info', 6000);
      if (!fileExists) baseline = '';
      updatePublishButton();
    } catch (err) {
      toast(err.message, 'error', 8000);
    } finally {
      btn.disabled = false;
      btn.textContent = '🔗 Connect';
    }
  }

  function forget() {
    GitHub.forgetToken();
    creds.token = '';
    delete creds.enc;
    creds.legacyToken = false;
    creds.remembered = false;
    $('#gh-token').value = '';
    gh = null;
    renderConnection();
    updatePublishButton();
    toast('Token forgotten on this computer.');
  }

  // ---------------------------------------------------------------- password lock

  const AUTO_LOCK_MS = 20 * 60 * 1000;
  let unlockResolve = null;
  let failedTries = 0;
  let lastActivity = Date.now();

  function showLock() {
    const dialog = $('#site-dialog');
    if (dialog.open) dialog.close();
    $('#lock-screen').hidden = false;
    $('#lock-error').hidden = true;
    $('#lock-password').value = '';
    setTimeout(() => $('#lock-password').focus(), 50);
  }

  function waitForUnlock() {
    showLock();
    return new Promise(resolve => { unlockResolve = resolve; });
  }

  function finishUnlock() {
    $('#lock-screen').hidden = true;
    lastActivity = Date.now();
    if (unlockResolve) {
      const resolve = unlockResolve;
      unlockResolve = null;
      resolve();
    } else {
      gh = creds.token && creds.owner && creds.repo ? GitHub.client(creds) : null;
      fillConnectForm();
      renderConnection();
      updatePublishButton();
    }
  }

  async function tryUnlock(e) {
    e.preventDefault();
    const password = $('#lock-password').value;
    if (!password) return;
    const btn = $('#lock-submit');
    const err = $('#lock-error');
    btn.disabled = true;
    btn.textContent = '⏳ Checking…';
    const token = await GitHub.unlockToken(creds.enc, password);
    btn.disabled = false;
    btn.textContent = '🔓 Unlock';

    if (!token) {
      failedTries++;
      const card = $('#lock-form');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      err.hidden = false;
      $('#lock-password').select();
      if (failedTries >= 5) {
        err.textContent = 'Too many tries. Wait 30 seconds.';
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; failedTries = 0; err.hidden = true; }, 30000);
      } else {
        err.textContent = 'That\'s not it. Try again.';
      }
      return;
    }
    failedTries = 0;
    creds.token = token;
    finishUnlock();
  }

  function lockNow() {
    if (!creds.enc) return;
    creds.token = '';
    gh = null;
    $('#gh-token').value = '';
    showLock();
  }

  function forgotPassword() {
    if (!confirm('This removes the saved GitHub connection from this computer.\n\n' +
      'To reconnect, make a new access token on GitHub and choose a new password. Continue?')) return;
    GitHub.forgetToken();
    creds.token = '';
    delete creds.enc;
    creds.remembered = false;
    finishUnlock();
    showTab('connect');
  }

  function wireLock() {
    $('#lock-form').addEventListener('submit', tryUnlock);
    $('#lock-forgot').addEventListener('click', forgotPassword);
    $('#lock-btn').addEventListener('click', lockNow);
    ['pointerdown', 'keydown', 'wheel'].forEach(type =>
      window.addEventListener(type, () => { lastActivity = Date.now(); }, { passive: true }));
    setInterval(() => {
      if (creds.enc && creds.token && Date.now() - lastActivity > AUTO_LOCK_MS) lockNow();
    }, 30000);
  }

  // ---------------------------------------------------------------- events

  function wireStatic() {
    $('#publish-btn').addEventListener('click', publish);

    document.addEventListener('click', e => {
      const goto = e.target.closest('[data-goto]');
      if (goto) {
        showTab(goto.dataset.goto);
        if (goto.dataset.focus) {
          const field = document.getElementById(goto.dataset.focus);
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => field.focus(), 300);
        }
      }

      const fd = e.target.closest('[data-fd]');
      if (fd) freeDay(fd.dataset.fd);

      const grade = e.target.closest('[data-grade]');
      if (grade) {
        const g = grade.dataset.grade;
        quickCommit(g === 'all' ? 'Showing all grades' : 'Showing grade ' + g, c => { c.currentGrade = g; });
      }

      const add = e.target.closest('[data-add]');
      if (add) openEditor(null, add.dataset.add);

      const act = e.target.closest('[data-act]');
      if (act) {
        const id = act.closest('.site-row').dataset.id;
        if (act.dataset.act === 'edit') openEditor(id);
        if (act.dataset.act === 'up') moveSite(id, -1);
        if (act.dataset.act === 'down') moveSite(id, 1);
        if (act.dataset.act === 'hide') {
          const site = draft.sites.find(s => s.id === id);
          if (site.hidden) delete site.hidden; else site.hidden = true;
          renderSiteGroups();
          changed();
        }
      }

      const sec = e.target.closest('[data-sec]');
      if (sec) sectionAction(sec.closest('.sec-row').dataset.id, sec.dataset.sec);
    });

    $('#site-groups').addEventListener('dblclick', e => {
      const row = e.target.closest('.site-row');
      if (row && !e.target.closest('button')) openEditor(row.dataset.id);
    });
    wireDragAndDrop();

    $$('.tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

    $('#spotlight-select').addEventListener('change', e => {
      const id = e.target.value || null;
      const site = draft.sites.find(s => s.id === id);
      quickCommit(site ? 'Mission set to ' + site.name : 'Mission cleared', c => { c.spotlight = id; });
    });

    $('#freeday-message').addEventListener('input', e => { draft.freeDay.message = e.target.value; changed(); });

    $('#add-site-btn').addEventListener('click', () => openEditor(null));
    $('#add-section-btn').addEventListener('click', addSection);

    $('#section-list').addEventListener('input', e => {
      const field = e.target.dataset.field;
      if (!field) return;
      const sec = draft.sections.find(s => s.id === e.target.closest('.sec-row').dataset.id);
      sec[field] = e.target.value;
      changed();
    });
    $('#section-list').addEventListener('change', () => { renderSiteGroups(); renderSpotlightSelect(); });

    ['className', 'tagline'].forEach(key => {
      $('#set-' + key).addEventListener('input', e => { draft.settings[key] = e.target.value; changed(); });
    });
    ['showClock', 'sparkles', 'openInNewTab'].forEach(key => {
      $('#set-' + key).addEventListener('change', e => { draft.settings[key] = e.target.checked; changed(); });
    });

    $('#fd-times-toggle').addEventListener('click', openTimesEditor);
    $('#fd-times-cancel').addEventListener('click', closeTimesEditor);
    $('#fd-times-save').addEventListener('click', saveTimes);
    $('#gh-connect').addEventListener('click', connect);
    $('#gh-remember').addEventListener('change', togglePasswordFields);
    $('#gh-forget').addEventListener('click', forget);
    $('#export-btn').addEventListener('click', downloadJson);
    $('#import-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        draft = normalize(JSON.parse(await file.text()));
        renderAll();
        toast('Backup loaded. Press Publish to make it live.');
      } catch (err) {
        toast('That file isn\'t a dashboard backup.', 'error');
      }
      e.target.value = '';
    });

    // editor dialog
    const dialog = $('#site-dialog');
    $('#site-form').addEventListener('submit', saveEditor);
    $$('#site-dialog [data-close]').forEach(b => b.addEventListener('click', () => dialog.close()));
    $('#f-delete').addEventListener('click', deleteEditing);
    ['#f-name', '#f-emoji', '#f-logo-url'].forEach(sel => $(sel).addEventListener('input', renderPreview));
    $('#f-url').addEventListener('change', () => {
      const url = normalizeUrl($('#f-url').value);
      if (url) $('#f-url').value = url;
      if (!$('#f-name').value.trim() && hostOf(url)) {
        const word = hostOf(url).split('.')[0];
        $('#f-name').value = word.charAt(0).toUpperCase() + word.slice(1);
      }
      renderPreview();
    });
    $('#f-logo-mode').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      editor._mode = b.dataset.mode;
      renderEditorBits();
    });
    $('#f-colors').addEventListener('click', e => {
      const b = e.target.closest('[data-color]');
      if (!b) return;
      editor.color = b.dataset.color;
      renderEditorBits();
    });
    $('#f-colors').addEventListener('input', e => {
      if (e.target.id !== 'f-color-custom') return;
      editor.color = e.target.value;
      renderPreview();
    });
    $('#f-colors').addEventListener('change', e => { if (e.target.id === 'f-color-custom') renderEditorBits(); });
    $('#f-grades').addEventListener('click', e => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      const g = b.dataset.g;
      editor.grades = editor.grades.includes(g) ? editor.grades.filter(x => x !== g) : editor.grades.concat(g);
      renderEditorBits();
    });
    $('#f-logo-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        editor.logoData = await readLogoFile(file);
        $('#f-upload-note').textContent = 'Got it! ' + (gh ? 'It uploads when you publish.' : '');
        renderPreview();
      } catch (err) {
        toast(err.message, 'error');
      }
    });

    window.addEventListener('beforeunload', e => {
      if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  function showTab(name) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    $$('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
  }

  function toast(message, kind, ms) {
    const el = document.createElement('div');
    el.className = 'toast glass ' + (kind || '');
    el.textContent = message;
    $('#toasts').appendChild(el);
    setTimeout(() => el.classList.add('out'), ms || 4200);
    setTimeout(() => el.remove(), (ms || 4200) + 400);
  }

  init();
})();
