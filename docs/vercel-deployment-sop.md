# SOP — Deploying a Client Microsite to Vercel

Audience: anyone on the team deploying a new executive microsite, or migrating
an existing Netlify site over to Vercel.

Vercel account: **repdefhostings-projects** (all client projects live here).

---

## Background

This template's CMS (Netlify CMS / Decap CMS) normally authenticates editors
through Netlify Identity + git-gateway. That service does not exist on Vercel,
so Vercel deploys instead use the CMS's built-in **GitHub backend**: editors
log in with a GitHub account, and a small OAuth proxy (two serverless
functions already in this repo, `api/auth.js` and `api/callback.js`) handles
the login handshake.

**Important — one GitHub OAuth App per client, not a shared one.** A GitHub
OAuth App only supports a single registered callback URL. If several client
sites shared one App, whichever client's domain was entered last would break
login for every other client the moment two people needed to edit content on
different days. Creating a dedicated OAuth App per client avoids this — it
takes about 2 minutes and there's no meaningful limit on how many an org can
have.

**SEO note — this also protects the client's domain ranking.** Every Vercel
project gets a permanent `project-name.vercel.app` domain that stays live and
crawlable even after a custom domain is attached. Left alone, that's a
duplicate-content risk: Google could index the `.vercel.app` URL alongside
(or instead of) the client's real domain, which directly undermines this
template's whole purpose (see `CLAUDE.md`'s SEO Architecture section — ranking
for `[Client Name]` is the product). Two things now guard against this:
- `SEO.js` emits a `<link rel="canonical">` tag pointing at `siteUrl` from
  `sitedata.md` (the client's real domain) on every page, regardless of which
  host served the request.
- Once a client's custom domain is attached, enable Vercel's "redirect to
  primary domain" for the `.vercel.app` domain (see Part 3) so it 301s
  everything to the real domain instead of serving duplicate content.

Because each client gets its own OAuth App with its own domain as the
callback, enabling that redirect never breaks CMS login — the login flow was
never depending on the `.vercel.app` domain staying reachable in the first
place.

---

## Part 1 — Deploy a new client site

1. From the [MPDS-Microsite README](../README.md), click **Deploy with
   Vercel**.
2. Sign in with the Vercel account that has access to `repdefhostings-projects`.
3. When prompted, name the new GitHub repository (e.g. `JaneSmith`) — this
   creates a duplicate repo under `RepDefHosting` and a matching Vercel
   project, the same way the Netlify button does today.
4. **Create this client's GitHub OAuth App** (GitHub → Settings → Developer
   settings → OAuth Apps → New OAuth App):
   - **Application name**: `<Client Name> Microsite CMS`
   - **Homepage URL**: the client's intended domain, or the project's
     `*.vercel.app` URL if a custom domain isn't ready yet
   - **Authorization callback URL**: `https://<project>.vercel.app/api/callback`
     (update this later in Part 3 once the custom domain is live)
   - Save, then generate a **Client Secret**. Copy both the Client ID and
     Secret — store them in the team's shared vault, labeled with the client
     name.
5. On Vercel's **Configure Project** screen (or afterward, in Project
   Settings → Environment Variables), set:

   | Variable | Value |
   |---|---|
   | `GATSBY_CMS_BACKEND` | `github` |
   | `GATSBY_GITHUB_REPO` | `RepDefHosting/<new-repo-name>` (exact repo you named in step 3) |
   | `GATSBY_OAUTH_BASE_URL` | `https://<project>.vercel.app` (matches the callback URL registered in step 4) |
   | `GITHUB_CLIENT_ID` | from step 4, this client's OAuth App |
   | `GITHUB_CLIENT_SECRET` | from step 4, this client's OAuth App |

6. In `src/pages/sitedata.md`, make sure `siteUrl` is already set to the
   client's intended final domain (even before that domain is attached) — the
   canonical tag and Person schema both key off this field.
7. Click **Deploy** (or redeploy, if env vars were added after the first
   build). Wait for the build to finish.
8. Visit `https://<project>.vercel.app/admin/` — you should see the Decap CMS
   login screen with a **Login with GitHub** button instead of Netlify
   Identity's email/password screen.
9. Log in with a GitHub account that has write access to the new client repo
   (add the client's editor as a collaborator on the repo first, if needed).

---

## Part 2 — Attaching a custom domain (e.g. `aboutjanesmith.com`)

Once the client's real domain is ready to go live:

1. **Vercel → Project → Settings → Domains** — add the custom domain, set it
   as **Primary**.
2. Turn on **redirect to primary domain** for the `project.vercel.app`
   domain in that same list — this 301-redirects all traffic away from the
   `.vercel.app` URL, closing the duplicate-content risk described above.
3. **Update this client's GitHub OAuth App** (Settings → Developer settings →
   OAuth Apps → the app created in Part 1 step 4) — change **Authorization
   callback URL** to `https://aboutjanesmith.com/api/callback`.
4. **Update the `GATSBY_OAUTH_BASE_URL` env var** in Vercel to
   `https://aboutjanesmith.com`, then trigger a redeploy (env var changes
   only take effect on the next build).
5. Confirm `siteUrl` in `sitedata.md` matches the final custom domain exactly
   (protocol + no trailing slash) — this drives the canonical tag and schema.
6. Re-test `/admin/` login on the custom domain to confirm the OAuth flow
   still works end-to-end after the callback URL change.

From this point forward, CMS editors log in at
`https://aboutjanesmith.com/admin/` — same domain the client sees publicly.

---

## Part 3 — Migrating an existing Netlify site to Vercel

1. In Vercel, **Add New Project → Import Git Repository**, select the
   client's existing repo (do **not** use the Deploy-with-Vercel clone
   button — that creates a *new* repo, which we don't want for a migration).
2. Vercel should auto-detect `vercel.json` if the client repo has already
   been merged with the latest template (see the MPDS-Microsite session
   notes on merging template updates into client repos). If the client repo
   predates `vercel.json`/`api/auth.js`/`api/callback.js`, merge the latest
   `MPDS-Microsite` template into the client repo first (standard process —
   add `MPDS-Microsite` as a git remote, merge `template/master`, resolve
   content conflicts keeping the client's data).
3. Create a dedicated GitHub OAuth App for this client (same as Part 1 step 4)
   using the client's real domain as the callback URL directly, since it's
   already live.
4. Set the same 5 environment variables as in Part 1 step 5, using the
   *existing* repo name for `GATSBY_GITHUB_REPO` and the real domain for
   `GATSBY_OAUTH_BASE_URL`.
5. Deploy. Verify the site renders correctly and `/admin/` logs in via
   GitHub.
6. Point the client's DNS at Vercel (see Vercel's domain docs for the
   required A/CNAME records), set the custom domain as Primary, and enable
   redirect-to-primary for the `.vercel.app` domain (Part 2, steps 1–2).
7. Leave the Netlify project in place (paused/unpublished) for a short
   overlap period before deleting it, in case of DNS propagation delay.

---

## How content updates reach the live site

Two logins exist and they do different things — don't confuse them:

- **CMS login (`/admin/`, GitHub OAuth)** — where content edits happen.
  Editor logs in, edits a post, hits save → Decap CMS commits directly to
  the repo's `master` branch → the push triggers Vercel's Git integration →
  Vercel automatically builds and deploys → the live domain serves the new
  build. No manual step required. This is not instant — Gatsby is a static
  site generator, so a build always runs first, typically **1–3 minutes**.
- **Vercel dashboard login** — infrastructure only (env vars, domains,
  build logs). Not part of the content-publishing loop; nobody needs to log
  into the Vercel dashboard to publish a blog post.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Build fails with an engine/Node version error | Check `package.json` has `"engines": { "node": "20.x" }` and that no Vercel project setting overrides it to an older Node version |
| Build fails with an OpenSSL error (`error:0308010C`) | `vercel.json`'s `build.env.NODE_OPTIONS` is missing or was overridden in the Vercel dashboard |
| `/admin/` shows a blank page or console error about `backend` | `GATSBY_CMS_BACKEND` env var isn't set to exactly `github` (case-sensitive), or wasn't set before the build ran (env var changes require a redeploy) |
| Login popup opens then closes immediately with no login | `GATSBY_OAUTH_BASE_URL` doesn't match the domain the popup is actually running on, or `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are wrong/missing |
| GitHub shows `redirect_uri_mismatch` | The OAuth App's callback URL doesn't exactly match `GATSBY_OAUTH_BASE_URL + /api/callback` (protocol, trailing slash, or stale domain from before a custom-domain switch) |
| Login succeeds but saves fail with a permissions error | The logged-in GitHub account isn't a collaborator (with write access) on the client's repo |
| Site appears twice in Google (vercel.app + custom domain) | Redirect-to-primary-domain wasn't enabled for the `.vercel.app` domain (Part 2 step 2), or `siteUrl` in `sitedata.md` isn't set to the real domain |
