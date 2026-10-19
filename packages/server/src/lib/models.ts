import { anthropic } from "@ai-sdk/anthropic"
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google"
import { openai, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai"
import type { ProviderOptions } from "@ai-sdk/provider-utils"
import {
    findSupportedChatModelById,
    type SupportedChatModel,
    type SupportedChatModelId,
    type SupportedProvider
} from "@nicecode/shared"
import type { LanguageModel } from "ai"

type AnthropicModelId = Extract<SupportedChatModel, { provider: "anthropic" }>["id"]
type OpenAIModelId = Extract<SupportedChatModel, { provider: "openai" }>["id"]
type GoogleModelId = Extract<SupportedChatModel, { provider: "google" }>["id"]

export type ResolvedModel = {
    model: LanguageModel
    provider: SupportedProvider
    modelId: SupportedChatModelId
    providerOptions?: ProviderOptions
}

const GOOGLE_PROVIDER_OPTIONS: Partial<Record<GoogleModelId, ProviderOptions>> = {
    "gemini-2.5-flash": {
        google: {
            thinking: {
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_UNSPECIFIED",
                        threshold: "BLOCK_LOW_AND_ABOVE"
                    }
                ]
            } satisfies GoogleLanguageModelOptions
        }
    }
}

const ANTHROPIC_PROVIDER_OPTIONS: Partial<Record<AnthropicModelId, ProviderOptions>> = {
    "claude-opus-4-6": {
        anthropic: {
            thinking: {
                type: "enabled",
                budgetTokens: 100000
            }
        }
    },
    "claude-sonnet-4-6": {
        anthropic: {
            thinking: {
                type: "enabled",
                budgetTokens: 100000
            }
        }
    },
    "claude-haiku-4-5": {
        anthropic: {
            thinking: {
                type: "enabled",
                budgetTokens: 100000
            }
        }
    }
}

const OPENAI_PROVIDER_OPTIONS: Partial<Record<OpenAIModelId, ProviderOptions>> = {
    "gpt-5.4-mini": {
        openai: {
            thinking: {
                parallelToolCalls: false,
                store: false
            } satisfies OpenAILanguageModelResponsesOptions
        }
    }
}

const assertUnsupportedModel = (provider: never): never => {
    throw new Error(`Unsupported chat model provider: ${provider}`)
}

const resolveAnthropicModel = (modelId: AnthropicModelId): ResolvedModel => {
    return {
        model: anthropic(modelId),
        provider: "anthropic",
        modelId,
        providerOptions: ANTHROPIC_PROVIDER_OPTIONS[modelId]
    }
}

const resolveOpenAIModel = (modelId: OpenAIModelId): ResolvedModel => {
    return {
        model: openai(modelId),
        provider: "openai",
        modelId,
        providerOptions: OPENAI_PROVIDER_OPTIONS[modelId]
    }
}

const resolveGoogleModel = (modelId: GoogleModelId): ResolvedModel => {
    return {
        model: google(modelId),
        provider: "google",
        modelId,
        providerOptions: GOOGLE_PROVIDER_OPTIONS[modelId]
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
        case "google":
            return resolveGoogleModel(modelId as GoogleModelId)
        default:
            return assertUnsupportedModel(provider)
    }
}

export const isSupportedChatModel = (modelId: string): modelId is SupportedChatModelId => {
    return findSupportedChatModelById(modelId) !== undefined
}

export const resolveChatModel = (modelId: string): ResolvedModel => {
    const model = findSupportedChatModelById(modelId)
    if (!model) {
        throw new Error(`Unsupported chat model: ${modelId}`)
    }
    return resolveSupportedChatModel(model)
}
