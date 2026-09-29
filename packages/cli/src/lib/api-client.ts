import { hc } from "hono/client"
import type { AppType } from "@nicecode/server"

export const apiClient = hc<AppType>(process.env.API_BASE_URL ?? "http://localhost:3000")
