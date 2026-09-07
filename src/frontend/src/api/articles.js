import request from './request'

// 前台
export function getArticles(params) {
  return request.get('/articles', { params })
}

export function getArticleDetail(id) {
  return request.get(`/articles/${id}`)
}

export function getArchive() {
  return request.get('/articles/archive')
}

// 后台
export function getAdminArticles(params) {
  return request.get('/admin/articles', { params })
}

export function createArticle(data) {
  return request.post('/admin/articles', data)
}

export function updateArticle(id, data) {
  return request.put(`/admin/articles/${id}`, data)
}

export function deleteArticle(id) {
  return request.delete(`/admin/articles/${id}`)
}

export function updateArticleStatus(id, status) {
  return request.patch(`/admin/articles/${id}/status`, { status })
}
