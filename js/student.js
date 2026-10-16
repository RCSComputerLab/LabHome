/* Student dashboard: renders the approved sites and keeps itself up to date. */
(function () {
  const { escapeHtml, safeUrl, logoFor, colorFor, isFreeDayOpen, siteMatchesGrade, FREE_DAY_ID } = Lab;
  const REFRESH_MS = 45 * 1000;
  const GRADE_NAMES = { K: 'Kindergarten', 1: '1st Grade', 2: '2nd Grade', 3: '3rd Grade', 4: '4th Grade' };

  let config = null;
  let lastText = '';
  let lastFreeDayOpen = null;
  let trailOn = false;

  Sky.buildSky();

  async function refresh() {
    try {
      const { text, config: next } = await Lab.loadConfig();
      if (text !== lastText) {
        lastText = text;
        config = next;
        render();
      }
    } catch (err) {
      console.warn(err);
      if (!config) {
        document.getElementById('loading').innerHTML =
          '<div class="loading-star">✦</div><p>Hmm, the magic is taking a nap. Trying again…</p>';
      }
    }
  }

  function render() {
    const s = config.settings;
    document.getElementById('loading').hidden = true;
    document.getElementById('class-name').textContent = s.className;
    document.getElementById('tagline').textContent = s.tagline || '';
    document.title = s.className;
    document.getElementById('clock').hidden = !s.showClock;

    if (s.sparkles && !trailOn) { Sky.enableTrail(); trailOn = true; }

    const banner = document.getElementById('grade-banner');
    const g = config.currentGrade;
    banner.hidden = !g || g === 'all';
    if (!banner.hidden) banner.textContent = '🎒 Welcome, ' + GRADE_NAMES[g] + '!';

    renderSpotlight();
    renderSections();
    wireCards();

    const open = isFreeDayOpen(config);
    if (lastFreeDayOpen === false && open) Sky.celebrate();
    lastFreeDayOpen = open;
  }

  function visibleSites(sectionId) {
    return config.sites.filter(site =>
      site.section === sectionId && !site.hidden && siteMatchesGrade(site, config.currentGrade));
  }

  function renderSpotlight() {
    const el = document.getElementById('spotlight');
    const site = config.sites.find(x => x.id === config.spotlight && !x.hidden);
    if (!site || (site.section === FREE_DAY_ID && !isFreeDayOpen(config))) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <a class="card spotlight holo-edge" ${linkAttrs(site)} style="--accent:${colorFor(site)}">
        ${logoTile(site)}
        <div>
          <div class="spotlight-label">⭐ Today's Mission</div>
          <div class="spotlight-name">${escapeHtml(site.name)}</div>
          <div class="spotlight-hint">Click here to start!</div>
        </div>
        <div class="spotlight-go" aria-hidden="true">➜</div>
      </a>`;
  }

  function renderSections() {
    const out = [];
    const freeOpen = isFreeDayOpen(config);

    config.sections.forEach(section => {
      const sites = visibleSites(section.id);
      if (!sites.length) return;
      const accent = section.color || '#a29bfe';
      const title = `
        <h2 class="section-title">
          <span class="section-emoji">${escapeHtml(section.emoji || '✨')}</span>
          <span>${escapeHtml(section.id === FREE_DAY_ID && freeOpen ? section.name + ' is OPEN!' : section.name)}</span>
        </h2>`;

      if (section.id !== FREE_DAY_ID) {
        out.push(`<section class="section" style="--accent:${accent}">${title}
          <div class="grid">${sites.map((site, i) => card(site, i, true)).join('')}</div></section>`);
        return;
      }

      if (freeOpen) {
        out.push(`<section class="section" style="--accent:${accent}">
          <div class="freeday-wrap open glass holo-edge">${title}
            <p class="freeday-status">${escapeHtml(freeDayStatus())}</p>
            <div class="grid">${sites.map((site, i) => card(site, i, true)).join('')}</div>
          </div></section>`);
      } else {
        const msg = config.freeDay.message || 'Ask your teacher to unlock it!';
        out.push(`<section class="section" style="--accent:${accent}">${title}
          <div class="freeday-wrap freeday-locked glass">
            <div class="grid" aria-hidden="true">${sites.map((site, i) => card(site, i, false)).join('')}</div>
            <div class="lock-panel">
              <div class="lock-icon">🔒</div>
              <div class="lock-title">Free Day is locked</div>
              <div class="lock-sub">${escapeHtml(msg)}</div>
            </div>
          </div></section>`);
      }
    });

    document.getElementById('sections').innerHTML = out.length
      ? out.join('')
      : '<div class="glass empty-note">No websites yet. Your teacher will add some soon! 🌟</div>';
  }

  function freeDayStatus() {
    if (!config.freeDay.until) return 'Pick a fun site and have a blast! 🎈';
    const t = new Date(config.freeDay.until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return 'Open until ' + t + ' ⏰ Have a blast! 🎈';
  }

  function linkAttrs(site) {
    const newTab = config.settings.openInNewTab;
    return `href="${escapeHtml(safeUrl(site.url))}"` +
      (newTab ? ' target="_blank" rel="noopener noreferrer"' : ' rel="noreferrer"');
  }

  function card(site, index, isLink) {
    const tag = isLink ? 'a' : 'div';
    const attrs = isLink ? linkAttrs(site) : '';
    return `
      <${tag} class="card holo-edge" ${attrs} style="--accent:${colorFor(site, index)}" title="${escapeHtml(site.name)}">
        ${logoTile(site)}
        <div class="card-name">${escapeHtml(site.name)}</div>
      </${tag}>`;
  }

  function logoTile(site) {
    const src = logoFor(site);
    if (src) {
      return `<div class="logo-tile"><img src="${escapeHtml(safeUrl(src))}" alt="" loading="lazy" referrerpolicy="no-referrer" data-fallback="${escapeHtml(site.emoji || '')}" data-letter="${escapeHtml((site.name || '?').trim().charAt(0).toUpperCase())}"></div>`;
    }
    return fallbackTile(site.emoji, (site.name || '?').trim().charAt(0).toUpperCase());
  }

  function fallbackTile(emoji, letter) {
    return emoji
      ? `<div class="logo-tile"><span class="emoji">${escapeHtml(emoji)}</span></div>`
      : `<div class="logo-tile no-bg"><span class="letter">${escapeHtml(letter)}</span></div>`;
  }

  function wireCards() {
    document.querySelectorAll('.logo-tile img').forEach(img => {
      const useFallback = () => {
        if (img.parentElement) img.parentElement.outerHTML = fallbackTile(img.dataset.fallback, img.dataset.letter);
      };
      if (img.complete && !img.naturalWidth && img.currentSrc) return useFallback();
      img.addEventListener('error', useFallback, { once: true });
      img.addEventListener('load', () => {
        // Tiny favicons look blurry when stretched, so keep them closer to real size.
        if (img.naturalWidth && img.naturalWidth < 48) img.style.width = img.style.height = '56px';
      }, { once: true });
    });

    document.querySelectorAll('a.card').forEach(el => {
      if (!Sky.reduceMotion) {
        el.addEventListener('pointermove', e => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          el.style.setProperty('--ry', (px * 10).toFixed(2) + 'deg');
          el.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
        });
        el.addEventListener('pointerleave', () => {
          el.style.setProperty('--rx', '0deg');
          el.style.setProperty('--ry', '0deg');
        });
      }
      el.addEventListener('click', e => {
        const r = el.getBoundingClientRect();
        Sky.burst(r.left + r.width / 2, r.top + r.height / 2, 18, 110);
        const sameTab = !config.settings.openInNewTab && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0;
        if (sameTab && !Sky.reduceMotion) {
          e.preventDefault();
          const href = el.href;
          setTimeout(() => { location.href = href; }, 260);
        }
      });
    });
  }

  function tickClock() {
    const now = new Date();
    document.getElementById('clock-time').textContent =
      now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '');
    document.getElementById('clock-date').textContent =
      now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

    // Re-draw when a timed Free Day runs out.
    if (config && isFreeDayOpen(config) !== lastFreeDayOpen) render();
  }

  tickClock();
  setInterval(tickClock, 5000);
  refresh();
  setInterval(refresh, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', e => { if (e.persisted) refresh(); });
})();
