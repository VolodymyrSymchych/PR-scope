# Змінні оточення для Vercel

Цей документ містить список всіх змінних оточення (секретів), які потрібно додати до Vercel для коректної роботи проєкту.

## Обов'язкові змінні

### База даних
- **`DATABASE_URL`** - URL підключення до PostgreSQL бази даних (Neon)
  - Формат: `postgresql://user:password@host:port/database?sslmode=require`
  - Отримати можна з Neon Dashboard → Connection String

### Redis (Upstash)
- **`UPSTASH_REDIS_REST_URL`** - REST URL для Upstash Redis
  - Отримати з Upstash Dashboard → Redis → REST API → URL
  - Формат: `https://your-redis.upstash.io`
- **`UPSTASH_REDIS_REST_TOKEN`** - Token для Upstash Redis
  - Отримати з Upstash Dashboard → Redis → REST API → Token

### JWT Authentication
- **`JWT_SECRET`** - Секретний ключ для підпису JWT токенів
  - Генерувати: `openssl rand -base64 32` або використати будь-який безпечний випадковий рядок
  - ⚠️ **ВАЖЛИВО**: Має бути однаковим для всіх середовищ (dev/prod)
  - Мінімальна довжина: 32 символи

### Email (Resend)
- **`RESEND_API_KEY`** - API ключ для Resend
  - Отримати з Resend Dashboard → API Keys
  - Формат: `re_...`
- **`EMAIL_FROM`** - Email адреса відправника (опціонально)
  - Формат: `Project Scope Analyzer <noreply@yourdomain.com>`
  - Якщо не вказано, використовується `onboarding@resend.dev`
  - Приклад: `Project Scope Analyzer <noreply@yourdomain.com>`

### Stripe (Платежі)
- **`STRIPE_SECRET_KEY`** - Secret key для Stripe API
  - Отримати з Stripe Dashboard → Developers → API keys → Secret key
  - Формат: `sk_test_...` (test) або `sk_live_...` (production)
- **`STRIPE_WEBHOOK_SECRET`** - Webhook signing secret для Stripe
  - Отримати після створення webhook endpoint в Stripe Dashboard
  - Формат: `whsec_...`
  - Створити webhook: Stripe Dashboard → Developers → Webhooks → Add endpoint

### Cloudflare R2 (Файли)
- **`AWS_ACCESS_KEY_ID`** - Access Key ID для Cloudflare R2
  - Отримати з Cloudflare Dashboard → R2 → Manage R2 API Tokens
  - Створити токен: https://dash.cloudflare.com/0b82934a819e7752ca98a8a5dd06cb7b/r2/api-tokens
- **`AWS_SECRET_ACCESS_KEY`** - Secret Access Key для Cloudflare R2
  - Отримати разом з Access Key ID
  - ⚠️ **ВАЖЛИВО**: Показується тільки один раз при створенні!
- **`AWS_ENDPOINT`** - Endpoint URL для R2
  - Значення: `https://0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com`
- **`AWS_BUCKET_NAME`** - Назва бакету в R2
  - Значення: `psa`
- **`AWS_REGION`** - Регіон (зазвичай `auto` для R2)
  - Значення: `auto`
- **`R2_PUBLIC_URL`** - Публічний URL для доступу до файлів (опціонально)
  - Формат: `https://files.yourdomain.com`
  - Потрібно налаштувати custom domain в Cloudflare R2

## Опціональні змінні

### API URLs
- **`NEXT_PUBLIC_APP_URL`** - Публічний URL додатку
  - Для production: `https://your-domain.vercel.app` або `https://psa-managment.vercel.app`
  - Для development: `http://localhost:3001`
  - Використовується для генерації посилань в email та Stripe checkout
- **`NEXT_PUBLIC_API_URL`** - Публічний URL API (зазвичай `/api`)
  - За замовчуванням: `/api`
  - Зазвичай не потрібно змінювати
- **`NEXT_PUBLIC_BASE_URL`** - Базовий URL для Stripe checkout
  - Для production: `https://your-domain.vercel.app`
  - Для development: `http://localhost:3001`
  - Використовується для success/cancel URLs в Stripe

### AI/Anthropic (опціонально)
- **`ANTHROPIC_API_KEY`** - API ключ для Anthropic Claude
  - Потрібен тільки якщо використовується функція аналізу проєктів
  - Отримати з Anthropic Dashboard
  - Формат: `sk-ant-...`
  - Без цього ключа AI аналіз не працюватиме

### Cron Jobs
- **`CRON_SECRET`** - Секрет для захисту cron endpoints
  - Використовується для `/api/cron/reminders` та `/api/cron/recurring-invoices`
  - Генерувати: `openssl rand -base64 32`
  - Додати в Vercel Cron Jobs як Authorization header: `Bearer <CRON_SECRET>`

### Migration
- **`MIGRATION_SECRET`** - Секрет для захисту migration endpoint
  - Використовується для `/api/migrate`
  - Генерувати: `openssl rand -base64 32`
  - За замовчуванням: `migration-secret` (небезпечно для production!)

### Local Development (не потрібно для Vercel)
- **`REDIS_URL`** - URL для локального Redis (тільки для development)
  - Формат: `redis://localhost:6379`
  - Не потрібно для Vercel (використовується Upstash)

## Приклад конфігурації для Vercel

```bash
# База даних
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# JWT
JWT_SECRET=your-generated-secret-key-min-32-chars

# Email
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=Project Scope Analyzer <noreply@yourdomain.com>

# Stripe
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Cloudflare R2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_ENDPOINT=https://0b82934a819e7752ca98a8a5dd06cb7b.r2.cloudflarestorage.com
AWS_BUCKET_NAME=psa
AWS_REGION=auto

# URLs
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# Опціонально
ANTHROPIC_API_KEY=sk-ant-your-api-key
CRON_SECRET=your-generated-cron-secret
MIGRATION_SECRET=your-generated-migration-secret
```

## Як додати змінні в Vercel

1. Перейдіть до Vercel Dashboard → Ваш проєкт → Settings → Environment Variables
2. Додайте кожну змінну:
   - **Name**: Назва змінної (наприклад, `DATABASE_URL`)
   - **Value**: Значення змінної
   - **Environment**: Виберіть середовище (Production, Preview, Development)
     - Production - для production deployments
     - Preview - для preview deployments (pull requests)
     - Development - для local development (якщо використовується Vercel CLI)
3. Натисніть **Save**
4. Перезапустіть deployment після додавання змінних:
   - Перейдіть до Deployments
   - Знайдіть останній deployment
   - Натисніть "..." → Redeploy

## Налаштування Cron Jobs в Vercel

Якщо використовуєте cron endpoints:

1. Перейдіть до Vercel Dashboard → Ваш проєкт → Settings → Cron Jobs
2. Додайте новий cron job:
   - **Path**: `/api/cron/reminders` або `/api/cron/recurring-invoices`
   - **Schedule**: `0 * * * *` (кожну годину) або інший schedule
   - **Authorization**: `Bearer <CRON_SECRET>`
3. Переконайтеся, що `CRON_SECRET` додано до Environment Variables

## Перевірка

Після додавання всіх змінних перевірте:

1. ✅ База даних підключається
   - Перевірте логи Vercel на помилки підключення
2. ✅ Redis працює (перевірте логи)
   - Шукайте повідомлення "✓ Connected to Upstash Redis"
3. ✅ Email відправляється (протестуйте реєстрацію)
   - Створіть тестового користувача
   - Перевірте email для верифікації
4. ✅ Stripe працює (протестуйте checkout)
   - Створіть тестовий payment
   - Перевірте webhook events в Stripe Dashboard
5. ✅ Файли завантажуються (якщо використовується R2)
   - Завантажте тестовий файл через UI
   - Перевірте в Cloudflare R2 Dashboard

## Безпека

⚠️ **ВАЖЛИВО**:
- Ніколи не комітьте `.env` файли в Git
- Використовуйте різні ключі для development та production
- Регулярно ротуйте секретні ключі (кожні 90 днів)
- Обмежуйте доступ до Vercel Dashboard тільки необхідним користувачам
- Використовуйте strong secrets для `JWT_SECRET`, `CRON_SECRET`, `MIGRATION_SECRET`
- Не використовуйте default значення в production (`migration-secret` тощо)

## Додаткова документація

- [Redis Setup Guide](./dashboard/REDIS_SETUP.md)
- [R2 Setup Guide](./dashboard/R2_SETUP.md)
- [Caching and Rate Limiting](./dashboard/CACHING_AND_RATE_LIMITING.md)

