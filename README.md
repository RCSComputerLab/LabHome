# ✨ Magical Computer Lab Dashboard

A kid-friendly start page for K–4 lab computers. Students click big logo cards to reach approved websites: no typing URLs, no ads, no search results.

- **`index.html`**: the student page (set this as the browser's home page)
- **`teacher.html`**: the Teacher Control Center (bookmark it on *your* computer only)

---

## 1. Put it on GitHub Pages (one time, about 10 minutes)

1. Sign in at [github.com](https://github.com) and click **New repository**.
   - Name it something like `lab`. Keep it **Public** (free GitHub Pages needs a public repo).
2. On the new repo page, click **uploading an existing file**, then drag in **everything** in this folder:
   `index.html`, `teacher.html`, `README.md`, `.nojekyll`, and the `css`, `js`, `data`, and `logos` folders.
   Click **Commit changes**.
   > Tip: `.nojekyll` is a hidden file. If you can't see it, it's fine to skip it.
3. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick **main** and **/(root)**, and click **Save**.
4. Wait a minute or two, then refresh. GitHub shows your site's address, like
   `https://YOUR-USERNAME.github.io/lab/`

Your student page is that address. Your teacher page is the same address plus `teacher.html`.

## 2. Connect the Teacher Control Center (one time)

So your changes save straight to GitHub and every lab computer updates by itself:

1. Open `https://YOUR-USERNAME.github.io/lab/teacher.html`
2. Click the **🔗 GitHub & backup** tab. Your username and repo are usually filled in for you.
3. Make an access token (the steps are on that tab too):
   - GitHub → your picture → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - **Repository access:** *Only select repositories*, then pick your `lab` repo
   - **Permissions → Repository permissions → Contents:** *Read and write*
   - Generate it, copy it, and paste it into the control center.
4. Choose a **control center password** (typed twice), then click **Connect**. The saved token is encrypted with this password, so the control center asks for it each time it opens on this computer. It also locks itself after 20 minutes without use, and you can click **🔒 Lock** anytime. Forgot it? Click *Forgot password?* on the lock screen, then reconnect with a new token.

Only do this on your own teacher computer. Without the token, nobody (including a curious student) can change anything.

## 3. Make it the home page on the lab computers

**Chrome:** Settings → **On startup** → *Open a specific page* → add your student page address.
Also turn on **Appearance → Show home button** and set it to the same address, so kids can always click 🏠 to get back.

**Edge:** Settings → **Start, home, and new tabs** → *When Edge starts* → *Open these pages* → add the address. Turn on the **Home button** and set it to the same address.

> If your school manages the computers, IT may need to set this for you. Just send them the student page address.

---

## Using the Teacher Control Center

| What | Where | Goes live |
|---|---|---|
| 🎉 **Unlock / lock Free Day** (15 min, 30 min, rest of day, or until you lock it) | Top of the page | Right away |
| 🎒 **Class in the lab**: show only sites for one grade | Top of the page | Right away |
| ⭐ **Today's Mission**: one big glowing card at the top | Top of the page | Right away |
| Add, edit, hide, or remove websites | 🌐 Websites tab | When you press **Publish** |
| Reorder sites: drag the ⠿ handle (or use ↑ ↓), even into another section | 🌐 Websites tab | When you press **Publish** |
| Add, rename, recolor, or reorder sections | 🗂️ Sections tab | When you press **Publish** |
| Page title, tagline, clock, sparkles, new-tab setting | 🎨 Look & feel tab | When you press **Publish** |

Lab computers check for changes about every 45 seconds, and GitHub takes about a minute to publish. **Changes show up on student screens within 1–2 minutes, no refreshing needed.**

A timed Free Day locks itself when time runs out, even if you forget.

### Logos

Each website card can use:
- **Website's icon** (automatic): pulls the icon the website already uses.
- **Image link**: right-click the logo on the real website → *Copy image address* → paste it in.
- **Upload**: pick a picture file (like a screenshot of the logo). It's shrunk and saved to your repo.
- **Emoji only**: a big emoji instead of a logo.

If a logo ever fails to load, the card shows the emoji (or the first letter) instead, so there's never a broken image.

### Grades

In the site editor, pick which grades a site is for (for example Starfall for K–2 only). Leave all grades unpicked to show the site to everyone. When you choose a grade under **Class in the lab**, students only see the sites tagged for that grade (plus sites tagged for everyone).

---

## Good to know

- **Free Day is a "classroom lock," not a vault.** Locked Free Day cards can't be clicked, but the site list itself is public, so a tech-savvy student could find the addresses. That's fine for K–4. Your school's web filter is still the real safety net.
- **Backups:** the 🔗 GitHub & backup tab can download all your sites and settings as one file. Every Publish is also saved in your repo's history on GitHub, so you can always go back.
- **Not connected?** You can still use the control center: **Download config** saves a `config.json`. Upload it into the `data` folder of your repo on GitHub.
- **Token expired?** Make a new one (step 2) and paste it in. Nothing else changes.

## Files

```
index.html          student page
teacher.html        teacher control center
data/config.json    all your sites, sections and settings
logos/              uploaded logo pictures
css/                styles (magic.css = shared theme)
js/                 scripts (common, sky effects, student, teacher, github)
```
