/**
 * POST /api/upload/presign
 *
 * Gera uma URL assinada para o usuário fazer upload direto
 * ao Supabase Storage, sem tráfego pelo servidor Vercel.
 *
 * Request:  { filename: "photo.jpg", contentType: "image/jpeg" }
 * Response: { jobId, uploadUrl, photoKey }
 */

import { NextRequest, NextResponse } from "next/server";

// Whitelist de content types aceitos
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILENAME_LENGTH = 255;

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse body ──
    const body = await request.json();
    const { filename, contentType } = body as {
      filename?: string;
      contentType?: string;
    };

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "missing_fields", message: "filename and contentType are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        {
          error: "invalid_content_type",
          message: `Content type '${contentType}' not allowed. Accepted: ${[...ALLOWED_TYPES].join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (filename.length > MAX_FILENAME_LENGTH) {
      return NextResponse.json(
        { error: "filename_too_long", message: `Filename exceeds ${MAX_FILENAME_LENGTH} chars.` },
        { status: 400 }
      );
    }

    // ── 2. Gerar jobId ──
    const jobId = crypto.randomUUID();

    // ── 3. Gerar pre-signed URL via Supabase Storage ──
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

    const photoKey = `input/${jobId}/photo${_getExtension(filename)}`;

    // Supabase Storage: criar signed upload URL via REST API
    const signRes = await fetch(
      `${supabaseUrl}/storage/v1/object/upload/sign/miniatures/${photoKey}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!signRes.ok) {
      const errorText = await signRes.text();
      console.error("[presign] Supabase error:", signRes.status, errorText);
      return NextResponse.json(
        { error: "storage_error", message: "Failed to generate upload URL." },
        { status: 502 }
      );
    }

    const signData = await signRes.json();
    const uploadUrl = `${supabaseUrl}/storage/v1${signData.url}`;

    // ── 4. Retornar ──
    return NextResponse.json(
      { jobId, uploadUrl, photoKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("[presign] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

/**
 * Extrai a extensão do filename, ou ".jpg" como default.
 */
function _getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return ".jpg";
  return filename.slice(dot).toLowerCase();
}
