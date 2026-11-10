import { test } from "node:test";
import assert from "node:assert/strict";
import {
  geminiAnalysis,
  parseGeminiAnalysis,
  validateChartImage,
} from "../lib/server/gemini";
test("structured model output cannot replace calculated metrics or claim unsupported actions", () => {
  const valid = parseGeminiAnalysis({
    candidates: [
      {
        content: {
          parts: [
            {
              text: JSON.stringify({
                analysis: "Review your position size.",
                action: "REVIEW",
                metrics: { stop: 0 },
              }),
            },
          ],
        },
      },
    ],
  });
  assert.deepEqual(valid, {
    analysis: "Review your position size.",
    action: "REVIEW",
    chartObservation: null,
  });
  assert.throws(() =>
    parseGeminiAnalysis({
      candidates: [
        {
          content: {
            parts: [{ text: '{"analysis":"Execute now","action":"BUY"}' }],
          },
        },
      ],
    }),
  );
  assert.throws(() => validateChartImage("data:image/svg+xml;base64,PHN2Zz4="));
});
test("Gemini client submits inline image and returns real provider metadata only", async () => {
  let sent: Record<string, any> = {};
  const fetcher = (async (_url, options) => {
    sent = JSON.parse(String(options?.body));
    return new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                { text: '{"analysis":"Observed range only.","action":"HOLD"}' },
              ],
            },
          },
        ],
      }),
      { headers: { "x-request-id": "provider-generated-id" } },
    );
  }) as typeof fetch;
  const result = await geminiAnalysis(
    {
      name: "Boba",
      role: "chart scout",
      prompt: "Inspect",
      context: { price: 2000 },
      image: "test-base64",
    },
    fetcher,
  );
  assert.equal(sent.contents[0].parts[1].inlineData.data, "test-base64");
  assert.equal(result.providerRequestId, "provider-generated-id");
  assert.equal(result.action, "HOLD");
});
