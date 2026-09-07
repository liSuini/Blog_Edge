<template>
  <div class="markdown-renderer" v-html="rendered"></div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import katexPlugin from '@vscode/markdown-it-katex'
import markdownItMark from 'markdown-it-mark'
import hljs from 'highlight.js'
import 'katex/dist/katex.min.css'

const props = defineProps({
  content: { type: String, default: '' },
})

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`
      } catch (_) {
        // fall through
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
  },
})

// 启用 KaTeX 数学公式渲染（支持 $...$ 行内公式和 $$...$$ 块级公式）
md.use(katexPlugin, { throwOnError: false })

// 启用 ==高亮== 语法（<mark> 标签）
md.use(markdownItMark)

// 给所有 img 标签加 referrerpolicy="no-referrer"，绕过 Gitee 等图床的防盗链
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('referrerpolicy', 'no-referrer')
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const targetIndex = token.attrIndex('target')
  if (targetIndex < 0) {
    token.attrPush(['target', '_blank'])
    token.attrPush(['rel', 'noopener noreferrer'])
  } else {
    token.attrs[targetIndex][1] = '_blank'
  }
  return self.renderToken(tokens, idx, options)
}

// 给 h2/h3 标题加 id 锚点，供目录导航使用
const headingOpenDefault = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token.tag === 'h2' || token.tag === 'h3') {
    const nextToken = tokens[idx + 1]
    if (nextToken && nextToken.type === 'inline') {
      const text = nextToken.content.replace(/[`*~_]/g, '').trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      token.attrSet('id', id)
    }
  }
  return headingOpenDefault(tokens, idx, options, env, self)
}

const rendered = computed(() => md.render(props.content))
</script>

<style scoped>
.markdown-renderer {
  font-size: 16px;
  line-height: 1.85;
  color: var(--color-body);
}

/* ---- 标题 ---- */
.markdown-renderer :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  margin: 32px 0 16px;
  color: var(--color-heading);
  letter-spacing: -0.01em;
}

.markdown-renderer :deep(h2) {
  font-size: 22px;
  font-weight: 600;
  margin: 28px 0 14px;
  color: var(--color-heading);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.markdown-renderer :deep(h2)::before {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 40px;
  height: 3px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.markdown-renderer :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 22px 0 10px;
  color: var(--color-heading);
}

.markdown-renderer :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  margin: 18px 0 8px;
  color: var(--color-heading);
}

/* ---- 段落 ---- */
.markdown-renderer :deep(p) {
  margin: 14px 0;
}

/* ---- 链接 ---- */
.markdown-renderer :deep(a) {
  color: var(--color-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--transition-fast);
}

.markdown-renderer :deep(a:hover) {
  border-bottom-color: var(--color-primary);
}

/* ---- 列表 ---- */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  margin: 14px 0;
  padding-left: 24px;
}

.markdown-renderer :deep(li) {
  margin: 6px 0;
}

.markdown-renderer :deep(li::marker) {
  color: var(--color-primary);
}

/* ---- 引用块 ---- */
.markdown-renderer :deep(blockquote) {
  border-left: 4px solid var(--color-primary);
  padding: 12px 20px;
  margin: 18px 0;
  color: var(--color-secondary);
  background: var(--color-primary-alpha);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-style: italic;
}

.markdown-renderer :deep(blockquote p) {
  margin: 4px 0;
}

/* ---- 行内代码 ---- */
.markdown-renderer :deep(:not(pre) > code) {
  background: var(--color-border-light);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
  font-family: var(--font-mono);
  color: var(--color-primary-dark);
  border: 1px solid var(--color-border);
}

/* ---- 代码块 ---- */
.markdown-renderer :deep(pre) {
  background: var(--color-code-bg);
  border-radius: var(--radius-md);
  padding: 18px 22px;
  overflow-x: auto;
  margin: 18px 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.markdown-renderer :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 14px;
  color: var(--color-code-text);
  font-family: var(--font-mono);
  line-height: 1.6;
}

.markdown-renderer :deep(pre::-webkit-scrollbar) {
  height: 6px;
}

.markdown-renderer :deep(pre::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
}

/* ---- 表格 ---- */
.markdown-renderer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  border-radius: var(--radius-sm);
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.markdown-renderer :deep(th),
.markdown-renderer :deep(td) {
  border: 1px solid var(--color-border);
  padding: 10px 14px;
  text-align: left;
}

.markdown-renderer :deep(th) {
  background: var(--color-surface-hover);
  font-weight: 600;
  color: var(--color-heading);
}

.markdown-renderer :deep(tr:hover td) {
  background: var(--color-surface-hover);
}

/* ---- 图片 ---- */
.markdown-renderer :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-md);
  margin: 16px 0;
  box-shadow: var(--shadow-sm);
}

/* ---- 分割线 ---- */
.markdown-renderer :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(to right, transparent, var(--color-border), transparent);
  margin: 32px 0;
}

/* ---- 强调 ---- */
.markdown-renderer :deep(strong) {
  color: var(--color-heading);
  font-weight: 600;
}

/* ---- 高亮标记 ---- */
.markdown-renderer :deep(mark) {
  background: rgba(255, 235, 59, 0.35);
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  color: inherit;
}

/* ---- 移动端 ---- */
@media (max-width: 640px) {
  .markdown-renderer {
    font-size: 15px;
  }

  .markdown-renderer :deep(h1) {
    font-size: 24px;
  }

  .markdown-renderer :deep(h2) {
    font-size: 20px;
  }

  .markdown-renderer :deep(pre) {
    padding: 14px 16px;
    font-size: 13px;
  }
}
</style>
