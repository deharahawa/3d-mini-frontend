import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Configuração do Cliente S3 (Funciona para AWS, R2, DigitalOcean Spaces)
const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT, // Remova se for AWS S3 puro
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();
    
    // Geramos um nome único para evitar colisões
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `uploads/fotos/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    // Gera a URL válida por 5 minutos
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileKey: uniqueFilename,
      publicUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${uniqueFilename}`
    });

  } catch (error) {
    console.error("Erro ao gerar presigned URL:", error);
    return NextResponse.json({ error: "Falha na geração da URL" }, { status: 500 });
  }
}
