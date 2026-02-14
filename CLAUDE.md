# Context & Standards: AdonisJS 6 (API) + Zod + OpenRouter SDK

## Tech Stack
- **Backend**: AdonisJS 6 (Lucid ORM, PostgreSQL).
- **Authentication**: OAT (Access Tokens) via `@adonisjs/auth`.
- **Validation**: **Zod only** (Skip VineJS).
- **AI**: `@openrouter/sdk` (Custom implementation, no OpenAI SDK).
- **Database**: PostgreSQL with UUIDs (`pgcrypto`).

## Project Structure
- `app/controllers/`: HTTP Controllers (prefer resource-based naming).
- `app/models/`: Lucid Models (CamelCase properties, UUID as primary key).
- `app/services/`: Business Logic (AiService, OpenFoodFactsService).
- `app/validators/`: Zod schemas (Centralize reusable schemas here).
- `database/migrations/`: Database schema definitions.

## Coding Rules
- **Validation**: Use `zodSchema.parse(request.all())` in controllers.
- **Typing**: Use `z.infer<typeof schema>` for all DTOs and Service returns.
- **Dependency Injection**: Use `@inject()` for services to ensure testability.
- **Error Handling**: Use the global exception handler. Return structured JSON for validation errors.
- **Naming**: Use camelCase for TS variables/properties, snake_case for DB columns.

## LLM & API Integration
- **OpenRouter SDK**: Always provide `appDetails` (name, url) in the constructor.
- **JSON Mode**: Force `response_format: { type: "json_object" }` in completions.
- **Open Food Facts**: Set a custom `User-Agent` header for all requests.
- **UUIDs**: Use `crypto.randomUUID()` in `@beforeCreate` hooks for all models.

## Common Commands
- Build: `npm run build`
- Dev: `npm run dev`
- New Migration: `node ace make:migration [name]`
- Run Migrations: `node ace migration:run`
- New Controller: `node ace make:controller [name] -r`
- New Model: `node ace make:model [name]`