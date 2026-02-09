import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import {
  indexProductQuerySchema,
  createProductSchema,
  updateProductSchema,
} from '#validators/product_validator'

export default class ProductsController {
  async index({ auth, request }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const { sort, name, from, to, kcalMin, kcalMax, take, skip } =
      indexProductQuerySchema.parse(request.qs())

    const query = Product.query()

    if (!user.isSuperadmin) {
      query.where('userId', user.id)
    }

    if (name) {
      query.whereILike('name', `%${name}%`)
    }
    if (from) {
      query.where('created_at', '>=', from.toISOString())
    }
    if (to) {
      query.where('created_at', '<=', to.toISOString())
    }
    if (kcalMin !== undefined) {
      query.where('kcal', '>=', kcalMin)
    }
    if (kcalMax !== undefined) {
      query.where('kcal', '<=', kcalMax)
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

    return query
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const data = createProductSchema.parse(request.all())

    const product = await Product.create({
      userId: user.id,
      ...data,
    })

    return response.created(product)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const product = await Product.findOrFail(params.id)

    if (product.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    return product
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const product = await Product.findOrFail(params.id)

    if (product.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    const data = updateProductSchema.parse(request.all())
    product.merge(data)
    await product.save()

    return product
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const product = await Product.findOrFail(params.id)

    if (product.userId !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await product.delete()
    return response.ok({ message: 'Product deleted' })
  }
}
