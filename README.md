# Maverich

Landing page for **Maverich**, served at <https://maver1ch.world>.

Maverich is an AI learning companion for people with a real goal. It turns the content you save into skills you can prove. Private beta: visitors request access by email.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole landing page (all copy lives here) |
| `styles.css` | Tokens, per-section themes (`.theme-dark` / `.theme-light`), base, pills, header, hero, footer |
| `components.css` | Statements (word reveal), chapters 01–04 with sticky index, glass mini-UIs, proof tabs, numeral, goals marquee, FAQ, access form, reveal |
| `script.js` | Header theme follows the chapter under it, scroll word reveal, chapter index, accessible tabs, marquee loop, form validation (opens a pre-filled email), reveal. Page works without it. |
| `hero-canvas.js` | Generative hero background: drifting content particles, constellation links, owned dots on the ring. Static frame under reduced motion. |
| `404.html` | Not-found page served by GitHub Pages |
| `favicon.svg` | Maverich mark (filled core inside an open ring) |
| `og-image.png` | 1200×630 social card |
| `CNAME` | Custom domain for GitHub Pages |
| `robots.txt`, `sitemap.xml` | Search engine hints |

Plain HTML, CSS and a small vanilla JS file. No build step, no dependencies.

## Edit and preview

```sh
python3 -m http.server -d . 8080
# open http://localhost:8080
```

Change text in `index.html`. Colors live in the `.theme-dark` / `.theme-light` blocks at the top of `styles.css`; the page alternates dark and light chapters on purpose and ignores the OS color scheme. The request-access form has no backend: it opens the visitor's mail app with a pre-filled message to `victor@maver1ch.world`. Swap in a form service later if volume grows.

## Deploy

GitHub Pages deploys from the `main` branch root. Push to `main` and the site updates in about a minute.

DNS is on Cloudflare (records are DNS only, not proxied, so GitHub can issue the TLS certificate). Mail to `victor@maver1ch.world` is forwarded by Cloudflare Email Routing.

One-time GitHub setup: verify `maver1ch.world` under GitHub → Settings → Pages → Verified domains (blocks domain takeover), add a `www` CNAME record to `maver1ch.github.io`, and tick **Enforce HTTPS** once the certificate is issued.
