import { zValidator } from "@hono/zod-validator"
import { db } from "@nicecode/database/client"
import { MessageStatus, Mode, Role } from "@nicecode/database/enums"
import { findSupportedChatModelById } from "@nicecode/shared"
import { Hono } from "hono"
import z from "zod"

const createSessionSchema = z.object({
    title: z.string(),
    cwd: z.string().optional(),
    initialMessage: z
        .object({
            role: z.enum(Role),
            content: z.string(),
            mode: z.enum(Mode),
            model: z
                .string()
                .refine((id) => !!findSupportedChatModelById(id), "Unsupported chat model")
        })
        .optional()
})

const createSessionValidator = zValidator("json", createSessionSchema, (result, c) => {
    if (!result.success) {
        return c.json({ error: result.error }, 400)
    }
})

const app = new Hono()
    .get("/", async (c) => {
        const sessions = await db.session.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true
            }
        })

        return c.json(sessions)
    })
    .get("/:id", async (c) => {
        // await new Promise((resolve) => setTimeout(resolve, 5000))

        // throw new HTTPException(500, { message: "Internal Server Error" })

        const id = c.req.param("id")
        const session = await db.session.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        })
        if (!session) {
            return c.json({ error: "Session not found" }, 404)
        }
        return c.json(session)
    })
    .post("/", createSessionValidator, async (c) => {
        // await new Promise((resolve) => setTimeout(resolve, 5000))

        // throw new HTTPException(500, { message: "Internal Server Error" })

        const { initialMessage, ...data } = c.req.valid("json")

        const session = await db.session.create({
            data: {
                ...data,
                userId: "mock-user-id",
                ...(initialMessage && {
                    messages: {
                        create: {
                            ...initialMessage,
                            status: MessageStatus.COMPLETE
                        }
                    }
                })
            },
            include: {
                messages: true
            }
        })

        return c.json(session, 201)
    })

export default app
