import type { HttpContext } from '@adonisjs/core/http'
import DailyCalorie from '#models/daily_calorie'
import {
  indexDailyCalorieQuerySchema,
  createDailyCalorieSchema,
  updateDailyCalorieSchema,
} from '#validators/daily_calorie_validator'

export default class DailyCaloriesController {
  async index({ auth, request }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const { sort, from, to, take, skip } = indexDailyCalorieQuerySchema.parse(request.qs())

    const query = DailyCalorie.query()

    if (!user.isSuperadmin) {
      query.where('userId', user.id)
    }

    if (from) {
      query.where('created_at', '>=', from.toISOString())
    }
    if (to) {
      query.where('created_at', '<=', to.toISOString())
    }

    query.orderBy('created_at', sort)

    if (skip !== undefined) {
      query.offset(skip)
    }
    if (take !== undefined) {
      query.limit(take)
    }

    return query
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const data = createDailyCalorieSchema.parse(request.all())

    const dailyCalorie = await DailyCalorie.create({
      userId: user.id,
      value: data.value,
    })

    return response.created(dailyCalorie)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const dailyCalorie = await DailyCalorie.findOrFail(params.id)

    if (dailyCalorie.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    return dailyCalorie
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const dailyCalorie = await DailyCalorie.findOrFail(params.id)

    if (dailyCalorie.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    const data = updateDailyCalorieSchema.parse(request.all())
    dailyCalorie.merge(data)
    await dailyCalorie.save()

    return dailyCalorie
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const dailyCalorie = await DailyCalorie.findOrFail(params.id)

    if (dailyCalorie.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await dailyCalorie.delete()
    return response.ok({ message: 'Daily calorie entry deleted' })
  }
}
