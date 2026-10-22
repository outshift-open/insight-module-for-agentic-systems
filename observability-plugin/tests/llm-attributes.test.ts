import test from "node:test";
import assert from "node:assert/strict";
import {
  extractLlmRequestAttributes,
  extractLlmResponseAttributes,
  llmErrorType,
} from "../src/llm-attributes.ts";

test("request attributes are read from nested params or the event itself", () => {
  assert.deepEqual(extractLlmRequestAttributes({ params: { temperature: 0.2, maxTokens: 512 }, topP: 0.9 }), {
    "gen_ai.request.temperature": 0.2,
    "gen_ai.request.max_tokens": 512,
    "gen_ai.request.top_p": 0.9,
  });
  assert.deepEqual(extractLlmRequestAttributes({ model: "m" }), {});
  assert.deepEqual(extractLlmRequestAttributes(undefined), {});
});

test("response attributes carry id and finish reasons only when present", () => {
  assert.deepEqual(extractLlmResponseAttributes({ response: { id: "resp_1" }, stopReason: "end_turn" }), {
    "gen_ai.response.id": "resp_1",
    "gen_ai.response.finish_reasons": ["end_turn"],
  });
  assert.deepEqual(extractLlmResponseAttributes({}), {});
});

test("llm error type is low cardinality", () => {
  assert.equal(llmErrorType(new TypeError("x")), "TypeError");
  assert.equal(llmErrorType(new Error("rate limited at 12:03")), "llm_error");
  assert.equal(llmErrorType("boom"), "llm_error");
  assert.equal(llmErrorType({ code: "rate_limit" }), "rate_limit");
});
