import "dotenv/config";
import express from "express";
import { textToImageDataUrl, textToImageAndSave, siliconFlowTextToImageUrl } from "./image.js";
const app = express();
app.use(express.json());
app.post("/api/hf/generate-image", async (req, res) => {
    const body = req.body;
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
    }
    catch (err) {
        const message = err?.message ?? "unknown error";
        return res.status(502).json({ ok: false, error: message });
    }
});
app.post("/api/hf/generate-image-save", async (req, res) => {
    const body = req.body;
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
    }
    catch (err) {
        const message = err?.message ?? "unknown error";
        return res.status(502).json({ ok: false, error: message });
    }
});
app.post("/api/sf/generate-image", async (req, res) => {
    const body = req.body;
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
    }
    catch (err) {
        const message = err?.message ?? "unknown error";
        return res.status(502).json({ ok: false, error: message });
    }
});
const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`Express server listening on http://localhost:${PORT}`);
});
