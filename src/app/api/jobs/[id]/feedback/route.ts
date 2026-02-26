import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log(`[FEEDBACK] Job ${id}:`, body);

    // TODO: Salvar no banco de dados Neondb com Drizzle

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao salvar feedback" },
      { status: 500 }
    );
  }
}
