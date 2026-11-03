/* Keeps an activity closed until the teacher opens the Holiday page (and hasn't hidden this activity).
   Use: <body class="gate-pending"> and <script src="../gate.js" data-activity="activity-id"></script> */
(function () {
  const CONFIG_URL = '../../data/config.json';
  const CHECK_MS = 60 * 1000;
  const activityId = document.currentScript.dataset.activity;

  async function check() {
    let config;
    try {
      const res = await fetch(CONFIG_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(res.status);
      config = await res.json();
    } catch (err) {
      // Can't reach the settings: don't lock kids out over a hiccup.
      document.body.classList.remove('gate-pending');
      return;
    }
    const hidden = Array.isArray(config.hiddenActivities) && config.hiddenActivities.includes(activityId);
    if (config.holidayOpen === true && !hidden) {
      document.body.classList.remove('gate-pending');
    } else {
      lock();
    }
  }

  function lock() {
    clearInterval(timer);
    document.querySelector('main').innerHTML = `
      <div class="gate-closed glass">
        <div class="gate-icon">🔒</div>
        <div class="gate-title">Coming soon!</div>
        <div class="gate-sub">Your teacher will open the holiday activities soon.</div>
        <a class="pill-btn" href="../../">🏠 Back to Home</a>
      </div>`;
    document.body.classList.remove('gate-pending');
  }

  check();
  // Close the activity if the teacher locks the Holiday page while kids are using it.
  const timer = setInterval(check, CHECK_MS);
})();
