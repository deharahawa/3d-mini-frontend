/**
 * GET /api/status?jobId=xxx
 *
 * Consulta rápida e stateless ao Redis para obter o status de um job.
 * O frontend chama a cada 3 segundos via polling.
 *
 * Response time target: < 10ms (Redis in-memory).
 * Nunca excede o timeout de 10s do Vercel Hobby.
 *
 * Response:
 *   {
 *     jobId, status, progress?, downloadUrl?, error?,
 *     createdAt, completedAt?
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/redis";

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

    // UUID format validation (basic)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId)) {
      return NextResponse.json(
        { error: "invalid_job_id", message: "jobId must be a valid UUID." },
        { status: 400 }
      );
    }

    // ── 1. Consultar Redis (< 5ms) ──
    const job = await getJob(jobId);

    if (job) {
      return NextResponse.json({
        jobId,
        status: job.status,
        progress: job.progress ?? null,
        downloadUrl: job.status === "completed" ? `/api/download?jobId=${jobId}` : null,
        error: job.error ?? null,
        createdAt: job.createdAt,
        completedAt: job.completedAt ?? null,
      });
    }

    // ── 2. Fallback: Consultar Neon DB ──
    // Se Redis não tem o job (expirou ou miss), consulta o DB.
    // TODO: Integrar fallback para Neon DB via Drizzle ORM
    //
    // const dbJob = await db.select()
    //   .from(mini3d.jobs)
    //   .where(eq(mini3d.jobs.id, jobId))
    //   .limit(1);
    //
    // if (dbJob.length > 0) {
    //   return NextResponse.json({
    //     jobId,
    //     status: dbJob[0].status,
    //     downloadUrl: dbJob[0].status === "completed"
    //       ? `/api/download?jobId=${jobId}` : null,
    //     error: dbJob[0].error ?? null,
    //     createdAt: dbJob[0].createdAt,
    //     completedAt: dbJob[0].completedAt ?? null,
    //   });
    // }

    // ── 3. Não encontrado ──
    return NextResponse.json(
      { error: "job_not_found", message: `Job ${jobId} not found.` },
      { status: 404 }
    );
  } catch (error) {
    console.error("[status] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
