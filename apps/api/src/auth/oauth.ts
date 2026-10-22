import crypto from "node:crypto"

// OAuth2 with PKCE and a state parameter, shared by every platform. The access
// token never reaches the browser, and CSRF is prevented by the state check.
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
