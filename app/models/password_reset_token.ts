import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import { randomUUID } from 'node:crypto'

export default class PasswordResetToken extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare tokenHash: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @beforeCreate()
  static assignUuid(token: PasswordResetToken) {
    token.id = randomUUID()
  }

  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }
}
