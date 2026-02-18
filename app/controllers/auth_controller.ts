import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Weight from '#models/weight'
import DailyCalorie from '#models/daily_calorie'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '#validators/auth_validator'
import EmailVerificationService from '#services/email_verification_service'

export default class AuthController {
  private emailVerificationService = new EmailVerificationService()

  async register({ request, response }: HttpContext) {
    const data = registerSchema.parse(request.all())

    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.badRequest({ message: 'Email already in use' })
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      username: data.username,
    })

    await user.refresh()

    const rawToken = await this.emailVerificationService.createToken(user)
    await this.emailVerificationService.sendVerificationEmail(user, rawToken)

    return response.created({
      message: 'Registration successful. Please check your email to verify your account.',
    })
  }

  async login({ request, response }: HttpContext) {
    const data = loginSchema.parse(request.all())

    const user = await User.verifyCredentials(data.email, data.password)

    if (!user.isEmailVerified) {
      return response.forbidden({
        message: 'Please verify your email address before logging in.',
      })
    }

    const token = await User.accessTokens.create(user)

    const [lastWeight, lastDailyCalorie] = await Promise.all([
      Weight.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
      DailyCalorie.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
    ])

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isSuperadmin: user.isSuperadmin,
      },
      token: token.toJSON(),
      lastWeight,
      lastDailyCalorie,
    }
  }

  async verifyEmail({ request, response }: HttpContext) {
    const { token } = verifyEmailSchema.parse(request.all())

    try {
      const user = await this.emailVerificationService.verifyToken(token)
      const accessToken = await User.accessTokens.create(user)

      const [lastWeight, lastDailyCalorie] = await Promise.all([
        Weight.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
        DailyCalorie.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
      ])

      return response.ok({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isSuperadmin: user.isSuperadmin,
        },
        token: accessToken.toJSON(),
        lastWeight,
        lastDailyCalorie,
      })
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'INVALID_TOKEN') {
          return response.badRequest({ message: 'Invalid verification token.' })
        }
        if (error.message === 'TOKEN_EXPIRED') {
          return response.badRequest({
            message: 'Verification token has expired. Please request a new one.',
          })
        }
      }
      return response.internalServerError({ message: 'An error occurred during verification.' })
    }
  }

  async resendVerification({ request, response }: HttpContext) {
    const { email } = resendVerificationSchema.parse(request.all())

    const user = await User.findBy('email', email)

    if (!user || user.isEmailVerified) {
      return response.ok({
        message:
          'If an unverified account exists with this email, a verification link has been sent.',
      })
    }

    const rawToken = await this.emailVerificationService.createToken(user)
    await this.emailVerificationService.sendVerificationEmail(user, rawToken)

    return response.ok({
      message:
        'If an unverified account exists with this email, a verification link has been sent.',
    })
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.ok({ message: 'Logged out successfully' })
  }
}
