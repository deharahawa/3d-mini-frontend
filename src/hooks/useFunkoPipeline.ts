import { useState } from "react";

export function useFunkoPipeline() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const startProcess = async (file: File, gender: "boy" | "girl", bodyStyle: string) => {
    try {
      setIsUploading(true);

      // 1. Pega o ticket (Presigned URL) do nosso Next.js
      const resPre = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const { uploadUrl, fileKey } = await resPre.json();

      // 2. Envia a foto direto para o R2 (Bypass Vercel, zero gargalo)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Avisa o banco de dados e acorda a GPU na Modal.com!
      const resJob = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, gender, body_style: bodyStyle })
      });
      const data = await resJob.json();

      // 4. Salva o Job ID no estado e no localStorage para a "Waiting Room" sobreviver a F5
      setJobId(data.jobId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('funko_job_id', data.jobId);
      }
      setIsUploading(false);

    } catch (error) {
      console.error("Erro no fluxo:", error);
      setIsUploading(false);
      alert("Falha ao iniciar o processo. Tente novamente.");
    }
  };

  return { startProcess, isUploading, jobId, setJobId };
}
