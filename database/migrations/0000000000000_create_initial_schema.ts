import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    this.schema.createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('email', 254).notNullable().unique()
      table.string('password', 255).notNullable()
      table.string('username', 100).notNullable()
      table.boolean('is_superadmin').notNullable().defaultTo(false)
      table.boolean('is_email_verified').notNullable().defaultTo(false)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('auth_access_tokens', (table) => {
      table.increments('id')
      table
        .uuid('tokenable_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
    })

    this.schema.createTable('weights', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.float('value').notNullable()
      table.date('date').notNullable().defaultTo(this.now())
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('daily_calories', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.integer('value').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('products', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('created_by')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.text('description').nullable()
      table.integer('kcal').notNullable()
      table.boolean('is_recipe').notNullable().defaultTo(false)
      table.string('barcode').nullable()
      table.decimal('protein', 10, 2).nullable()
      table.decimal('carbohydrate', 10, 2).nullable()
      table.decimal('lipid', 10, 2).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

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
      table.decimal('quantity', 10, 2).notNullable().defaultTo(1)
      table.timestamp('consumed_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })

    this.schema.createTable('email_verification_tokens', (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable('email_verification_tokens')
    this.schema.dropTable('user_products')
    this.schema.dropTable('products')
    this.schema.dropTable('daily_calories')
    this.schema.dropTable('weights')
    this.schema.dropTable('auth_access_tokens')
    this.schema.dropTable('users')
  }
}
