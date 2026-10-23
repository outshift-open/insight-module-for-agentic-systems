//  Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
//  SPDX-License-Identifier: Apache-2.0

/**
 * Extraction of OTel GenAI request/response attributes from OpenClaw LLM hook events.
 *
 * OpenClaw does not guarantee which of these fields a provider exposes, so every
 * lookup is defensive and attributes are only returned when a value is present.
 */

type AttrValue = string | number | string[];

function pick(sources: any[], keys: string[]): unknown {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/** gen_ai.request.* attributes from an llm_input event. */
export function extractLlmRequestAttributes(event: any): Record<string, AttrValue> {
  const sources = [event?.params, event?.options, event?.request, event?.modelParams, event];
  const attrs: Record<string, AttrValue> = {};

  const temperature = asNumber(pick(sources, ["temperature"]));
  if (temperature !== undefined) attrs["gen_ai.request.temperature"] = temperature;

  const topP = asNumber(pick(sources, ["top_p", "topP"]));
  if (topP !== undefined) attrs["gen_ai.request.top_p"] = topP;

  const maxTokens = asNumber(pick(sources, ["max_tokens", "maxTokens", "max_output_tokens", "maxOutputTokens"]));
  if (maxTokens !== undefined) attrs["gen_ai.request.max_tokens"] = maxTokens;

  return attrs;
}

/** gen_ai.response.* attributes from an llm_output event. */
export function extractLlmResponseAttributes(event: any): Record<string, AttrValue> {
  const sources = [event, event?.response, event?.message, event?.output];
  const attrs: Record<string, AttrValue> = {};

  const responseId = pick(sources, ["responseId", "response_id", "id"]);
  if (typeof responseId === "string") attrs["gen_ai.response.id"] = responseId;

  const finishReason = pick(sources, ["finish_reason", "stop_reason", "finishReason", "stopReason"]);
  if (typeof finishReason === "string") attrs["gen_ai.response.finish_reasons"] = [finishReason];

  return attrs;
}

/** Low-cardinality error.type value for a failed LLM call. */
export function llmErrorType(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as any;
    if (typeof e.name === "string" && e.name && e.name !== "Error") return e.name;
    if (typeof e.code === "string" && e.code) return e.code;
  }
  return "llm_error";
}
