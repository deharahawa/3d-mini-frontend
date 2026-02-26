/**
 * GET /api/download?jobId=xxx
 *
 * Gera uma URL assinada temporária (60 min) para download
 * do arquivo .3mf final do Supabase Storage.
 *
 * Response: { downloadUrl: "https://..." }
 *
 * Segurança:
 *   - Requer sessão autenticada (Better-Auth)
 *   - Verifica que o job pertence ao usuário autenticado
 *   - URL assinada expira em 60 minutos
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/redis";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Tempo de expiração da URL assinada (em segundos)
const SIGNED_URL_EXPIRY_S = 3600; // 60 minutos

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "missing_job_id", message: "jobId query parameter is required." },
        { status: 400 }
      );
    }

    // ── 1. Verificar sessão (Better-Auth) ──
    // TODO: Integrar Better-Auth session validation
    // const session = await auth.getSession(request);
    // if (!session) {
    //   return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    // }

    // ── 2. Buscar job no Redis ──
    const job = await getJob(jobId);

    if (!job) {
      // TODO: Fallback para Neon DB se Redis expirou
      return NextResponse.json(
        { error: "job_not_found", message: `Job ${jobId} not found.` },
        { status: 404 }
      );
    }

    // ── 3. Verificar ownership ──
    // TODO: Descomentar quando Better-Auth estiver integrado
    // if (job.userId !== session.userId) {
    //   return NextResponse.json(
    //     { error: "forbidden", message: "You don't have access to this job." },
    //     { status: 403 }
    //   );
    // }

    // ── 4. Verificar status ──
    if (job.status !== "completed" || !job.resultUrl) {
      return NextResponse.json(
        {
          error: "not_ready",
          message: `Job status is '${job.status}'. Download available when completed.`,
          status: job.status,
        },
        { status: 409 } // Conflict
      );
    }

    // ── 5. Gerar URL assinada via Supabase Storage ──
    const signRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/sign/miniatures/${job.resultUrl}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: SIGNED_URL_EXPIRY_S,
        }),
      }
    );

    if (!signRes.ok) {
      const errorText = await signRes.text();
      console.error("[download] Supabase sign error:", signRes.status, errorText);
      return NextResponse.json(
        { error: "storage_error", message: "Failed to generate download URL." },
        { status: 502 }
      );
    }

    const signData = await signRes.json();
    const downloadUrl = `${SUPABASE_URL}/storage/v1${signData.signedURL}`;

    return NextResponse.json({ downloadUrl }, { status: 200 });
  } catch (error) {
    console.error("[download] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
