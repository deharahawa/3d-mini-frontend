/**
 * POST /api/generate
 *
 * Dispara a execução do pipeline de geração de miniatura 3D.
 * O processamento é assíncrono — retorna 202 Accepted imediatamente.
 *
 * Request:  { jobId: "uuid-v4" }
 * Response: { jobId, status: "queued" } (202)
 *
 * Flow:
 *   1. Verifica sessão do usuário (Better-Auth)
 *   2. Verifica/debita créditos (Neon DB)
 *   3. Grava job no Redis (status: queued)
 *   4. Grava job no Neon DB
 *   5. Dispara pipeline no Modal (fire-and-forget)
 *   6. Retorna 202 Accepted
 */

import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/redis";

// ─── Modal REST API (for spawning functions) ────────────

const MODAL_TOKEN_ID = process.env.MODAL_TOKEN_ID!;
const MODAL_TOKEN_SECRET = process.env.MODAL_TOKEN_SECRET!;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;
const SUPABASE_URL = process.env.SUPABASE_URL!;

/**
 * Dispara run_pipeline.spawn() no Modal via REST API.
 *
 * O Modal expõe um endpoint REST para invocar funções
 * de forma assíncrona (spawn). Retorna call_id.
 */
async function spawnModalPipeline(
  jobId: string,
  photoUrl: string,
  webhookUrl: string
): Promise<string> {
  // Modal REST API: POST /api/v1/apps/{app_name}/functions/{function_name}/spawn
  // Ref: https://modal.com/docs/reference/modal.Function#spawn
  const res = await fetch(
    "https://api.modal.com/api/v1/functions/call",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MODAL_TOKEN_ID}:${MODAL_TOKEN_SECRET}`,
      },
      body: JSON.stringify({
        app_name: "mini3d-pipeline",
        function_name: "run_pipeline",
        args: [jobId, photoUrl, webhookUrl],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Modal spawn failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.call_id ?? "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = body as { jobId?: string };

    if (!jobId) {
      return NextResponse.json(
        { error: "missing_job_id", message: "jobId is required." },
        { status: 400 }
      );
    }

    // ── 1. Verificar sessão (Better-Auth) ──
    // TODO: Integrar Better-Auth session validation
    // const session = await auth.getSession(request);
    // if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const userId = "user_placeholder"; // Substituir por session.userId

    // ── 2. Verificar/debitar créditos (Neon DB) ──
    // TODO: Integrar verificação de créditos via Drizzle ORM
    //
    // const credits = await db.select()
    //   .from(mini3d.users)
    //   .where(eq(mini3d.users.id, userId));
    //
    // if (credits[0].balance < 1) {
    //   return NextResponse.json(
    //     { error: "insufficient_credits" },
    //     { status: 402 }
    //   );
    // }
    //
    // await db.update(mini3d.users)
    //   .set({ balance: sql`balance - 1` })
    //   .where(eq(mini3d.users.id, userId));

    // ── 3. Gravar job no Redis ──
    const photoKey = `input/${jobId}/photo.jpg`;
    await createJob(jobId, {
      userId,
      photoKey,
    });

    // ── 4. Gravar job no Neon DB ──
    // TODO: Integrar INSERT via Drizzle ORM
    //
    // await db.insert(mini3d.jobs).values({
    //   id: jobId,
    //   userId,
    //   status: "queued",
    //   photoUrl: photoKey,
    // });

    // ── 5. Disparar pipeline no Modal ──
    const photoUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/miniatures/${photoKey}`;
    const webhookUrl = new URL("/api/webhook/complete", request.url).toString();

    try {
      const callId = await spawnModalPipeline(jobId, photoUrl, webhookUrl);
      console.log(
        `[generate] Pipeline spawned — jobId: ${jobId}, callId: ${callId}`
      );
    } catch (spawnError) {
      console.error("[generate] Modal spawn failed:", spawnError);

      // Se o spawn falhar, atualizar Redis para FAILED
      // para que o polling do frontend saiba imediatamente
      const { updateJob } = await import("@/lib/redis");
      await updateJob(jobId, {
        status: "failed",
        error: "Failed to start processing pipeline. Please try again.",
      });

      return NextResponse.json(
        { error: "pipeline_error", message: "Failed to start processing." },
        { status: 502 }
      );
    }

    // ── 6. Retornar 202 Accepted ──
    return NextResponse.json(
      { jobId, status: "queued" },
      { status: 202 }
    );
  } catch (error) {
    console.error("[generate] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
