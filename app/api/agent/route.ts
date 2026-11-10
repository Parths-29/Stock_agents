import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { analyze, assets, pets, type AnalysisContext } from "@/lib/market";
import { frames, quoteFresh, type Frame } from "@/lib/market-data";
import { marketFeed } from "@/lib/server/market-feed";
import { ServiceError } from "@/lib/server/store";
import { geminiAnalysis, validateChartImage } from "@/lib/server/gemini";
import {
  assertOrigin,
  session,
  body as readBody,
  errorResponse,
  json,
} from "@/lib/server/http";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  try {
    assertOrigin(req);
    const { store, owner } = session(req, "agent", 12),
      input = await readBody(req, 750000),
      pet = pets.find((p) => p.id === input.agentId),
      asset = assets.find((a) => a.symbol === input.ticker);
    if (
      !pet ||
      !asset ||
      typeof input.userPrompt !== "string" ||
      input.userPrompt.length > 2000 ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      input.amount > 1e9 ||
      (input.marketMode !== undefined &&
        !["live", "sample"].includes(input.marketMode)) ||
      (input.frame !== undefined && !frames.includes(input.frame))
    )
      throw new ServiceError("Invalid analysis input.");
    const image = validateChartImage(input.chartImage);
    let context: AnalysisContext | undefined;
    const mode = input.marketMode || "sample",
      frame = (input.frame || "24H") as Frame;
    if (mode === "live" && asset.kind === "CRYPTO") {
      const [quote, chart] = await Promise.all([
        marketFeed().quote(asset.symbol),
        marketFeed().chart(asset.symbol, frame),
      ]);
      if (!quoteFresh(quote) || chart.status !== "live")
        throw new ServiceError(
          "Fresh market context is unavailable. Retry or explicitly choose sample mode.",
          503,
        );
      context = {
        price: quote.price!,
        change: quote.change!,
        points: chart.candles.flatMap((c) => [c.low, c.high]),
        source: quote.source,
        asOf: quote.asOf,
      };
    }
    const result = analyze(pet.id, asset.symbol, input.amount, context);
    const telemetry = {
      applicationRequestId: randomUUID(),
      provider: "rules",
      model: null as string | null,
      providerRequestId: null as string | null,
      attestation: "not-verified",
      imageSubmitted: !!image,
      imageAnalyzed: false,
      marketSource: context?.source || "sample",
      marketAsOf: context?.asOf || null,
    };
    let output: {
      analysis: string;
      action: string;
      source: string;
      notice?: string;
      chartObservation?: string | null;
    } = { ...result };
    if (process.env.GEMINI_API_KEY) {
      try {
        const generated = await geminiAnalysis({
          name: pet.name,
          role: pet.role,
          prompt: input.userPrompt,
          image,
          context: {
            ticker: asset.symbol,
            frame,
            market: context
              ? { source: context.source, asOf: context.asOf }
              : "sample fixtures",
            calculations: result,
            chartImageFromBrowser: !!image,
          },
        });
        output = {
          ...result,
          analysis: generated.analysis,
          action: generated.action,
          chartObservation: generated.chartObservation,
          source: "gemini",
        };
        telemetry.provider = "gemini";
        telemetry.model = generated.model;
        telemetry.providerRequestId = generated.providerRequestId;
        telemetry.imageAnalyzed = !!image;
      } catch {
        output.notice =
          "Gemini unavailable or returned invalid output. Showing deterministic calculations; image was not analyzed.";
      }
    } else if (image)
      output.notice =
        "Chart captured. Set GEMINI_API_KEY to enable vision; currently showing numerical range analysis.";
    store.recordAnalysis(owner, pet.id);
    return json({
      ...output,
      metrics: result.metrics,
      petStates: store.snapshot(owner).petStates,
      telemetry,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
