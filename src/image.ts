import "dotenv/config";
import { InferenceClient } from "@huggingface/inference";
import { toBase64, saveBase64Image } from "./util.js";

export interface TextToImageOptions {
  model?: string;
  prompt: string;
  extraParams?: Record<string, any>;
}

const client = new InferenceClient(process.env.HF_TOKEN);

export async function textToImageDataUrl(options: TextToImageOptions): Promise<{base64: string, mimeType: string}> {
  const image: any = await client.textToImage({
    provider: "auto",
    model: options.model ?? "Qwen/Qwen-Image",
    inputs: options.prompt,
    parameters: { num_inference_steps: 5, ...options.extraParams },
  });
  const base64 = await toBase64(image);
  const mime: string = typeof image?.type === "string" && image.type ? image.type : "image/png";
  return { base64:`data:${mime};base64,${base64}`, mimeType: mime };
}


export async function textToImageAndSave(options: TextToImageOptions & { outputDir?: string; filename?: string }): Promise<{ filePath: string; base64: string; mimeType: string }> {
  const image: any = await client.textToImage({
    provider: "auto",
    model: options.model ?? "Qwen/Qwen-Image",
    inputs: options.prompt,
    parameters: { num_inference_steps: 5, ...options.extraParams },
  });
  const base64 = await toBase64(image);
  const mime: string = typeof image?.type === "string" && image.type ? image.type : "image/png";
  const filePath = await saveBase64Image({ base64, mimeType: mime, outputDir: options.outputDir ?? "outputs/image", filename: options.filename });
  return { filePath, base64, mimeType: mime };
}

export interface SiliconFlowImageOptions {
  model?: string;
  prompt: string;
  image_size?: string;
  batch_size?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  extraParams?: Record<string, any>;
}

export interface SiliconFlowImageResult {
  url: string;
}

export async function siliconFlowTextToImageUrl(options: SiliconFlowImageOptions): Promise<SiliconFlowImageResult> {
  const sfToken = process.env.SF_TOKEN;
  if (!sfToken) {
    throw new Error("SF_TOKEN is missing");
  }

  const body = {
    model: options.model ?? "Kwai-Kolors/Kolors",
    prompt: options.prompt,
    image_size: options.image_size ?? "1024x1024",
    batch_size: options.batch_size ?? 1,
    num_inference_steps: options.num_inference_steps ?? 20,
    guidance_scale: options.guidance_scale ?? 7.5,
    ...(options.extraParams ?? {})
  };

  const resp = await fetch("https://api.siliconflow.cn/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sfToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`SiliconFlow request failed: ${resp.status} ${resp.statusText} ${errText}`.trim());
  }

  const json: any = await resp.json();
  const candidates: string[] = [
    ...(Array.isArray(json?.images) ? json.images.map((x: any) => x?.url).filter(Boolean) : []),
    ...(Array.isArray(json?.data) ? json.data.map((x: any) => x?.url).filter(Boolean) : []),
  ];
  const imageUrl = candidates[0];
  if (!imageUrl) {
    throw new Error("No image URL returned from SiliconFlow");
  }

  return { url: imageUrl };
}