import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import UserProduct from '#models/user_product'
import Product from '#models/product'
import {
  indexUserProductQuerySchema,
  createUserProductSchema,
  updateUserProductSchema,
} from '#validators/user_product_validator'

export default class ConsumedProductsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const { sort, from, to, name, take, skip } = indexUserProductQuerySchema.parse(request.qs())

    const query = UserProduct.query()

    if (!user.isSuperadmin) {
      query.where('user_products.user_id', user.id)
    }

    if (name) {
      query
        .join('products', 'user_products.product_id', 'products.id')
        .whereILike('products.name', `%${name}%`)
    }

    if (from) {
      query.where('user_products.consumed_at', '>=', from.toISOString())
    }
    if (to) {
      query.where('user_products.consumed_at', '<=', to.toISOString())
    }

    const direction = sort.startsWith('-') ? 'desc' : 'asc'
    const column = sort.replace(/^-/, '')
    query.orderBy(column, direction)

    if (skip !== undefined) {
      query.offset(skip)
    }
    if (take !== undefined) {
      query.limit(take)
    }

    query.preload('product')

    return query
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const data = createUserProductSchema.parse(request.all())

    await Product.findOrFail(data.productId)

    const userProduct = await UserProduct.create({
      userId: user.id,
      productId: data.productId,
      consumedAt: DateTime.fromJSDate(data.consumedAt),
      quantity: data.quantity,
    })

    await userProduct.load('product')
    return response.created(userProduct)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const userProduct = await UserProduct.findOrFail(params.id)

    if (userProduct.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await userProduct.load('product')
    return userProduct
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const userProduct = await UserProduct.findOrFail(params.id)

    if (userProduct.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    const data = updateUserProductSchema.parse(request.all())
    if (data.consumedAt) {
      userProduct.consumedAt = DateTime.fromJSDate(data.consumedAt)
    }
    if (data.quantity !== undefined) {
      userProduct.quantity = data.quantity
    }
    await userProduct.save()

    await userProduct.load('product')
    return userProduct
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const userProduct = await UserProduct.findOrFail(params.id)

    if (userProduct.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await userProduct.delete()
    return response.ok({ message: 'Consumed product entry deleted' })
  }
}
