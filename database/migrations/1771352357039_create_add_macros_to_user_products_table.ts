import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('protein', 10, 2).nullable()
      table.decimal('carbohydrate', 10, 2).nullable()
      table.decimal('lipid', 10, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('protein')
      table.dropColumn('carbohydrate')
      table.dropColumn('lipid')
    })
  }
}
