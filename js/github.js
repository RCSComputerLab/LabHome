/* Minimal GitHub contents API client used by the teacher control center. */
(function () {
  const STORE_KEY = 'lab-github';

  function loadCreds() {
    const fromSession = sessionStorage.getItem(STORE_KEY);
    const raw = fromSession || localStorage.getItem(STORE_KEY);
    const saved = raw ? safeParse(raw) : null;
    return Object.assign(guessRepo(), saved || {});
  }

  function saveCreds(creds, remember) {
    const data = JSON.stringify(creds);
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(STORE_KEY);
    (remember ? localStorage : sessionStorage).setItem(STORE_KEY, data);
  }

  function forgetToken() {
    [localStorage, sessionStorage].forEach(store => {
      const saved = safeParse(store.getItem(STORE_KEY));
      if (saved) { delete saved.token; store.setItem(STORE_KEY, JSON.stringify(saved)); }
    });
  }

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

  window.GitHub = { loadCreds, saveCreds, forgetToken, client, toBase64 };
})();
