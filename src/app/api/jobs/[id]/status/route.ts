import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = id;

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
    });

    if (!job) {
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 });
    }

    // Retorna o estado atual e, se estiver concluído, as URLs dos ficheiros 3D
    return NextResponse.json({
      status: job.status,
      meshUrl: job.meshUrl,
      final3mfUrl: job.final3mfUrl,
      gcodeUrl: job.gcodeUrl,
    });

  } catch (error) {
    console.error("Erro ao consultar Job:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
