import { text } from "node:stream/consumers"
import { z } from "zod"

export const toolCallArgsSchema = z.record(z.string(), z.json())

export const messagePartScheme = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("reasoning"),
        text
    }),
    z.object({
        type: z.literal("tool-call"),
        id: z.string(),
        name: z.string(),
        args: toolCallArgsSchema,
        result: z.string().optional()
    }),
    z.object({
        type: z.literal("text"),
        content: z.string()
    })
])

export const messagePartsSchema = z.array(messagePartScheme)

export type MessagePart = z.infer<typeof messagePartScheme>

export const charStreamEventSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("text-delta"),
        text: z.string()
    }),
    z.object({
        type: z.literal("reasoning-delta"),
        text: z.string()
    }),
    z.object({
        type: z.literal("tool-call-delta"),
        toolCallId: z.string(),
        toolName: z.string(),
        args: toolCallArgsSchema
    }),
    z.object({
        type: z.literal("tool-result"),
        toolCallId: z.string(),
        result: z.string()
    }),
    z.object({
        type: z.literal("done"),
        messageId: z.string(),
        durationMs: z.number()
    }),
    z.object({
        type: z.literal("error"),
        message: z.string()
    })
])

export type CharStreamEvent = z.infer<typeof charStreamEventSchema>
