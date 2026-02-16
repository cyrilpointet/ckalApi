import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import User from '#models/user'

export default class Product extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare createdBy: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare kcal: number

  @column()
  declare barcode: string | null

  @column()
  declare isRecipe: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(product: Product) {
    product.id = randomUUID()
  }
}
