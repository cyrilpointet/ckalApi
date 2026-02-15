import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('quantity', 10, 2).notNullable().defaultTo(1).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('quantity').notNullable().defaultTo(1).alter()
    })
  }
}
