# Signal Unity — GitHub Pages website v4

Complete static website for deployment to a dedicated GitHub Pages repository. The website includes 23 distinct Signal tvOS screenshots and the official supplied launcher artwork, with illustrated feature explanations and a six-image complementary gallery, original Signal logo, a Unity feature narrative, Trakt/Resume, VOD caching and Live TV timeshift, MediaFlow Proxy, AetherEngine, customizable themes, cast wall, Quick Guide, distribution notes and future development roadmap.

## Review locally
Run `python3 -m http.server 8000` from this directory and open `http://localhost:8000` in a browser.

## Deploy
Upload `index.html`, `styles.css`, `script.js`, `assets/`, `privacy.html`, `terms.html`, `404.html`, `favicon.svg`, `.nojekyll`, and `robots.txt` to a dedicated repository. In repository Settings → Pages choose Deploy from a branch, main, root. Do not publish this in the tvOS build repository. For a custom domain, configure GitHub Pages and DNS only once the domain is owned and ready.

## Public launch review
The legal pages are preliminary, third-party movie/show screenshots may require promotional rights review, and distribution language should be confirmed before public launch. Claims about future Apple TV hardware are intentionally qualified.

The cinematic opening uses the real app screenshot and supplied launcher artwork. Dedicated VOD overlay and episode-alert sections explain the new images. CSS light trails, scroll reveals, screen highlights, a pointer-responsive stage and navigation progress provide motion. Decorative loops pause outside visible sections and when the page is hidden; reduced-motion preferences are respected.

The catalog-previews showcase uses the existing MobLand screenshot once, enlarges the in-card preview and media-profile view, and preserves the original watch-journey explanation. An actual app recording is still needed for the walkthrough video and feature clips; no simulated playback is presented as recorded footage.
