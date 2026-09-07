// middleware.js — EdgeOne 边缘中间件（SPA fallback）
// 非 /api/* 且非静态文件 → rewrite 到 /index.html

export function middleware(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // API 请求直接放行到 Cloud Function
  if (url.pathname.startsWith("/api/")) {
    return next();
  }

  // 有文件扩展名的请求放行（静态资源如 .js .css .png .ico 等）
  if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
    return next();
  }

  // 其余路由 rewrite 到 /index.html（Vue Router History 模式 fallback）
  return context.rewrite("/index.html");
}
