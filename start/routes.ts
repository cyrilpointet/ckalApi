/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const WeightsController = () => import('#controllers/weights_controller')
const DailyCaloriesController = () => import('#controllers/daily_calories_controller')
const ProductsController = () => import('#controllers/products_controller')
const ConsumedProductsController = () => import('#controllers/consumed_products_controller')
const AiController = () => import('#controllers/ai_controller')
const OffController = () => import('#controllers/off_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('auth')

router
  .group(() => {
    router.get('/', [WeightsController, 'index'])
    router.post('/', [WeightsController, 'store'])
    router.get('/:id', [WeightsController, 'show'])
    router.put('/:id', [WeightsController, 'update'])
    router.delete('/:id', [WeightsController, 'destroy'])
  })
  .prefix('weights')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [DailyCaloriesController, 'index'])
    router.post('/', [DailyCaloriesController, 'store'])
    router.get('/:id', [DailyCaloriesController, 'show'])
    router.put('/:id', [DailyCaloriesController, 'update'])
    router.delete('/:id', [DailyCaloriesController, 'destroy'])
  })
  .prefix('daily-calories')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [ProductsController, 'index'])
    router.post('/', [ProductsController, 'store'])
    router.get('/:id', [ProductsController, 'show'])
    router.put('/:id', [ProductsController, 'update'])
    router.delete('/:id', [ProductsController, 'destroy'])
  })
  .prefix('products')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/', [ConsumedProductsController, 'index'])
    router.post('/', [ConsumedProductsController, 'store'])
    router.get('/:id', [ConsumedProductsController, 'show'])
    router.put('/:id', [ConsumedProductsController, 'update'])
    router.delete('/:id', [ConsumedProductsController, 'destroy'])
  })
  .prefix('consumed-products')
  .use(middleware.auth())

router
  .group(() => {
    router.post('kcalculator', [AiController, 'kcalculator'])
    router.post('picture-kcalculator', [AiController, 'pictureKcalculator'])
    router.post('recipe', [AiController, 'generateRecipe'])
  })
  .prefix('ai')
  .use(middleware.auth())

router
  .group(() => {
    router.get('/:barcode', [OffController, 'show'])
  })
  .prefix('off')
  .use(middleware.auth())
