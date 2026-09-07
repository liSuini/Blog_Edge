import request from './request'

/**
 * 前端直传 Gitee 图床
 * 1. 向后端请求 Gitee 配置（token/owner/repo/branch/path）
 * 2. 用 FileReader 将文件转 base64
 * 3. 直接调 Gitee API 上传，跳过 EdgeOne 中转，大幅提速
 * 返回格式与后端代传一致：{ code, message, data: { url } }
 */
export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    // 1. 获取 Gitee 上传配置
    request
      .get('/admin/images/token')
      .then((tokenRes) => {
        const { token, owner, repo, branch, imagePath } = tokenRes.data

        // 2. 读取文件为 base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]

          // 生成唯一文件名：时间戳 + 随机串 + 原扩展名
          const ext = file.name.split('.').pop() || 'png'
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
          const fullPath = `${imagePath}/${filename}`

          // 3. 直接调 Gitee API 上传
          const giteeUrl = `https://gitee.com/api/v5/repos/${owner}/${repo}/contents/${fullPath}`

          fetch(giteeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: token,
              content: base64,
              message: `upload: ${filename}`,
              branch: branch,
            }),
          })
            .then((resp) => {
              if (!resp.ok) {
                return resp.json().then((errBody) => {
                  throw new Error(errBody.message || `Gitee API 错误 (${resp.status})`)
                })
              }
              return resp.json()
            })
            .then((giteeData) => {
              const url = giteeData.content?.download_url
              if (!url) {
                throw new Error('Gitee 返回数据异常，未获取到图片 URL')
              }
              resolve({ code: 200, message: 'success', data: { url } })
            })
            .catch(reject)
        }
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsDataURL(file)
      })
      .catch(reject)
  })
}
