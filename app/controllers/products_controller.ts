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
    const { sort, name, from, to, kcalMin, kcalMax, isRecipe, take, skip } =
      indexProductQuerySchema.parse(request.qs())

    const query = Product.query()

    if (!user.isSuperadmin) {
      query.where('created_by', user.id)
    }

    if (name) {
      query.whereILike('name', `%${name}%`)
    }
    if (from) {
      query.where('updated_at', '>=', from.toISOString())
    }
    if (to) {
      query.where('updated_at', '<=', to.toISOString())
    }
    if (kcalMin !== undefined) {
      query.where('kcal', '>=', kcalMin)
    }
    if (kcalMax !== undefined) {
      query.where('kcal', '<=', kcalMax)
    }
    if (isRecipe !== undefined) {
      query.where('is_recipe', isRecipe)
    }

    const countResult = await query.clone().count('* as total').first()
    const totalCount = Number(countResult?.$extras.total ?? 0)

    const direction = sort.startsWith('-') ? 'desc' : 'asc'
    const column = sort.replace(/^-/, '')
    query.orderBy(column, direction)

    if (skip !== undefined) {
      query.offset(skip)
    }
    if (take !== undefined) {
      query.limit(take)
    }

    const data = await query

    return { data, totalCount }
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const data = createProductSchema.parse(request.all())

    const product = await Product.create({
      createdBy: user.id,
      ...data,
    })

    return response.created(product)
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const product = await Product.findOrFail(params.id)

    if (product.createdBy !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    return product
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.use('api').getUserOrFail()
    const product = await Product.findOrFail(params.id)

    if (product.createdBy !== user.id && !user.isSuperadmin) {
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

    if (product.createdBy !== user.id && !user.isSuperadmin) {
      return response.forbidden({ message: 'Access denied' })
    }

    await product.delete()
    return response.ok({ message: 'Product deleted' })
  }
}
