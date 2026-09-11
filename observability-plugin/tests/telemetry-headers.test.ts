//  Copyright (c) 2026 Cisco Systems, Inc. and its affiliates
//  SPDX-License-Identifier: Apache-2.0

import test from "node:test";
import assert from "node:assert/strict";

import { parseConfig } from "../src/config.ts";
import {
  buildOtlpExporterHeaders,
  resolveGatewayToken,
} from "../src/telemetry.ts";

test("resolveGatewayToken uses DefenseClaw precedence", () => {
  const config = parseConfig({
    apiToken: "config-token",
    headers: {
      "x-defenseclaw-token": "header-token",
    },
  });

  assert.equal(
    resolveGatewayToken(config, {
      DEFENSECLAW_GATEWAY_TOKEN: "canonical-token",
      OPENCLAW_GATEWAY_TOKEN: "legacy-token",
    }),
    "canonical-token"
  );

  assert.equal(
    resolveGatewayToken(config, {
      OPENCLAW_GATEWAY_TOKEN: "legacy-token",
    }),
    "legacy-token"
  );

  assert.equal(resolveGatewayToken(config, {}), "config-token");

  const noApiToken = parseConfig({
    headers: {
      "x-defenseclaw-token": "header-token",
    },
  });

  assert.equal(resolveGatewayToken(noApiToken, {}), "header-token");
});

test("buildOtlpExporterHeaders injects required DefenseClaw headers", () => {
  const config = parseConfig({
    headers: {
      Authorization: "Bearer dynatrace-token",
      "X-DefenseClaw-Client": "insightclaw-test-client",
      "x-defenseclaw-source": "insightclaw",
    },
  });

  const headers = buildOtlpExporterHeaders(
    config,
    "0.1.3",
    {
      DEFENSECLAW_GATEWAY_TOKEN: "gateway-token",
    }
  );

  assert.equal(headers.Authorization, "Bearer dynatrace-token");
  assert.equal(headers["x-defenseclaw-token"], "gateway-token");
  assert.equal(headers["x-defenseclaw-client"], "insightclaw-test-client");
  assert.equal(headers["x-defenseclaw-source"], "openclaw");
});

test("buildOtlpExporterHeaders defaults client header when missing", () => {
  const config = parseConfig({
    headers: {},
  });

  const headers = buildOtlpExporterHeaders(config, "0.1.3", {});

  assert.equal(headers["x-defenseclaw-client"], "insightclaw-otel/0.1.3");
  assert.equal(headers["x-defenseclaw-source"], "openclaw");
});
