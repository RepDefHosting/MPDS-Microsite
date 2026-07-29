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

One GitHub OAuth App, set up once, is reused for every client site deployed
to Vercel. You do **not** need a new OAuth App per client.

---

## Part 1 — One-time setup (already done / only redo if it breaks)

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   (create it under the `RepDefHosting` org if possible, otherwise a shared
   team account).
2. Fill in:
   - **Application name**: `RepDefHosting Microsite CMS`
   - **Homepage URL**: `https://repdefhostings-projects.vercel.app` (or any
     placeholder — not load-bearing)
   - **Authorization callback URL**: see note below
3. Save the app. Copy the **Client ID** and generate + copy a **Client Secret**.
   Store both somewhere the team can retrieve them (password manager /
   shared vault) — you'll paste these into every client project's env vars.

> **Callback URL note:** GitHub OAuth Apps only support one callback URL per
> app (unlike GitHub Apps, which support wildcards). Since every client site
> has its own Vercel domain, the exact callback URL differs per project. In
> practice this is only a problem the first time a client's custom domain is
> attached — see **Part 3** for the fix. Day one, the default
> `*.vercel.app` preview domain works immediately.

---

## Part 2 — Deploy a new client site

1. From the [MPDS-Microsite README](../README.md), click **Deploy with
   Vercel**.
2. Sign in with the Vercel account that has access to `repdefhostings-projects`.
3. When prompted, name the new GitHub repository (e.g. `JaneSmith`) — this
   creates a duplicate repo under `RepDefHosting` and a matching Vercel
   project, the same way the Netlify button does today.
4. On the **Configure Project** screen, Vercel will prompt for these
   environment variables (from `vercel.json`'s declared list) — fill them in:

   | Variable | Value |
   |---|---|
   | `GATSBY_CMS_BACKEND` | `github` |
   | `GATSBY_GITHUB_REPO` | `RepDefHosting/<new-repo-name>` (exact repo you just named in step 3) |
   | `GATSBY_OAUTH_BASE_URL` | the Vercel project URL, e.g. `https://jane-smith.vercel.app` (you can leave this blank and fill it in after first deploy once you know the assigned domain, then redeploy) |
   | `GITHUB_CLIENT_ID` | from Part 1 |
   | `GITHUB_CLIENT_SECRET` | from Part 1 |

5. Click **Deploy**. Wait for the build to finish.
6. Once deployed, confirm/update `GATSBY_OAUTH_BASE_URL` to match the actual
   assigned domain (Project → Settings → Environment Variables), then trigger
   a redeploy if you changed it.
7. Visit `https://<project-domain>/admin/` — you should see the Decap CMS
   login screen with a **Login with GitHub** button instead of Netlify
   Identity's email/password screen.
8. Log in with a GitHub account that has write access to the new client repo
   (add the client's editor as a collaborator on the repo first, if needed).

---

## Part 3 — Attaching a custom domain (e.g. `aboutjanesmith.com`)

Because the GitHub OAuth App only has one registered callback URL, attaching
a custom domain to a client site means the OAuth callback for **that specific
site** will fail once the custom domain replaces the `.vercel.app` one as the
primary domain, unless you keep `GATSBY_OAUTH_BASE_URL` pointed at a domain
whose `/api/callback` matches the OAuth App's registered callback.

Two options:

- **Simplest:** Leave `GATSBY_OAUTH_BASE_URL` set to the project's original
  `*.vercel.app` domain (Vercel keeps this domain live even after a custom
  domain is attached). CMS editors log in via `https://<project>.vercel.app/admin/`
  regardless of what the public-facing custom domain is. This works with zero
  extra setup — **recommended for now.**
- **If a dedicated callback per client is ever needed:** create a separate
  GitHub OAuth App per client (or migrate to a GitHub **App** instead of an
  OAuth App, which does support multiple callback URLs). Not needed at
  current scale — revisit only if this becomes a real pain point.

---

## Part 4 — Migrating an existing Netlify site to Vercel

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
3. Set the same 5 environment variables as in Part 2, using the *existing*
   repo name for `GATSBY_GITHUB_REPO`.
4. Deploy. Verify the site renders correctly and `/admin/` logs in via
   GitHub.
5. Point the client's DNS at Vercel (see Vercel's domain docs for the
   required A/CNAME records) once verified.
6. Leave the Netlify project in place (paused/unpublished) for a short
   overlap period before deleting it, in case of DNS propagation delay.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Build fails with an engine/Node version error | Check `package.json` has `"engines": { "node": "20.x" }` and that no Vercel project setting overrides it to an older Node version |
| Build fails with an OpenSSL error (`error:0308010C`) | `vercel.json`'s `build.env.NODE_OPTIONS` is missing or was overridden in the Vercel dashboard |
| `/admin/` shows a blank page or console error about `backend` | `GATSBY_CMS_BACKEND` env var isn't set to exactly `github` (case-sensitive), or wasn't set before the build ran (env var changes require a redeploy) |
| Login popup opens then closes immediately with no login | `GATSBY_OAUTH_BASE_URL` doesn't match the domain the popup is actually running on, or `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` are wrong/missing |
| Login succeeds but saves fail with a permissions error | The logged-in GitHub account isn't a collaborator (with write access) on the client's repo |
