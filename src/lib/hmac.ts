export async function verifyWebhookSignature(
  signature: string,
  secret: string,
  body: string
): Promise<boolean> {
  if (!signature || !secret || !body) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigHex = signature.startsWith("sha256=")
      ? signature.slice(7)
      : signature;

    const match = sigHex.match(/.{1,2}/g);
    if (!match) return false;

    const sigBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));

    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(body)
    );
  } catch (err) {
    console.error("HMAC verification failed:", err);
    return false;
  }
}
