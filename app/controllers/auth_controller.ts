import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Weight from '#models/weight'
import DailyCalorie from '#models/daily_calorie'
import { registerSchema, loginSchema } from '#validators/auth_validator'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = registerSchema.parse(request.all())

    const user = await User.create({
      email: data.email,
      password: data.password,
      username: data.username,
    })

    await user.refresh()
    const token = await User.accessTokens.create(user)

    const [lastWeight, lastDailyCalorie] = await Promise.all([
      Weight.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
      DailyCalorie.query().where('userId', user.id).orderBy('created_at', 'desc').first(),
    ])

    return response.created({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isSuperadmin: user.isSuperadmin,
      },
      token: token.toJSON(),
      lastWeight,
      lastDailyCalorie,
    })
  }

  async login({ request }: HttpContext) {
    const data = loginSchema.parse(request.all())

    const user = await User.verifyCredentials(data.email, data.password)
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

  async logout({ auth, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.ok({ message: 'Logged out successfully' })
  }
}
