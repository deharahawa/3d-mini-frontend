/**
 * POST /api/webhook/complete
 *
 * Endpoint chamado pelo Modal Worker ao final (ou falha) do pipeline.
 * Protegido por HMAC-SHA256 para evitar chamadas fraudulentas.
 *
 * Request (do Modal):
 *   {
 *     jobId: "uuid",
 *     status: "completed" | "failed",
 *     resultUrl?: "output/{jobId}/miniature.3mf",
 *     progress?: "generating mesh...",
 *     error?: "GPU out of memory",
 *     duration_s?: 45.2
 *   }
 *   Header: X-Webhook-Signature: sha256=abc123...
 *
 * Response: { received: true } (200)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/hmac";
import { updateJob } from "@/lib/redis";
import type { JobStatus } from "@/lib/redis";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

// Statuses permitidos vindos do webhook
const VALID_STATUSES = new Set<JobStatus>([
  "processing",
  "completed",
  "failed",
]);

interface WebhookPayload {
  jobId: string;
  status: JobStatus;
  resultUrl?: string;
  progress?: string;
  error?: string;
  duration_s?: number;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Ler body raw (necessário para verificação HMAC) ──
    const rawBody = await request.text();

    // ── 2. Validar HMAC signature ──
    const signature = request.headers.get("X-Webhook-Signature") ?? "";

    const isValid = await verifyWebhookSignature(
      signature,
      WEBHOOK_SECRET,
      rawBody
    );

    if (!isValid) {
      console.warn("[webhook] Invalid HMAC signature — rejecting request.");
      return NextResponse.json(
        { error: "invalid_signature" },
        { status: 401 }
      );
    }

    // ── 3. Parse payload ──
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      return NextResponse.json(
        { error: "invalid_json" },
        { status: 400 }
      );
    }

    const { jobId, status, resultUrl, progress, error, duration_s } = payload;

    if (!jobId || !status) {
      return NextResponse.json(
        { error: "missing_fields", message: "jobId and status are required." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "invalid_status", message: `Status '${status}' not valid.` },
        { status: 400 }
      );
    }

    // ── 4. Atualizar Redis ──
    try {
      await updateJob(jobId, {
        status,
        ...(resultUrl && { resultUrl }),
        ...(progress && { progress }),
        ...(error && { error }),
        ...(duration_s !== undefined && { duration_s }),
        ...(status === "completed" || status === "failed"
          ? { completedAt: new Date().toISOString() }
          : {}),
      });
    } catch (redisError) {
      // Se Redis falha, logar mas não rejeitar o webhook
      // O frontend fará fallback para polling do DB
      console.error("[webhook] Redis update failed:", redisError);
    }

    // ── 5. Atualizar Neon DB ──
    // TODO: Integrar UPDATE via Drizzle ORM
    //
    // await db.update(mini3d.jobs)
    //   .set({
    //     status,
    //     resultUrl: resultUrl ?? null,
    //     error: error ?? null,
    //     duration_s: duration_s ?? null,
    //     completedAt: (status === "completed" || status === "failed")
    //       ? new Date() : undefined,
    //     updatedAt: new Date(),
    //   })
    //   .where(eq(mini3d.jobs.id, jobId));

    // ── 6. Se falhou: reembolsar crédito ──
    if (status === "failed") {
      console.warn(`[webhook] Job ${jobId} FAILED: ${error ?? "unknown"}`);

      // TODO: Reembolsar crédito ao usuário
      //
      // await db.update(mini3d.users)
      //   .set({ balance: sql`balance + 1` })
      //   .where(eq(mini3d.users.id, job.userId));
    }

    console.log(
      `[webhook] Job ${jobId} → ${status}` +
      (duration_s ? ` (${duration_s}s)` : "") +
      (error ? ` — error: ${error}` : "")
    );

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[webhook] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_error" },
      { status: 500 }
    );
  }
}
