/* Shared helpers for the student page and the teacher control center. */
(function () {
  const CONFIG_PATH = 'data/config.json';
  const GRADES = ['K', '1', '2', '3', '4', '5', '6'];
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
      className: 'Redeemer Computer Lab',
      tagline: 'Where learning is magic',
      openInNewTab: false,
      showClock: true,
      sparkles: true,
      freeDayMinutes: [15, 30],
      freeDayExtend: 15,
      holidayTitle: 'Holiday Fun'
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

  /** Holiday sections show on the Holiday page instead of the home page. */
  function isHolidaySection(section) {
    return !!section.holiday && section.id !== FREE_DAY_ID;
  }

  /** A calendar with a star: works for any holiday. `uid` keeps gradient ids unique on the page. */
  function holidayIcon(uid) {
    const g = 'hol-' + (uid || 'a');
    return `
<svg viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="${g}-top" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff8fd0"/><stop offset="0.35" stop-color="#ffd36e"/>
      <stop offset="0.7" stop-color="#7fe3ff"/><stop offset="1" stop-color="#b9a0ff"/>
    </linearGradient>
    <linearGradient id="${g}-star" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#ffab3d"/>
    </linearGradient>
  </defs>
  <rect x="8" y="12" width="48" height="44" rx="10" fill="#ffffff"/>
  <path d="M8 22a10 10 0 0 1 10-10h28a10 10 0 0 1 10 10v4H8z" fill="url(#${g}-top)"/>
  <rect x="18.5" y="6" width="5" height="12" rx="2.5" fill="#4b2f9a"/>
  <rect x="40.5" y="6" width="5" height="12" rx="2.5" fill="#4b2f9a"/>
  <polygon points="32,30 34.8,37.1 42.5,37.6 36.6,42.5 38.5,49.9 32,45.8 25.5,49.9 27.4,42.5 21.5,37.6 29.2,37.1"
    fill="url(#${g}-star)" stroke="#f59e2b" stroke-width="0.8" stroke-linejoin="round"/>
  <path d="M48 31 Q48.6 34 51 34.5 Q48.6 35 48 38 Q47.4 35 45 34.5 Q47.4 34 48 31Z" fill="#ff8fd0"/>
  <path d="M16 43 Q16.5 45.5 18.5 46 Q16.5 46.5 16 49 Q15.5 46.5 13.5 46 Q15.5 45.5 16 43Z" fill="#7fe3ff"/>
</svg>`;
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
    loadConfig, normalize, isFreeDayOpen, siteMatchesGrade, isHolidaySection, holidayIcon,
    hostOf, logoFor, colorFor, makeId, escapeHtml, safeUrl
  };
})();
