# Seed a client site before the review deploy

`seed-client.js` writes one client brief into the Markdown files the public site and `/admin/` both read. Run it on a **copy** of the template, before the first Vercel build, so the preview is not full of placeholders.

It does not create the GitHub repo, the Vercel project, or the GitHub OAuth app. Those still follow `docs/vercel-deployment-sop.md`. GitHub has no API for creating an OAuth app.

## 1. Copy the brief

```bash
cp scripts/client.example.md /tmp/jane-smith.md
```

Required fields: `name`, `jobTitle`, `location`, `siteUrl`, `shortBio`, `longBio`.

`siteUrl` must be the client's final `https://` domain, even if DNS is not attached yet. Optional: `email`, `headshot`, `linkedin`, `sameAs`, `socialLinks`, `showPress`, `showGallery`.

## 2. Seed a client checkout, not the template

```bash
node scripts/seed-client.js --input /tmp/jane-smith.md --root ../JaneSmith --dry-run
node scripts/seed-client.js --input /tmp/jane-smith.md --root ../JaneSmith
```

That updates:

- `src/pages/sitedata.md` — name, title, bios, links, site URL
- `src/pages/index.md` — homepage copy, meta description, contact button
- `src/pages/profile.md` — profile heading and full bio
- blog and gallery archive meta descriptions

Commit those files on the client repo before deploying.

## 3. Review, then go live

1. Deploy the seeded repo to Vercel with Deployment Protection on.
2. Open the preview and `/admin/` and fix anything the brief missed.
3. Attach the real domain and turn protection off only after the preview is approved.

Headshots are not downloaded. Put the image in `static/img/` and set `headshot: /img/jane-smith.jpg`, or upload it in the CMS after the first deploy.
