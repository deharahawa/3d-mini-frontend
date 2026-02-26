import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    // Segurança básica: garantir que quem chama isto é o nosso servidor Python
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { job_id, status, mesh_url, final_3mf_url, gcode_url, error_message } = body;

    // Atualiza a base de dados com as novidades vindas da GPU
    await db.update(jobs)
      .set({
        status: status,
        meshUrl: mesh_url,
        final3mfUrl: final_3mf_url,
        gcodeUrl: gcode_url,
        errorMessage: error_message,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job_id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro no Webhook:", error);
    return NextResponse.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
