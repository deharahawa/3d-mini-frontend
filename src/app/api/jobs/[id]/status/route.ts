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

    // Se o job já estiver concluído ou com erro firme na nossa DB, nem pergunta no Modal
    if (job.status === "completed" || job.status === "error") {
      return NextResponse.json({
        status: job.status,
        meshUrl: job.meshUrl,
        final3mfUrl: job.final3mfUrl,
        gcodeUrl: job.gcodeUrl,
      });
    }

    // Caso contrário, vai perguntar ao Modal o status real
    const modalCheckEndpoint = process.env.MODAL_API_CHECK_STATUS!;
    
    if (modalCheckEndpoint) {
      try {
        const modalRes = await fetch(`${modalCheckEndpoint}?job_id=${jobId}`);
        if (modalRes.ok) {
          const modalData = await modalRes.json();
          const modalStatus = modalData.status;

          // Se tiver havido progresso ou acabou, atualiza o DB e retorna o novo
          if (modalStatus && modalStatus !== "not_found") {
            // Mapear os status do Modal para os do nosso DB
            let mappedStatus = modalStatus;
            if (modalStatus === "failed") mappedStatus = "error";
            if (modalStatus === "processing") mappedStatus = "pending";

            if (mappedStatus !== job.status) {
              const updated = await db.update(jobs).set({
                status: mappedStatus,
                meshUrl: modalData.model_url || job.meshUrl,
                errorMessage: modalData.error || job.errorMessage,
                updatedAt: new Date()
              }).where(eq(jobs.id, jobId)).returning();

              return NextResponse.json({
                status: updated[0].status,
                meshUrl: updated[0].meshUrl,
                final3mfUrl: updated[0].final3mfUrl,
                gcodeUrl: updated[0].gcodeUrl,
              });
            }
          }
        }
      } catch (e) {
        console.error("Erro ao sondar o Modal:", e);
      }
    }

    // Se falhar de contactar o Modal ou nada mudou, retorna o que temos
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
