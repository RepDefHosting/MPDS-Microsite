# RD Executive Template

A custom, image-centric theme for Gatsby.

**Based on [London](https://github.com/TryGhost/London) for Ghost**

## Deploy a new client site

Both buttons duplicate this repo into a new repository and connect it to a new
hosting project — pick one per client. **Vercel is the primary/preferred
option going forward**; Netlify is kept for existing sites and as a fallback.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RepDefHosting/MPDS-Microsite&env=GATSBY_CMS_BACKEND,GATSBY_GITHUB_REPO,GATSBY_OAUTH_BASE_URL,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET&envDescription=Required%20for%20the%20Decap%2FNetlify%20CMS%20GitHub%20OAuth%20backend%20%E2%80%94%20see%20docs%2Fvercel-deployment-sop.md&project-name=client-site&repository-name=client-site)

After the Vercel deploy finishes, see [`docs/vercel-deployment-sop.md`](docs/vercel-deployment-sop.md)
for the per-client GitHub OAuth App setup and the env var values to fill in.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/RepDefHosting/MPDS-Microsite&stack=cms)
