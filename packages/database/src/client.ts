import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

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
