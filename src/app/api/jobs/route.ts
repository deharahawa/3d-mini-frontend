import { NextResponse } from "next/server";
import { db } from "@/db"; 
import { jobs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { fileKey, gender, body_style } = await req.json(); // A chave do ficheiro que acabou de ir para o R2

    // 1. Criar o registo na base de dados com estado inicial "pending"
    const [newJob] = await db.insert(jobs).values({
      originalImageUrl: fileKey,
      status: "pending",
    }).returning();

    // 2. Disparar a chamada para o servidor Python (Modal.com / RunPod)
    // O servidor Python deve responder imediatamente com um 200/202 e continuar o processamento em background.
    const modalEndpoint = process.env.MODAL_API_START_JOB!; 
    
    // Disparamos em background
    fetch(modalEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: newJob.id,
        image_key: fileKey,
        gender: gender || "boy",
        body_style: body_style || "casual"
      })
    }).then(async (res) => {
      if (!res.ok) {
        const errorBody = await res.text().catch(() => "Resposta sem corpo");
        console.error(`Modal retornou ${res.status}: ${errorBody}`);
        // Fallback: se o webhook não atualizou o status, fazemos aqui
        await db.update(jobs)
          .set({ status: "error", errorMessage: `Modal HTTP ${res.status}`, updatedAt: new Date() })
          .where(eq(jobs.id, newJob.id));
      }
    }).catch(async (err) => {
      console.error("Falha ao contactar a GPU:", err);
      await db.update(jobs)
        .set({ status: "error", errorMessage: `Falha de rede: ${err.message}`, updatedAt: new Date() })
        .where(eq(jobs.id, newJob.id));
    });

    // 3. Devolver o ID do job ao Frontend imediatamente
    return NextResponse.json({ jobId: newJob.id, status: newJob.status });

  } catch (error) {
    console.error("Erro ao criar Job:", error);
    return NextResponse.json({ error: "Falha ao iniciar processamento" }, { status: 500 });
  }
}
