import open from "open"
import { saveAuth } from "./auth"

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000

type OAuthState = {
    nonce: string
    port: number
}

function toBase64Url(input: Uint8Array | string) {
    return Buffer.from(input).toString("base64url")
}

async function createPkceChallenge(verifier: string) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))
    return toBase64Url(new Uint8Array(digest))
}

function encodeState(state: OAuthState) {
    return toBase64Url(JSON.stringify(state))
}

function decodeState(state: string) {
    const [encoded] = state.split(".")
    if (!encoded) {
        throw new Error("Invalid state")
    }

    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as OAuthState
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error)
}

function toError(error: unknown) {
    return error instanceof Error ? error : new Error(getErrorMessage(error))
}

export async function performLogin() {
    const clerkFrontendApi = process.env.CLERK_FRONTEND_API
    const clientId = process.env.CLERK_OAUTH_CLIENT_ID
    const apiUrl = process.env.API_URL ?? "http://localhost:3000"

    if (!clerkFrontendApi) throw new Error("CLERK_FRONTEND_API not set")
    if (!clientId) throw new Error("CLERK_OAUTH_CLIENT_ID not set")

    const nonce = crypto.randomUUID()
    const codeVerifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)))
    const codeChallenge = await createPkceChallenge(codeVerifier)
    const redirectUri = `${apiUrl}/auth/callback`

    return new Promise<{ token: string }>((resolve, reject) => {
        // `done` guards against duplicate callbacks; `finish` is the only exit path
        let done = false
        const timeout = setTimeout(() => finish(new Error("Login timed out")), LOGIN_TIMEOUT_MS)

        const finish = (result: { token: string } | Error) => {
            if (done) return
            done = true
            clearTimeout(timeout)
            // Delay stop so the response can still reach the browser
            setTimeout(() => server.stop(), 500)
            if (result instanceof Error) reject(result)
            else resolve(result)
        }

        const server = Bun.serve({
            // Loopback only: the API redirects the browser here, nothing else should reach it
            hostname: "127.0.0.1",
            port: 0,
            async fetch(req) {
                const url = new URL(req.url)

                if (url.pathname !== "/callback") {
                    return new Response("Not found", { status: 404 })
                }
                if (done) {
                    return new Response("Login already handled", { status: 409 })
                }

                const error = url.searchParams.get("error")
                if (error) {
                    const msg = url.searchParams.get("error_description") ?? error
                    finish(new Error(msg))
                    return new Response(`Authentication failed: ${msg}`, { status: 400 })
                }

                const code = url.searchParams.get("code")
                const state = url.searchParams.get("state")
                if (!code || !state) {
                    finish(new Error("Missing code or state"))
                    return new Response("Bad request", { status: 400 })
                }

                // Verify nonce from state (CSRF protection)
                try {
                    if (decodeState(state).nonce !== nonce) throw new Error("State mismatch")
                } catch (err) {
                    finish(toError(err))
                    return new Response("Invalid state", { status: 400 })
                }

                try {
                    // Exchange authorization code (+ PKCE verifier) for Clerk tokens
                    const tokenRes = await fetch(`${clerkFrontendApi}/oauth/token`, {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams({
                            grant_type: "authorization_code",
                            code,
                            redirect_uri: redirectUri,
                            client_id: clientId,
                            code_verifier: codeVerifier
                        })
                    })

                    if (!tokenRes.ok) {
                        const details = await tokenRes.text()
                        throw new Error(details || "Failed to exchange authorization code")
                    }

                    const { access_token: token } = (await tokenRes.json()) as {
                        access_token?: string
                    }
                    if (!token) throw new Error("Token response missing access_token")

                    saveAuth({ token })
                    finish({ token })
                    return new Response("Authenticated! You can close this tab.")
                } catch (err) {
                    finish(toError(err))
                    return new Response(`Authentication failed: ${getErrorMessage(err)}`, {
                        status: 400
                    })
                }
            }
        })

        // State carries the local port so the API's /auth/callback can redirect back to this CLI
        if (typeof server.port !== "number") {
            finish(new Error("Failed to start callback server"))
            return
        }
        const state = encodeState({ port: server.port, nonce })

        const authorizeUrl = new URL(`${clerkFrontendApi}/oauth/authorize`)
        authorizeUrl.searchParams.set("response_type", "code")
        authorizeUrl.searchParams.set("client_id", clientId)
        authorizeUrl.searchParams.set("redirect_uri", redirectUri)
        authorizeUrl.searchParams.set("scope", "openid email profile")
        authorizeUrl.searchParams.set("state", state)
        authorizeUrl.searchParams.set("prompt", "login")
        authorizeUrl.searchParams.set("code_challenge", codeChallenge)
        authorizeUrl.searchParams.set("code_challenge_method", "S256")

        open(authorizeUrl.toString()).catch((err: unknown) =>
            finish(new Error(`Failed to open browser: ${getErrorMessage(err)}`))
        )
    })
}
