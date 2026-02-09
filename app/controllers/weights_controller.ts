import type { HttpContext } from '@adonisjs/core/http'
import Weight from '#models/weight'
import {
  indexWeightQuerySchema,
  createWeightSchema,
  updateWeightSchema,
} from '#validators/weight_validator'

export default class WeightsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const { sort, from, to, take, skip } = indexWeightQuerySchema.parse(request.qs())

    const query = Weight.query()

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
    const data = createWeightSchema.parse(request.all())

    const weight = await Weight.create({
      userId: user.id,
      value: data.value,
    })

    return response.created(weight)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const weight = await Weight.findOrFail(params.id)

    if (weight.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    return weight
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const weight = await Weight.findOrFail(params.id)

    if (weight.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    const data = updateWeightSchema.parse(request.all())
    weight.merge(data)
    await weight.save()

    return weight
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const weight = await Weight.findOrFail(params.id)

    if (weight.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await weight.delete()
    return response.ok({ message: 'Weight entry deleted' })
  }
}
