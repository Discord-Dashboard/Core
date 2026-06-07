import crypto from "node:crypto"

// Discord OAuth2 with PKCE and a state parameter. The access token never
// reaches the browser, and CSRF is prevented by the state check.
export function createPkce() {
  const verifier = crypto.randomBytes(32).toString("base64url")
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
  return { verifier, challenge }
}

export function createState() {
  return crypto.randomBytes(16).toString("base64url")
}

export function buildAuthorizeUrl(input: {
  clientId: string
  redirectUri: string
  state: string
  challenge: string
  scopes: string[]
}) {
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: input.scopes.join(" "),
    state: input.state,
    code_challenge: input.challenge,
    code_challenge_method: "S256",
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}
