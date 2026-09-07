// lib/utils/markdown.js — Markdown 摘要生成

/**
 * 从 Markdown 内容生成纯文本摘要。
 *
 * 处理步骤：
 * 1. 去除代码块（```...``` 和 ~~~...~~~）
 * 2. 去除行内代码（`...`）
 * 3. 去除图片（![alt](url)）
 * 4. 去除链接URL，保留文本（[text](url) → text）
 * 5. 去除标题标记（#、##、###...）
 * 6. 去除粗体（**text** / __text__ → text）
 * 7. 去除斜体（*text* / _text_ → text）
 * 8. 去除引用标记（>）
 * 9. 去除列表标记（-、*、+、1.）
 * 10. 去除水平线（---、***、___）
 * 11. 压缩多余空白
 * 12. 取前200字 + "..."
 *
 * @param {string} content  Markdown 正文
 * @returns {string} 纯文本摘要（≤203字）
 */
export function generateSummary(content) {
  if (!content || typeof content !== "string") return "";

  let text = content;

  // 1. 去除代码块 ```...``` 和 ~~~...~~~
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/~~~[\s\S]*?~~~/g, "");

  // 2. 去除行内代码 `...`
  text = text.replace(/`([^`]+)`/g, "$1");

  // 3. 去除图片 ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // 4. 去除链接URL，保留文本 [text](url) → text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");

  // 5. 去除标题标记（行首的 #）
  text = text.replace(/^#{1,6}\s+/gm, "");

  // 6. 去除粗体 **text** / __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");

  // 7. 去除斜体 *text* / _text_
  text = text.replace(/\*([^*]+)\*/g, "$1");
  text = text.replace(/(?<!\w)_([^_]+)_(?!\w)/g, "$1");

  // 8. 去除引用标记（行首的 >）
  text = text.replace(/^>\s*/gm, "");

  // 9. 去除列表标记（行首的 -、*、+、数字.）
  text = text.replace(/^[\s]*[-*+]\s+/gm, "");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");

  // 10. 去除水平线 ---、***、___
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");

  // 11. 压缩多余空白
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  text = text.replace(/[ \t]+/g, " ");

  // 12. 取前200字 + "..."
  if (text.length <= 200) return text;
  return text.slice(0, 200) + "...";
}
