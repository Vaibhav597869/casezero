# CASEZERO

A mobile-first, static detective mystery game. Deploy directly to Netlify or another static host; no build step or runtime dependencies are required.

## Local preview

Serve the repository root as the site root (or open `index.html`). The document links to `./styles.css` and `./app.js`; all visual artwork is stored under `./assets/` as local SVG files, so the complete visual design does not depend on third-party image servers or font CDNs.

## Play

Start Investigation opens the playable Case 001. Inspect three evidence items, compare suspect statements, and submit a deduction. Solved-case progress and accessibility preferences are saved in local storage. Later case files are presented as locked previews.
