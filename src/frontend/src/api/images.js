import request from './request'

export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/admin/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
