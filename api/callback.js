/**
 * Vercel serverless function — step 2 of the Decap/Netlify CMS "github" backend
 * OAuth handshake. GitHub redirects here with a temporary `code`. This function
 * exchanges it server-side for an access token (so GITHUB_CLIENT_SECRET never
 * reaches the browser), then serves a small HTML page that hands the token back
 * to the CMS admin UI via postMessage — this exact handshake (posting
 * "authorizing:github", waiting for the opener's reply, then posting
 * "authorization:github:success:{...}") is the protocol Decap/Netlify CMS's
 * github backend expects; do not simplify it away.
 *
 * Required env vars: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 */
module.exports = async (req, res) => {
  const { code, error, error_description: errorDescription } = req.query

  if (error) {
    respondWithMessage(res, 'error', { message: errorDescription || error })
    return
  }

  if (!code) {
    res.status(400).send('Missing code parameter')
    return
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    res.status(500).send('Missing GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET environment variables')
    return
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })
    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      respondWithMessage(res, 'error', {
        message: tokenData.error_description || tokenData.error,
      })
      return
    }

    respondWithMessage(res, 'success', {
      token: tokenData.access_token,
      provider: 'github',
    })
  } catch (err) {
    respondWithMessage(res, 'error', { message: 'OAuth token exchange failed' })
  }
}

function respondWithMessage(res, status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(`<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      ${JSON.stringify(message)},
      e.origin
    )
    window.removeEventListener('message', receiveMessage, false)
  }
  window.addEventListener('message', receiveMessage, false)
  window.opener.postMessage('authorizing:github', '*')
})()
</script>
</body>
</html>`)
}
