import request from './request'

export function getDashboard() {
  return request.get('/admin/dashboard')
}
