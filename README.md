# Maverich

Landing page for **Maverich**, served at <https://maver1ch.world>.

Maverich is an AI learning companion for people with a real goal. It turns the content you save into skills you can prove. Private beta: visitors request access by email.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole landing page (all copy lives here) |
| `styles.css` | Design tokens (CSS variables), base, layout, header, hero, footer, dark mode |
| `components.css` | Request-access form, hero product demo, feature cards, tabs, chips, FAQ, CTA band, scroll reveal |
| `script.js` | Demo auto-advance + typing, accessible tabs, form validation (opens a pre-filled email), scroll reveal. Page works without it. |
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

Change text in `index.html`. Change colors and fonts in the `:root` block at the top of `styles.css`. The request-access form has no backend: it opens the visitor's mail app with a pre-filled message to `victor@maver1ch.world`. Swap in a form service later if volume grows.

## Deploy

GitHub Pages deploys from the `main` branch root. Push to `main` and the site updates in about a minute.

DNS is on Cloudflare (records are DNS only, not proxied, so GitHub can issue the TLS certificate). Mail to `victor@maver1ch.world` is forwarded by Cloudflare Email Routing.

One-time GitHub setup: verify `maver1ch.world` under GitHub → Settings → Pages → Verified domains (blocks domain takeover), add a `www` CNAME record to `maver1ch.github.io`, and tick **Enforce HTTPS** once the certificate is issued.
