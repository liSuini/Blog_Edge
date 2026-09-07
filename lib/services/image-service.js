// lib/services/image-service.js — 图片上传服务（Gitee 适配器）

import { BusinessError, ErrorCode } from "../middleware/response.js";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const TIMEOUT_MS = 30000;

/**
 * 上传图片到 Gitee 图床。
 *
 * @param {{buffer:Buffer, filename:string, mimetype:string}} file
 * @param {Record<string,string>} env  context.env
 * @returns {Promise<string>}  图片 URL
 */
export async function uploadImage(file, env) {
  const { buffer, filename, mimetype } = file;

  // 格式校验
  const ext = getExtension(filename);
  if (!ALLOWED_EXTS.includes(ext.toLowerCase()) && !ALLOWED_TYPES.includes(mimetype)) {
    throw new BusinessError(ErrorCode.UNSUPPORTED_FORMAT, "不支持的图片格式");
  }

  // 大小校验
  if (buffer.length > MAX_SIZE) {
    throw new BusinessError(ErrorCode.FILE_TOO_LARGE, "文件大小不能超过5MB");
  }

  const token = env?.GITEE_TOKEN;
  const owner = env?.GITEE_REPO_OWNER;
  const repo = env?.GITEE_REPO_NAME;
  const branch = env?.GITEE_BRANCH || "master";
  const imagePath = env?.GITEE_IMAGE_PATH || "images";

  if (!token || !owner || !repo) {
    throw new BusinessError(ErrorCode.IMAGE_UPLOAD_FAILED, "图床配置不完整");
  }

  const uniqueName = `${Date.now()}_${filename}`;
  const path = `${imagePath}/${uniqueName}`;
  const url = `https://gitee.com/api/v5/repos/${owner}/${repo}/contents/${path}`;
  const content = buffer.toString("base64");

  const body = new URLSearchParams({
    access_token: token,
    message: `upload image: ${filename}`,
    content,
    branch,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      method: "POST",
      body,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (resp.status !== 200 && resp.status !== 201) {
      const errText = await resp.text().catch(() => "");
      console.error("[ImageUpload] Gitee API error:", resp.status, errText);
      throw new BusinessError(ErrorCode.IMAGE_UPLOAD_FAILED, "图片上传失败");
    }

    return `https://gitee.com/${owner}/${repo}/raw/${branch}/${path}`;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof BusinessError) throw err;
    console.error("[ImageUpload] Error:", err);
    throw new BusinessError(ErrorCode.IMAGE_UPLOAD_FAILED, "图片上传失败");
  }
}

/**
 * 从文件名获取扩展名（含点）。
 * @param {string} filename
 * @returns {string}
 */
function getExtension(filename) {
  const idx = filename.lastIndexOf(".");
  if (idx < 0) return "";
  return filename.slice(idx).toLowerCase();
}
