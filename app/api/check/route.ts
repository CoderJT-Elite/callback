import { NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { checkRateLimit } from "@/lib/ratelimit";
import { SSEEventData } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

const CHECK_DEADLINE_MS = 25000;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: NextRequest) {
  // 1. IP extraction & Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: `Rate limit reached. Please wait ${rateLimit.retryAfterSec || 60} seconds before running another check.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Parse body
  let text = "";
  let imageBuffer: Buffer | undefined;
  let mimeType = "image/png";

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await req.json();
      text = (json.text || "").trim();
      if (json.image) {
        // Base64 image
        const matches = json.image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], "base64");
        } else {
          imageBuffer = Buffer.from(json.image, "base64");
        }
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = ((formData.get("text") as string) || "").trim();
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        const arrayBuf = await file.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        mimeType = file.type || "image/png";
      }
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request payload format." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Validate limits
  if (text.length > 6000) {
    return new Response(
      JSON.stringify({
        error: "Message text is too long (maximum 6,000 characters). Please paste a single message or excerpt.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (imageBuffer && imageBuffer.length > 4 * 1024 * 1024) {
    return new Response(
      JSON.stringify({
        error: "Image exceeds 4 MB. Please downscale the image or paste the message text.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (imageBuffer && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    return new Response(
      JSON.stringify({ error: "Screenshots must be PNG, JPEG or WebP." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!text && !imageBuffer) {
    return new Response(
      JSON.stringify({ error: "Please enter a message text or upload a screenshot to check." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Create SSE response stream. The whole check is capped at 25 s; whatever finished by then
  // has already been streamed, and the client is told the rest was skipped.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const sendEvent = (eventData: SSEEventData) => {
        if (closed) return;
        const payload = `event: ${eventData.event}\ndata: ${JSON.stringify(eventData.data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<"timeout">(resolve => {
        timer = setTimeout(() => resolve("timeout"), CHECK_DEADLINE_MS);
      });

      try {
        const outcome = await Promise.race([
          runPipeline(text, { imageBuffer, mimeType, onEvent: sendEvent }).then(() => "done" as const),
          deadline,
        ]);
        if (outcome === "timeout") {
          sendEvent({
            event: "error",
            data: { message: "This check hit the 25-second limit. The steps above finished; the rest were skipped." },
          });
        }
      } catch {
        // Never send stack traces or internal messages to the client.
        sendEvent({ event: "error", data: { message: "The check failed unexpectedly. Please try again." } });
      } finally {
        clearTimeout(timer);
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
