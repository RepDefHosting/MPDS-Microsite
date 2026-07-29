/**
 * Vercel serverless function — step 1 of the Decap/Netlify CMS "github" backend
 * OAuth handshake. The CMS admin UI opens a popup to /api/auth, which redirects
 * the browser to GitHub's authorize screen. GitHub then redirects back to
 * /api/callback with a temporary code.
 *
 * Required env vars: GITHUB_CLIENT_ID
 */
module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID

  if (!clientId) {
    res.status(500).send('Missing GITHUB_CLIENT_ID environment variable')
    return
  }

  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const redirectUri = `${proto}://${host}/api/callback`

  const authorizeUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=repo,user'

  res.writeHead(302, { Location: authorizeUrl })
  res.end()
}
