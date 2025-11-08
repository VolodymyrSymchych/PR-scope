# 🗄️ How to View Your Database

You're using **Neon PostgreSQL**. Here are several ways to view and manage your database:

---

## 🌐 Option 1: Neon Console (Easiest - Web Interface)

**Best for:** Quick viewing, running queries, no installation needed

### Steps:

1. **Go to Neon Dashboard:**
   - Visit: https://console.neon.tech
   - Sign in with your account

2. **Select Your Project:**
   - Click on your project (should be the one with `ep-blue-sunset-abla90wi`)

3. **Open SQL Editor:**
   - Click on **"SQL Editor"** in the left sidebar
   - Or go to: https://console.neon.tech/app/projects/[your-project-id]/sql

4. **Run Queries:**
   ```sql
   -- View all tables
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';

   -- View all users
   SELECT id, email, username, full_name, created_at 
   FROM users;

   -- View all projects
   SELECT id, name, user_id, created_at 
   FROM projects;

   -- View all tasks
   SELECT id, title, status, assignee, due_date 
   FROM tasks;

   -- View friendships
   SELECT id, user_id, friend_id, status, created_at 
   FROM friendships;
   ```

**Pros:**
- ✅ No installation needed
- ✅ Web-based, works anywhere
- ✅ Built-in query editor
- ✅ Visual table browser
- ✅ Free

---

## 💻 Option 2: VS Code Extension (Recommended for Development)

**Best for:** Developers using VS Code

### Steps:

1. **Install Extension:**
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X / Ctrl+Shift+X)
   - Search for: **"PostgreSQL"** by Chris Kolkman
   - Or: **"Database Client"** by Weijan Chen
   - Install it

2. **Connect to Database:**
   - Click the database icon in the sidebar
   - Click **"Add Connection"**
   - Select **PostgreSQL**
   - Enter connection details:
     ```
     Host: ep-blue-sunset-abla90wi-pooler.eu-west-2.aws.neon.tech
     Port: 5432
     Database: neondb
     Username: neondb_owner
     Password: npg_fNrEs4JTxjR9
     SSL: Required
     ```
   - Click **Connect**

3. **Browse Tables:**
   - Expand your connection
   - Browse tables, views, and data
   - Right-click tables to view data

**Pros:**
- ✅ Integrated with your editor
- ✅ Run queries directly
- ✅ View/edit data easily
- ✅ Free

---

## 🖥️ Option 3: Command Line (psql)

**Best for:** Quick queries, automation, terminal users

### Steps:

1. **Install PostgreSQL Client:**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql

   # Or use Neon's connection string directly
   ```

2. **Connect:**
   ```bash
   psql 'postgresql://neondb_owner:npg_fNrEs4JTxjR9@ep-blue-sunset-abla90wi-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require'
   ```

3. **Run Queries:**
   ```sql
   -- List all tables
   \dt

   -- View users table
   SELECT * FROM users;

   -- View projects
   SELECT * FROM projects;

   -- Exit
   \q
   ```

**Useful psql Commands:**
- `\dt` - List all tables
- `\d table_name` - Describe table structure
- `\l` - List all databases
- `\c database_name` - Connect to database
- `\q` - Quit

---

## 🎨 Option 4: Database GUI Tools

### A. TablePlus (macOS/Windows/Linux)

**Best for:** Beautiful UI, easy to use

1. **Download:** https://tableplus.com
2. **Create Connection:**
   - Click **"Create a new connection"**
   - Select **PostgreSQL**
   - Enter:
     ```
     Name: Neon Database
     Host: ep-blue-sunset-abla90wi-pooler.eu-west-2.aws.neon.tech
     Port: 5432
     User: neondb_owner
     Password: npg_fNrEs4JTxjR9
     Database: neondb
     SSL Mode: Require
     ```
   - Click **Test** then **Save**

**Pros:**
- ✅ Beautiful interface
- ✅ Easy to use
- ✅ Free tier available
- ✅ Works on all platforms

---

### B. DBeaver (Free, Open Source)

**Best for:** Free, powerful, cross-platform

1. **Download:** https://dbeaver.io/download/
2. **Create Connection:**
   - Click **"New Database Connection"**
   - Select **PostgreSQL**
   - Enter connection details
   - Test connection

**Pros:**
- ✅ Completely free
- ✅ Very powerful
- ✅ Works on all platforms
- ✅ Many features

---

### C. pgAdmin (Official PostgreSQL Tool)

**Best for:** Full-featured, official tool

1. **Download:** https://www.pgadmin.org/download/
2. **Create Server:**
   - Right-click **Servers** → **Create** → **Server**
   - Enter connection details

**Pros:**
- ✅ Official PostgreSQL tool
- ✅ Very comprehensive
- ✅ Free and open source

---

## 📊 Quick Database Queries

### View All Data:

```sql
-- Users
SELECT * FROM users ORDER BY created_at DESC;

-- Projects
SELECT p.*, u.email as owner_email 
FROM projects p 
JOIN users u ON p.user_id = u.id 
ORDER BY p.created_at DESC;

-- Tasks
SELECT t.*, p.name as project_name 
FROM tasks t 
LEFT JOIN projects p ON t.project_id = p.id 
ORDER BY t.created_at DESC;

-- Friendships
SELECT 
  f.*,
  u1.email as user_email,
  u2.email as friend_email
FROM friendships f
JOIN users u1 ON f.user_id = u1.id
JOIN users u2 ON f.friend_id = u2.id
ORDER BY f.created_at DESC;

-- Notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50;
```

### Count Records:

```sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM tasks) as total_tasks,
  (SELECT COUNT(*) FROM friendships WHERE status = 'accepted') as total_friendships;
```

### View Table Structure:

```sql
-- Get column info for a table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

---

## 🔐 Connection String

Your connection string:
```
postgresql://neondb_owner:npg_fNrEs4JTxjR9@ep-blue-sunset-abla90wi-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
```

**Connection Details:**
- **Host:** `ep-blue-sunset-abla90wi-pooler.eu-west-2.aws.neon.tech`
- **Port:** `5432`
- **Database:** `neondb`
- **Username:** `neondb_owner`
- **Password:** `npg_fNrEs4JTxjR9`
- **SSL:** Required

---

## 🎯 Recommended Approach

**For Quick Viewing:** Use **Neon Console** (Option 1)  
**For Development:** Use **VS Code Extension** (Option 2)  
**For Advanced Users:** Use **TablePlus** or **DBeaver** (Option 4)

---

## 🆘 Troubleshooting

### Connection Issues:

1. **SSL Required:**
   - Make sure SSL mode is set to **"Require"** or **"Required"**

2. **Connection Timeout:**
   - Check if you're using the **pooler** endpoint (has `-pooler` in the hostname)
   - Try the direct endpoint from Neon dashboard

3. **Authentication Failed:**
   - Double-check username and password
   - Get fresh credentials from Neon dashboard if needed

---

**Start with Neon Console - it's the easiest! 🚀**

