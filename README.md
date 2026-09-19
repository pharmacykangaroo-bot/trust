# Trust — saddle bags + wellness shelf

Single-page, lead-generation landing site (no cart, no prices, no payments). Every CTA opens a
pre-filled WhatsApp chat or a phone call. Two product worlds share one page, and the whole theme
(colours, fonts, shadows) morphs from the warm **saddle** world to the pastel **wellness** world
as you scroll past the "switch lanes" band.

Pure static: `index.html`, `css/`, `js/app.js`, `assets/`. No build step, no dependencies.

## Change the details

| What | Where |
|---|---|
| Brand name ("Trust" / `trust.`) | find & replace in `index.html` (title, meta, JSON-LD, wordmarks, copy) and `CONTACT.brand` in `js/app.js`; also regenerate `assets/og.jpg` (1200x630, the wordmark is baked in) and update `assets/favicon.svg`, `assets/logo.png`, `assets/apple-touch-icon.png` |
| Phone / WhatsApp number | `CONTACT` in `js/app.js` (rewrites every `tel:`, `wa.me` link and phone label at runtime) **and** the same links + JSON-LD `telephone` in `index.html` (kept in HTML so the page works without JS) |
| Ship-from address | `index.html`: FAQ "Where do you ship from?", `#contact`, footer, JSON-LD `address`, and the Google Maps link |
| Theme colours / fonts | colours: the `:root[data-theme="saddle"|"wellness"]` blocks at the top of `css/base.css`; display fonts: those blocks **and** the per-section font block right below them (`main > *, .footer` / `main > [data-world="wellness"]`, `css/base.css` ~L73-82) |
| Product photos | saddle: `assets/saddle-bag-*.webp`; wellness: `assets/wellness/*.webp` (cropped to the pack only, no claim panels). Wellness cards live in `#kits` in `index.html`; each card's `data-kit` must match a chip `value` in the wellness form |
| Social preview | `assets/og.jpg` (1200x630) |

## Deploy

Netlify, connected to this GitHub repo: every push to `main` redeploys
https://trust-shop.netlify.app/. No build step (`netlify.toml` publishes the repo root).
If the URL changes, update the canonical, Open Graph/Twitter image URLs and the JSON-LD
`url`/`logo`/`image` in `index.html`.
