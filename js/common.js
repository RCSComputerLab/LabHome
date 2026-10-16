/* Shared helpers for the student page and the teacher control center. */
(function () {
  const CONFIG_PATH = 'data/config.json';
  const GRADES = ['K', '1', '2', '3', '4'];
  const FREE_DAY_ID = 'freeday';

  const PALETTE = [
    '#ff6b9d', '#ff9f43', '#feca57', '#7bed9f', '#2ed8b6',
    '#48dbfb', '#54a0ff', '#a29bfe', '#d980fa', '#ff7eb6'
  ];

  /** Load config.json from this site. The timestamp skips any cached copy. */
  async function loadConfig() {
    const res = await fetch(CONFIG_PATH + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load ' + CONFIG_PATH + ' (' + res.status + ')');
    const text = await res.text();
    return { text, config: normalize(JSON.parse(text)) };
  }

  /** Fill in anything missing so older or hand-edited files still work. */
  function normalize(c) {
    c = c || {};
    c.settings = Object.assign({
      className: 'Our Magical Computer Lab',
      tagline: 'Where learning is magic',
      openInNewTab: false,
      showClock: true,
      sparkles: true
    }, c.settings || {});
    c.freeDay = Object.assign({ unlocked: false, until: null, message: '' }, c.freeDay || {});
    c.currentGrade = c.currentGrade || 'all';
    c.spotlight = c.spotlight || null;
    c.sections = Array.isArray(c.sections) ? c.sections : [];
    if (!c.sections.some(s => s.id === FREE_DAY_ID)) {
      c.sections.push({ id: FREE_DAY_ID, name: 'Free Day', emoji: '🎉', color: '#d980fa' });
    }
    c.sites = Array.isArray(c.sites) ? c.sites : [];
    c.sites.forEach(s => {
      s.id = s.id || makeId();
      s.grades = Array.isArray(s.grades) ? s.grades : [];
      if (!c.sections.some(sec => sec.id === s.section)) s.section = c.sections[0].id;
    });
    return c;
  }

  /** Free Day counts as open only while the unlock hasn't expired. */
  function isFreeDayOpen(c) {
    if (!c.freeDay.unlocked) return false;
    if (!c.freeDay.until) return true;
    return Date.now() < new Date(c.freeDay.until).getTime();
  }

  function siteMatchesGrade(site, grade) {
    if (!grade || grade === 'all') return true;
    return !site.grades.length || site.grades.includes(grade);
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /** The image to show on a card: the teacher's logo, else the site's own icon. */
  function logoFor(site) {
    if (site.logo) return site.logo;
    if (site.logoMode === 'emoji') return '';
    const host = hostOf(site.url);
    return host ? 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(host) + '&sz=256' : '';
  }

  function colorFor(site, index) {
    return site.color || PALETTE[Math.abs(hash(site.id || site.name || '') + (index || 0)) % PALETTE.length];
  }

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
  }

  function makeId() {
    return Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  /** Only allow web links, files in this repo, and inline images. */
  function safeUrl(url) {
    if (/^data:image\//.test(url || '')) return url;
    try {
      const u = new URL(url, location.href);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '#';
    } catch (e) { return '#'; }
  }

  window.Lab = {
    CONFIG_PATH, GRADES, FREE_DAY_ID, PALETTE,
    loadConfig, normalize, isFreeDayOpen, siteMatchesGrade,
    hostOf, logoFor, colorFor, makeId, escapeHtml, safeUrl
  };
})();
