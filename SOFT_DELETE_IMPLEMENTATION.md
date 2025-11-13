# Soft Delete Implementation

## Огляд

Реалізовано функціональність **soft delete** для проектів, тасків, документів (file attachments) та інвойсів. Замість фізичного видалення записів з бази даних, вони позначаються як видалені встановленням значення `deletedAt` на поточну дату і час.

## Змінені таблиці

До наступних таблиць додано колонку `deleted_at`:

- **projects** - проекти
- **tasks** - завдання
- **invoices** - інвойси
- **file_attachments** - файлові вкладення

## Зміни в схемі бази даних

### Файл: `shared/schema.ts`

Додано поле `deletedAt` до кожної з таблиць:

```typescript
deletedAt: timestamp('deleted_at')
```

## Зміни в Storage Layer

### Файл: `server/storage.ts`

### Оновлені методи видалення (Soft Delete)

Всі методи видалення тепер виконують **soft delete** замість hard delete:

1. **`deleteProject(projectId)`** - позначає проект як видалений
2. **`deleteTask(taskId)`** - позначає завдання як видалене
3. **`deleteInvoice(invoiceId)`** - позначає інвойс як видалений
4. **`deleteFileAttachment(id)`** - позначає файл як видалений

### Додані методи відновлення

Додано нові методи для відновлення видалених записів:

1. **`restoreProject(projectId)`** - відновлює видалений проект
2. **`restoreTask(taskId)`** - відновлює видалене завдання
3. **`restoreInvoice(invoiceId)`** - відновлює видалений інвойс
4. **`restoreFileAttachment(id)`** - відновлює видалений файл

### Оновлені методи отримання даних (GET)

Всі методи отримання даних тепер фільтрують видалені записи за допомогою `isNull(deletedAt)`:

**Проекти:**
- `getUserProjects(userId)`
- `getProject(projectId)`
- `userHasProjectAccess(userId, projectId)`

**Завдання:**
- `getTasks(userId?, projectId?)`
- `getTask(taskId)`
- `getSubtasks(parentId)`

**Інвойси:**
- `getInvoices(projectId?)`
- `getInvoice(invoiceId)`
- `getInvoiceByPublicToken(token)`

**Файлові вкладення:**
- `getFileAttachments(projectId?, taskId?)`
- `getFileAttachment(id)`
- `getFileVersions(parentFileId)`

**Аналітичні методи:**
- `getBudgetMetrics(userId)` - враховує лише не видалені проекти
- `getCashFlowData(userId, startDate, endDate)` - враховує лише не видалені проекти та інвойси
- `getCashFlowForecast(userId)` - враховує лише не видалені проекти
- `getCashFlowByCategory(userId, startDate, endDate)` - враховує лише не видалені дані
- `getCashFlowComparison(userId, period, compareTo)` - враховує лише не видалені дані

## Міграція бази даних

### Файли міграції:

- **`soft-delete-migration.sql`** - SQL скрипт міграції
- **`run-soft-delete-migration.ts`** - TypeScript скрипт для запуску міграції

### Запуск міграції:

```bash
npx tsx run-soft-delete-migration.ts
```

### Що робить міграція:

1. Додає колонку `deleted_at TIMESTAMP` до таблиць:
   - `projects`
   - `tasks`
   - `invoices`
   - `file_attachments`

2. Створює індекси для покращення продуктивності:
   - `idx_projects_deleted_at`
   - `idx_tasks_deleted_at`
   - `idx_invoices_deleted_at`
   - `idx_file_attachments_deleted_at`

## Як працює Soft Delete

### Видалення запису

Коли користувач видаляє запис, замість `DELETE` виконується `UPDATE`:

```typescript
// Замість цього (hard delete):
await db.delete(projects).where(eq(projects.id, projectId));

// Тепер робиться так (soft delete):
await db
  .update(projects)
  .set({ deletedAt: new Date() })
  .where(eq(projects.id, projectId));
```

### Отримання записів

При отриманні записів автоматично фільтруються видалені:

```typescript
// Отримати лише не видалені проекти
const projects = await db
  .select()
  .from(projects)
  .where(and(
    eq(projects.userId, userId),
    isNull(projects.deletedAt)  // <- фільтр видалених
  ));
```

### Відновлення запису

Видалений запис можна відновити, встановивши `deletedAt` в `null`:

```typescript
await db
  .update(projects)
  .set({ deletedAt: null })
  .where(eq(projects.id, projectId));
```

## Переваги реалізації

1. **Безпека даних** - дані не втрачаються назавжди
2. **Можливість відновлення** - видалені записи можна відновити
3. **Аудит** - можна відстежувати, коли і які записи були видалені
4. **Цілісність даних** - збережено зв'язки між записами
5. **Продуктивність** - індекси на `deleted_at` забезпечують швидкі запити

## API Endpoints (потребують оновлення)

Існуючі API endpoints автоматично використовують soft delete, оскільки вони викликають оновлені storage методи:

- `DELETE /api/projects/[id]` - soft delete проекту
- `DELETE /api/tasks/[id]` - soft delete завдання
- `DELETE /api/invoices/[id]` - soft delete інвойсу
- `DELETE /api/files/[id]` - soft delete файлу

## Наступні кроки (опціонально)

Можливі додаткові покращення:

1. **API для відновлення** - додати endpoints типу:
   - `POST /api/projects/[id]/restore`
   - `POST /api/tasks/[id]/restore`
   - `POST /api/invoices/[id]/restore`
   - `POST /api/files/[id]/restore`

2. **Перегляд видалених** - додати endpoints для перегляду видалених записів:
   - `GET /api/projects/deleted`
   - `GET /api/tasks/deleted`
   - і т.д.

3. **Автоматичне очищення** - додати cron job для автоматичного видалення записів, які були видалені більше N днів тому (наприклад, 30 днів)

4. **UI для відновлення** - додати інтерфейс для перегляду та відновлення видалених записів

## Приклад використання

### TypeScript/JavaScript

```typescript
import { storage } from './server/storage';

// Видалити проект (soft delete)
await storage.deleteProject(projectId);

// Отримати всі проекти (автоматично фільтруються видалені)
const projects = await storage.getUserProjects(userId);

// Відновити видалений проект
await storage.restoreProject(projectId);
```

## Технічні деталі

- **ORM**: Drizzle ORM
- **База даних**: PostgreSQL
- **Тип поля**: `TIMESTAMP` (nullable)
- **Індекси**: Створені для всіх колонок `deleted_at` для покращення продуктивності запитів

## Тестування

Після реалізації рекомендується протестувати:

1. Видалення проектів, тасків, інвойсів, файлів
2. Перевірити, що видалені записи не з'являються в списках
3. Перевірити, що відновлені записи знову з'являються
4. Перевірити роботу аналітики (вона не повинна враховувати видалені записи)
5. Перевірити роботу каскадних запитів (наприклад, отримання тасків проекту)

## Підтримка

Якщо виникають питання або проблеми з реалізацією soft delete, перевірте:

1. Чи була виконана міграція успішно
2. Чи оновлені всі необхідні методи в storage layer
3. Чи правильно використовується фільтр `isNull(deletedAt)` у всіх GET запитах
