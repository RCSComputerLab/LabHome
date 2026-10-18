/* Minimal GitHub contents API client used by the teacher control center. */
(function () {
  const STORE_KEY = 'lab-github';

  /**
   * Saved connection details. A remembered token is stored encrypted with the
   * teacher's password (`enc`); `legacyToken` flags an older unencrypted one.
   */
  function loadCreds() {
    const session = safeParse(sessionStorage.getItem(STORE_KEY));
    if (session) return Object.assign(guessRepo(), session, { remembered: false });
    const saved = safeParse(localStorage.getItem(STORE_KEY)) || {};
    return Object.assign(guessRepo(), saved, {
      remembered: !!(saved.enc || saved.token),
      legacyToken: !!saved.token
    });
  }

  /** Remembered tokens are always encrypted with the password; others last until the browser closes. */
  async function saveCreds(creds, remember, password) {
    const base = { owner: creds.owner, repo: creds.repo, branch: creds.branch };
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    if (remember) {
      base.enc = await encrypt(creds.token, password);
      localStorage.setItem(STORE_KEY, JSON.stringify(base));
    } else {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(Object.assign(base, { token: creds.token })));
    }
  }

  function forgetToken() {
    [localStorage, sessionStorage].forEach(store => {
      const saved = safeParse(store.getItem(STORE_KEY));
      if (saved) {
        delete saved.token;
        delete saved.enc;
        store.setItem(STORE_KEY, JSON.stringify(saved));
      }
    });
  }

  // ---- password encryption (PBKDF2 + AES-GCM, built into the browser) ----

  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function encrypt(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
    return { salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(data)) };
  }

  /** Returns the token, or null if the password is wrong. */
  async function unlockToken(enc, password) {
    try {
      const key = await deriveKey(password, b64ToBytes(enc.salt));
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(enc.iv) }, key, b64ToBytes(enc.data));
      return new TextDecoder().decode(plain);
    } catch (e) {
      return null;
    }
  }

  function bytesToB64(bytes) { return btoa(String.fromCharCode.apply(null, bytes)); }
  function b64ToBytes(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

  /** On username.github.io/repo/, fill in the username and repo for the teacher. */
  function guessRepo() {
    const host = location.hostname;
    const m = host.match(/^([^.]+)\.github\.io$/i);
    if (!m) return { owner: '', repo: '', branch: 'main' };
    const first = location.pathname.split('/').filter(Boolean)[0];
    const repo = first && !/\.html?$/i.test(first) ? first : host;
    return { owner: m[1], repo, branch: 'main' };
  }

  function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }

  function client(creds) {
    const base = `https://api.github.com/repos/${encodeURIComponent(creds.owner)}/${encodeURIComponent(creds.repo)}`;

    async function call(path, opts) {
      const res = await fetch(base + path, Object.assign({
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: 'Bearer ' + creds.token,
          'X-GitHub-Api-Version': '2022-11-28'
        },
        cache: 'no-store'
      }, opts || {}));
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).message || ''; } catch (e) { /* ignore */ }
        const err = new Error(friendlyError(res.status, detail));
        err.status = res.status;
        throw err;
      }
      return res.status === 204 ? null : res.json();
    }

    return {
      async checkRepo() {
        const repo = await call('');
        if (repo.permissions && !repo.permissions.push) {
          throw new Error("This token can see the repository but can't save to it. Give it Contents: Read and write.");
        }
        return repo;
      },
      async getFile(path) {
        const data = await call(`/contents/${path}?ref=${encodeURIComponent(creds.branch)}`);
        return { sha: data.sha, text: fromBase64(data.content) };
      },
      async getSha(path) {
        try { return (await this.getFile(path)).sha; } catch (e) { if (e.status === 404) return null; throw e; }
      },
      async putFile(path, base64, message, sha) {
        const body = { message, content: base64, branch: creds.branch };
        if (sha) body.sha = sha;
        const data = await call(`/contents/${path}`, {
          method: 'PUT',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: 'Bearer ' + creds.token,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        return data.content.sha;
      }
    };
  }

  function friendlyError(status, detail) {
    if (status === 401) return 'GitHub didn\'t accept the token. It may be mistyped or expired.';
    if (status === 403) return 'GitHub said no (' + (detail || 'permission denied') + '). Check the token\'s Contents permission.';
    if (status === 404) return 'Couldn\'t find that repository or file. Check the username, repository and branch.';
    if (status === 409) return 'Someone else saved at the same moment. Try again.';
    if (status === 422) return 'GitHub couldn\'t save that (' + detail + ').';
    return 'GitHub error ' + status + (detail ? ': ' + detail : '');
  }

  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function fromBase64(b64) {
    const bin = atob(b64.replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  window.GitHub = { loadCreds, saveCreds, forgetToken, unlockToken, client, toBase64 };
})();
