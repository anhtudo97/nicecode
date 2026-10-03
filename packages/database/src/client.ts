import { config } from "dotenv"
import { resolve } from "node:path"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Load the root .env (three levels up), independent of the cwd. Keep in sync with prisma.config.ts.
config({ path: resolve(import.meta.dirname, "../../../.env") })

const databaseURL = process.env.DATABASE_URL

if (!databaseURL) {
    throw new Error("DATABASE_URL is not defined")
}

const adapter = new PrismaPg({
    connectionString: databaseURL
})

export const db = new PrismaClient({
    adapter
})
