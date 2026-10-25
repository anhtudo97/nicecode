import * as Sentry from "@sentry/hono/bun"
import { sentry } from "@sentry/hono/bun"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import session from "./routes/session"
import chat from "./routes/chat"
import auth from "./routes/auth"
import billing from "./routes/billing"

import { requireAuth } from "./middleware/require-auth"

const app = new Hono()

app.use(
    sentry(app, {
        dsn: "https://c59fab4f9e778740edfb491ac9c80620@o4510713408192512.ingest.de.sentry.io/4512193913618512",
        tracesSampleRate: 1.0
    })
)

app.get("/debug-sentry", () => {
    // Send a log before throwing the error
    Sentry.logger.info("User triggered test error", {
        action: "test_error_endpoint"
    })
    // Send a test metric before throwing the error
    Sentry.metrics.count("test_counter", 1)
    throw new Error("My first Sentry error!")
})

app.onError((error, c) => {
    if (error instanceof HTTPException) {
        Sentry.logger.warn("Handled HTTP Error", {
            status: error.status,
            message: error.message || "Request Error",
            path: c.req.path,
            method: c.req.method
        })

        return c.json(
            {
                error: error.message
            },
            error.status
        )
    }

    Sentry.logger.error("Unhandled error", {
        path: c.req.path,
        method: c.req.method,
        message: error.message || "Internal Server Error"
    })
    return c.json({
        error: "Internal Server Error"
    })
})

app.use("/session/*", requireAuth)
app.use("/chat/*", requireAuth)
app.use("/billing/checkout", requireAuth)
app.use("/billing/portal", requireAuth)

const routes = app
    .route("/session", session)
    .route("/chat", chat)
    .route("/auth", auth)
    .route("/billing", billing)

export type AppType = typeof routes

export default {
    port: 3000,
    fetch: app.fetch,
    idleTimeout: 255
}
