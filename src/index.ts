import "dotenv/config";
import express, { Request, Response } from "express";
import { textToImageDataUrl, textToImageAndSave, siliconFlowTextToImageUrl } from "./image.js";

interface GenerateImageRequestBody {
	prompt: string;
	model?: string;
	extraParams?: Record<string, any>;
	token?: string; // optional HF token override
}

interface GenerateImageResponseBody {
	ok: boolean;
	base64?: string;
	filePath?: string;
	error?: string;
}

interface SiliconFlowGenerateRequestBody {
	prompt: string;
	model?: string;
	image_size?: string;
	batch_size?: number;
	num_inference_steps?: number;
	guidance_scale?: number;
	extraParams?: Record<string, any>;
	token?: string; // optional SiliconFlow token override
}

interface SiliconFlowGenerateResponseBody {
	ok: boolean;
	url?: string;
	error?: string;
}

const app = express();
app.use(express.json());

app.post<{}, GenerateImageResponseBody, GenerateImageRequestBody>(
	"/api/hf/generate-image",
	async (
		req: Request<{}, GenerateImageResponseBody, GenerateImageRequestBody>,
		res: Response<GenerateImageResponseBody>
	) => {
		const body = req.body as GenerateImageRequestBody;
		if (typeof body?.prompt !== "string" || body.prompt.trim().length === 0) {
			return res.status(400).json({ ok: false, error: "prompt is required" });
		}
		if (!body.token && !process.env.HF_TOKEN) {
			return res.status(500).json({ ok: false, error: "HF_TOKEN is missing" });
		}

		try {
			const { base64 } = await textToImageDataUrl({
				prompt: body.prompt,
				model: body.model,
				extraParams: body.extraParams,
				token: body.token,
			});
			return res.status(200).json({ ok: true, base64 });
		} catch (err: any) {
			const message = err?.message ?? "unknown error";
			return res.status(502).json({ ok: false, error: message });
		}
	}
);

app.post<{}, GenerateImageResponseBody, GenerateImageRequestBody>(
	"/api/hf/generate-image-save",
	async (
		req: Request<{}, GenerateImageResponseBody, GenerateImageRequestBody>,
		res: Response<GenerateImageResponseBody>
	) => {
		const body = req.body as GenerateImageRequestBody;
		if (typeof body?.prompt !== "string" || body.prompt.trim().length === 0) {
			return res.status(400).json({ ok: false, error: "prompt is required" });
		}
		if (!body.token && !process.env.HF_TOKEN) {
			return res.status(500).json({ ok: false, error: "HF_TOKEN is missing" });
		}

		try {
			const { base64, filePath } = await textToImageAndSave({
				prompt: body.prompt,
				model: body.model,
				extraParams: body.extraParams,
				outputDir: "outputs/image",
				token: body.token,
			});
			return res.status(200).json({ ok: true, base64, filePath });
		} catch (err: any) {
			const message = err?.message ?? "unknown error";
			return res.status(502).json({ ok: false, error: message });
		}
	}
);

app.post<{}, SiliconFlowGenerateResponseBody, SiliconFlowGenerateRequestBody>(
	"/api/sf/generate-image",
	async (
		req: Request<{}, SiliconFlowGenerateResponseBody, SiliconFlowGenerateRequestBody>,
		res: Response<SiliconFlowGenerateResponseBody>
	) => {
		const body = req.body as SiliconFlowGenerateRequestBody;
		if (typeof body?.prompt !== "string" || body.prompt.trim().length === 0) {
			return res.status(400).json({ ok: false, error: "prompt is required" });
		}
		if (!body.token && !process.env.SF_TOKEN) {
			return res.status(500).json({ ok: false, error: "SF_TOKEN is missing" });
		}

		try {
			const { url } = await siliconFlowTextToImageUrl({
				prompt: body.prompt,
				model: body.model,
				image_size: body.image_size,
				batch_size: body.batch_size,
				num_inference_steps: body.num_inference_steps,
				guidance_scale: body.guidance_scale,
				extraParams: body.extraParams,
				token: body.token,
			});
			return res.status(200).json({ ok: true, url });
		} catch (err: any) {
			const message = err?.message ?? "unknown error";
			return res.status(502).json({ ok: false, error: message });
		}
	}
);

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
	console.log(`Express server listening on http://localhost:${PORT}`);
});
