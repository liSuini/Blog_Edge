import request from './request'

// 前台
export function getAboutContent() {
  return request.get('/config/about')
}

export function getSiteInfo() {
  return request.get('/config/site-info')
}

// 后台
export function updateAboutContent(content) {
  return request.put('/admin/config/about', { content })
}

export function getAdminSiteInfo() {
  return request.get('/admin/config/site-info')
}

export function updateSiteInfo(data) {
  return request.put('/admin/config/site-info', data)
}