import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { ZodError } from 'zod'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof ZodError) {
      return ctx.response.unprocessableEntity({
        message: 'Validation failure',
        errors: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
