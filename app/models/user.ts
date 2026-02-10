import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Weight from '#models/weight'
import DailyCalorie from '#models/daily_calorie'
import Product from '#models/product'
import UserProduct from '#models/user_product'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'
import { randomUUID } from 'node:crypto'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends AuthFinder(BaseModel) {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare username: string

  @column()
  declare isSuperadmin: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasMany(() => Weight)
  declare weights: HasMany<typeof Weight>

  @hasMany(() => DailyCalorie)
  declare dailyCalories: HasMany<typeof DailyCalorie>

  @hasMany(() => Product, { foreignKey: 'createdBy' })
  declare products: HasMany<typeof Product>

  @hasMany(() => UserProduct)
  declare consumedProducts: HasMany<typeof UserProduct>

  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }
}
