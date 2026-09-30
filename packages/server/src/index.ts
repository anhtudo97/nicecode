import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import session from "./routes/session"

const app = new Hono()

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.json(
            {
                error: err.message
            },
            err.status
        )
    }

    console.error("Unhandled error:", err)

    return c.json({
        error: "Internal Server Error"
    })
})

const routes = app.route("/session", session)

export type AppType = typeof routes

export default {
    port: 3000,
    fetch: app.fetch,
    idleTimeout: 255
}
