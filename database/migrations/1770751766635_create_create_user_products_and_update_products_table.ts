import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('user_products', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('product_id')
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.timestamp('consumed_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO user_products (id, user_id, product_id, consumed_at, created_at, updated_at)
        SELECT gen_random_uuid(), user_id, id, consumed_at, created_at, updated_at
        FROM products
        WHERE user_id IS NOT NULL
      `)
    })

    this.schema.alterTable('products', (table) => {
      table.renameColumn('user_id', 'created_by')
      table.dropColumn('consumed_at')
    })
  }

  async down() {
    this.schema.alterTable('products', (table) => {
      table.timestamp('consumed_at', { useTz: true })
      table.renameColumn('created_by', 'user_id')
    })

    this.schema.dropTable('user_products')
  }
}
