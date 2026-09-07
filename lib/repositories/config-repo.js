// lib/repositories/config-repo.js — 站点配置仓储

import { getJSON, setJSON } from "./blob-store.js";

const SITE_KEY = "config/site.json";
const ABOUT_KEY = "config/about.json";

const DEFAULT_SITE_INFO = {
  site_name: "My Blog",
  author_name: "博主",
  author_avatar: "",
  author_bio: "",
  announcement: "",
};

/**
 * 读取站点信息，缺失项用默认值填充。
 * @returns {Promise<object>}
 */
export async function getSiteInfo() {
  const data = await getJSON(SITE_KEY, null);
  if (!data) return { ...DEFAULT_SITE_INFO };
  return { ...DEFAULT_SITE_INFO, ...data };
}

/**
 * 更新站点信息（仅更新非 null 字段）。
 * @param {object} info  部分字段
 * @returns {Promise<object>}  更新后的完整站点信息
 */
export async function setSiteInfo(info) {
  const current = await getSiteInfo();
  const updated = { ...current };
  for (const [key, value] of Object.entries(info)) {
    if (value !== null && value !== undefined) {
      updated[key] = value;
    }
  }
  await setJSON(SITE_KEY, updated);
  return updated;
}

/**
 * 读取关于页内容。
 * @returns {Promise<{content:string}>}
 */
export async function getAbout() {
  const data = await getJSON(ABOUT_KEY, null);
  if (!data) return { content: "" };
  return data;
}

/**
 * 更新关于页内容。
 * @param {string} content
 */
export async function setAbout(content) {
  await setJSON(ABOUT_KEY, { content });
}
