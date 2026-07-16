export class HttpError extends Error {
  constructor(status, message, code = 'ERROR', fields = undefined) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

export function notFound(message = 'Data tidak ditemukan.') {
  return new HttpError(404, message, 'NOT_FOUND')
}

export function validationError(message, fields = undefined) {
  return new HttpError(400, message, 'VALIDATION_ERROR', fields)
}

export function forbidden(message = 'Kamu tidak memiliki akses ke fitur ini.') {
  return new HttpError(403, message, 'FORBIDDEN')
}

export function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}
