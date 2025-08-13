[English](#text-to-image-typescript--express) | [中文](#zh)

## Text-to-Image (TypeScript + Express)

A minimal Node.js TypeScript server that exposes text-to-image generation via Hugging Face Inference and Siliconflow and returns the image as base64. Includes utilities to return a Data URL for preview and to save images to `outputs/image`.

> Notes:
> - For Hugging Face usage, select a model that supports Inference Providers from the [Hugging Face Models](https://huggingface.co/models) catalog and configure your token.
> - For Siliconflow usage, sign up and create a token at [https://siliconflow.cn/](https://siliconflow.cn/). Siliconflow currently exposes the single model **Kwai-Kolors/Kolors** for this API; for additional parameters, see the [API docs](https://docs.siliconflow.cn/api-reference/images/images-generations).

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- A Hugging Face access token with inference permissions

### Setup
1. Clone and enter the project directory.
2. Install dependencies:
```bash
pnpm install
```
3. Create a `.env` and set your token:
```bash
# .env
HF_TOKEN=hf_********************************
PORT=3000
```

### Build and Run
```bash
pnpm build
pnpm start
# Server: http://localhost:3000
```

For convenience:
```bash
pnpm dev  # build then start
```

### API

#### POST /api/echo
- Request body:
```json
{
  "message": "hello"
}
```
- Response body:
```json
{
  "ok": true,
  "received": "hello"
}
```

#### POST /api/hf/generate-image
- Description: Generates an image via Hugging Face Inference and returns a Data URL string in the `base64` field.
- Request body:
```json
{
  "prompt": "Astronaut riding a horse",
  "model": "Qwen/Qwen-Image",
  "extraParams": { "num_inference_steps": 8 }
}
```
- Response body (success):
```json
{
  "ok": true,
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```
- Example:
```bash
curl -s http://localhost:3000/api/hf/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Qwen/Qwen-Image"
  }' | jq .
```

#### POST /api/hf/generate-image-save
- Description: Generates an image and saves it to disk, returning pure base64 (no prefix) and the file path.
- Request body: same as `/api/hf/generate-image`.
- Response body (success):
```json
{
  "ok": true,
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "filePath": "outputs/image/1699999999999.png"
}
```
- Example:
```bash
curl -s http://localhost:3000/api/hf/generate-image-save \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Qwen/Qwen-Image"
  }' | jq .
```

#### POST /api/sf/generate-image
- Description: Generates an image via SiliconFlow Images API and returns the direct image URL.
- Request body:
```json
{
  "prompt": "Astronaut riding a horse",
  "model": "Kwai-Kolors/Kolors",
  "image_size": "1024x1024",
  "batch_size": 1,
  "num_inference_steps": 20,
  "guidance_scale": 7.5
}
```
- Response body (success):
```json
{
  "ok": true,
  "url": "https://sc-maas.oss-cn-shanghai.aliyuncs.com/outputs%2F...jpeg?..."
}
```
- Example:
```bash
curl -s http://localhost:3000/api/sf/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Kwai-Kolors/Kolors",
    "image_size": "1024x1024",
    "num_inference_steps": 20,
    "guidance_scale": 7.5
  }' | jq .
```

### Environment Variables
- `HF_TOKEN` (required): Hugging Face access token for inference.
- `PORT` (optional): Server port. Defaults to `3000`.

### Project Structure
- `src/index.ts`: Express server and REST endpoints.
- `src/image.ts`: Image generation helpers (Hugging Face Inference), base64/Data URL helpers, save-to-disk helpers.
- `outputs/image`: Default directory for saving generated images.

### Image Helpers (server-side usage)
You can import and use the utilities directly in Node.js code.

```ts
// src usage example
import { textToImage, textToImageDataUrl, textToImageAndSave } from "./src/image.js";

// 1) Get pure base64 (no prefix)
const base64 = await textToImage({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
});
// For preview: const dataUrl = `data:image/png;base64,${base64}`;

// 2) Get a ready-to-use Data URL and MIME type
const { base64: dataUrl, mimeType } = await textToImageDataUrl({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
});
// dataUrl is like: "data:image/png;base64,...."

// 3) Generate and save to outputs/image
const { filePath, base64: imgBase64, mimeType: savedMime } = await textToImageAndSave({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
  outputDir: "outputs/image",      // optional, defaults to outputs/image
  filename: "my-image"              // optional, extension inferred from MIME
});
console.log("Saved:", filePath);
```

All helpers accept optional `extraParams` to forward advanced parameters to the Inference API:
```ts
await textToImage({
  prompt: "A scenic mountain at sunrise",
  model: "Qwen/Qwen-Image",
  extraParams: { num_inference_steps: 8 }
});
```

### Notes & Troubleshooting
- If you see `HF_TOKEN is missing`, ensure you have a valid token in `.env` and that the process environment is loaded (the code uses `dotenv/config`).
- If the image does not preview in the browser, ensure you are using a full Data URL, e.g. `data:image/png;base64,<base64>`.
- Some models may queue or rate-limit; consider different models or retry strategies.

### License
MIT

<a id="zh"></a>

## 文档（中文）

一个最小可用的 Node.js + TypeScript 服务，使用 Hugging Face Inference 和 Siliconflow 进行文本生成图片，并以 base64 返回。内置辅助方法可返回可直接预览的 Data URL，或将图片保存到 `outputs/image` 目录。

> 说明：
> 使用 HuggingFace 的话需要自行到 [huggingface models](https://huggingface.co/models) 里面自行筛选有 Inference Providers 支持的模型，并且配置你的 Token
> 使用 Siliconflow 的话需要注册账号生成 Token 来进行使用 [https://siliconflow.cn/](https://siliconflow.cn/)，Siliconflow 只有**Kwai-Kolors/Kolors**一个模型，需要配置额外参数请查阅[文档](https://docs.siliconflow.cn/api-reference/images/images-generations)

### 前置条件
- Node.js 18+
- pnpm（推荐）
- 具有推理（Inference）权限的 Hugging Face 访问令牌

### 安装与配置
1. 进入项目目录并安装依赖：
```bash
pnpm install
```
2. 新建 `.env` 文件并设置环境变量：
```bash
# .env
HF_TOKEN=hf_********************************
PORT=3000
```

### 构建与运行
```bash
pnpm build
pnpm start
# 服务地址: http://localhost:3000
```
也可使用：
```bash
pnpm dev  # 先构建再启动
```

### API

#### POST /api/echo
- 请求体：
```json
{
  "message": "hello"
}
```
- 响应体：
```json
{
  "ok": true,
  "received": "hello"
}
```

#### POST /api/hf/generate-image
- 说明：通过 Hugging Face Inference 生成图片，返回可直接预览的 Data URL 字符串（字段为 `base64`）。
- 请求体：
```json
{
  "prompt": "Astronaut riding a horse",
  "model": "Qwen/Qwen-Image",
  "extraParams": { "num_inference_steps": 8 }
}
```
- 成功响应：
```json
{
  "ok": true,
  "base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```
- 调用示例：
```bash
curl -s http://localhost:3000/api/hf/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Qwen/Qwen-Image"
  }' | jq .
```

#### POST /api/hf/generate-image-save
- 说明：生成图片并落盘，返回“纯 base64”（无前缀）与保存路径。
- 请求体：同 `/api/hf/generate-image`。
- 成功响应：
```json
{
  "ok": true,
  "base64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "filePath": "outputs/image/1699999999999.png"
}
```
- 调用示例：
```bash
curl -s http://localhost:3000/api/hf/generate-image-save \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Qwen/Qwen-Image"
  }' | jq .
```

#### POST /api/sf/generate-image
- 说明：通过 SiliconFlow Images API 生成图片，返回直链 URL。
- 请求体：
```json
{
  "prompt": "Astronaut riding a horse",
  "model": "Kwai-Kolors/Kolors",
  "image_size": "1024x1024",
  "batch_size": 1,
  "num_inference_steps": 20,
  "guidance_scale": 7.5
}
```
- 成功响应：
```json
{
  "ok": true,
  "url": "https://sc-maas.oss-cn-shanghai.aliyuncs.com/outputs%2F...jpeg?..."
}
```
- 调用示例：
```bash
curl -s http://localhost:3000/api/sf/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Astronaut riding a horse",
    "model": "Kwai-Kolors/Kolors",
    "image_size": "1024x1024",
    "num_inference_steps": 20,
    "guidance_scale": 7.5
  }' | jq .
```

### 环境变量
- `HF_TOKEN`（必填）：Hugging Face 推理访问令牌。
- `PORT`（可选）：服务端口，默认 `3000`。

### 项目结构
- `src/index.ts`：Express 服务器与 REST 接口。
- `src/image.ts`：图像生成与工具（Hugging Face Inference），base64/Data URL 辅助与保存图片到磁盘。
- `outputs/image`：保存生成图片的默认目录。

### 服务端图像工具用法
可在服务端直接调用这些工具。

```ts
import { textToImage, textToImageDataUrl, textToImageAndSave } from "./src/image.js";

// 1) 获取“纯 base64”（无前缀）
const base64 = await textToImage({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
});
// 预览时拼接：const dataUrl = `data:image/png;base64,${base64}`;

// 2) 一步获取可直接预览的 Data URL 与 MIME 类型
const { base64: dataUrl, mimeType } = await textToImageDataUrl({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
});
// dataUrl 的形式为: "data:image/png;base64,...."

// 3) 生成并保存到 outputs/image
const { filePath, base64: imgBase64, mimeType: savedMime } = await textToImageAndSave({
  prompt: "Astronaut riding a horse",
  model: "Qwen/Qwen-Image",
  outputDir: "outputs/image",      // 可选，默认 outputs/image
  filename: "my-image"              // 可选，扩展名将根据 MIME 类型推断
});
console.log("Saved:", filePath);
```

所有工具均支持可选的 `extraParams`，用于传递高级推理参数：
```ts
await textToImage({
  prompt: "A scenic mountain at sunrise",
  model: "Qwen/Qwen-Image",
  extraParams: { num_inference_steps: 8 }
});
```

### 常见问题
- 若出现 `HF_TOKEN is missing`，请检查 `.env` 中的令牌是否有效，并确认进程已加载环境变量（本项目已使用 `dotenv/config`）。
- 若浏览器中无法预览图片，请确保使用完整的 Data URL，例如：`data:image/png;base64,<base64>`。
- 不同模型可能存在排队或限流情况，建议更换模型或增加重试策略。

### 许可
MIT 