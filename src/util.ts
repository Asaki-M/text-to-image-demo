import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export interface SaveImageOptions {
  base64: string;
  mimeType?: string;
  outputDir?: string; // default: outputs/image
  filename?: string; // without extension; default: timestamp
}

export async function toBase64(data: unknown): Promise<string> {
  if (typeof data === "string") {
    if (data.startsWith("data:")) {
      const idx = data.indexOf(",");
      return idx >= 0 ? data.slice(idx + 1) : "";
    }
    if (/^https?:\/\//i.test(data)) {
      const resp = await fetch(data);
      const buf = Buffer.from(await resp.arrayBuffer());
      return buf.toString("base64");
    }
    return data; // assume already base64
  }
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
    return (data as Buffer).toString("base64");
  }
  // ArrayBuffer
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("base64");
  }
  // ArrayBufferView (e.g., Uint8Array)
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return Buffer.from(view.buffer, view.byteOffset, view.byteLength).toString("base64");
  }
  // Blob (runtime check without DOM types)
  if (typeof (globalThis as any).Blob !== "undefined" && data instanceof (globalThis as any).Blob) {
    const ab = await (data as any).arrayBuffer();
    return Buffer.from(ab).toString("base64");
  }
  throw new Error("Unsupported image data type for base64 conversion");
}

export function getExtensionFromMime(mime?: string): string {
  switch (mime) {
    case "image/png": return "png";
    case "image/jpeg":
    case "image/jpg": return "jpg";
    case "image/webp": return "webp";
    default: return "png";
  }
}

export async function saveBase64Image({ base64, mimeType, outputDir = "outputs/image", filename }: SaveImageOptions): Promise<string> {
  const dir = resolve(outputDir);
  await mkdir(dir, { recursive: true });
  const ext = getExtensionFromMime(mimeType);
  const name = filename ? `${filename}.${ext}` : `${Date.now()}.${ext}`;
  const filePath = join(dir, name);
  await writeFile(filePath, Buffer.from(base64, "base64"));
  return filePath;
}