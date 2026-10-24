import { createMiddleware } from "hono/factory"
import { authenticateOAuthRequest } from "../lib/auth"

export type AuthenticatedEnv = {
    Variables: {
        userId: string
    }
}

export const requireAuth = createMiddleware<AuthenticatedEnv>(async (c, next) => {
    // Only a definite "not authenticated" is a 401 (the CLI deletes its token on 401).
    // Unexpected failures (Clerk outage, bad config) propagate to app.onError instead.
    const auth = await authenticateOAuthRequest(c.req.raw)
    if (!auth) {
        return c.json({ error: "Unauthorized. Run /login to continue." }, 401)
    }

    c.set("userId", auth.userId)
    await next()
})
