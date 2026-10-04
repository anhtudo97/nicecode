import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import {
    findSupportedChatModelById,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider
} from "@nicecode/shared"
import type { LanguageModel } from "ai"

type AnthropicModelId = Extract<SupportedChatModel, { provider: "anthropic" }>["id"]
type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"]

export type ResolvedModel = {
    model: LanguageModel
    provider: SupportedProvider
    modelId: SupportedChatModelId
}

const assertUnsupportedModel = (provider: never): never => {
    throw new Error(`Unsupported chat model provider: ${provider}`)
}

const resolveAnthropicModel = (modelId: AnthropicModelId): ResolvedModel => {
    return {
        model: anthropic(modelId),
        provider: "anthropic",
        modelId
    }
}

const resolveOpenAIModel = (modelId: OpenAIModelId): ResolvedModel => {
    return {
        model: openai(modelId),
        provider: "openai",
        modelId
    }
}

const resolveSupportedChatModel = (model: SupportedChatModel): ResolvedModel => {
    const provider = model.provider
    const modelId = model.id
    switch (provider) {
        case "anthropic":
            return resolveAnthropicModel(modelId as AnthropicModelId)
        case "openai":
            return resolveOpenAIModel(modelId as OpenAIModelId)
        default:
            return assertUnsupportedModel(provider)
    }
}

export const isSupportedChatModel = (modelId: string): modelId is SupportedChatModelId => {
    return findSupportedChatModelById(modelId) !== null
}

export const resolveChatModel = (modelId: string): ResolvedModel => {
    const model = findSupportedChatModelById(modelId)
    if (!model) {
        throw new Error(`Unsupported chat model: ${modelId}`)
    }
    return resolveSupportedChatModel(model)
}
