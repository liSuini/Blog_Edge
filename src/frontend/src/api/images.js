import request from './request'

export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      request
        .post(
          '/admin/images/upload',
          {
            filename: file.name,
            mimetype: file.type,
            content: base64,
          },
          { timeout: 60000 }
        )
        .then(resolve)
        .catch(reject)
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
