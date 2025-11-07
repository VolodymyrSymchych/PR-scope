# 🔧 Vercel Environment Variables Setup Guide

## ⚠️ Important: After Adding Environment Variables

**You MUST redeploy for changes to take effect!**

Environment variables are only loaded when a deployment starts. Adding them doesn't automatically update running deployments.

---

## ✅ Step-by-Step Setup

### 1. Add Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables for **ALL environments** (Production, Preview, Development):

- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `JWT_SECRET` - A secure random string (min 32 characters)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with `pk_test_` or `pk_live_`)
- `NEXT_PUBLIC_BASE_URL` - Your Vercel app URL (e.g., `https://pr-scope.vercel.app`)

**⚠️ Important Notes:**
- **NO spaces** around the `=` sign when adding in Vercel
- **NO quotes** around values
- Select **ALL environments** (Production, Preview, Development)
- Click **Save** after each variable

### 2. Redeploy Your Application

**Option A: Via Dashboard (Recommended)**
1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Click **Redeploy**
4. Make sure **"Use existing Build Cache"** is **UNCHECKED**
5. Click **Redeploy**

**Option B: Via CLI**
```bash
vercel --prod
```

**Option C: Trigger New Deployment**
- Push a new commit to GitHub (even a small change)
- Vercel will auto-deploy with new environment variables

### 3. Verify Environment Variables

After redeploy, check the deployment logs:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check **Build Logs** - you should see the build succeed
4. Check **Runtime Logs** - no errors about missing keys

---

## 🔍 Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"

**Most Common Cause: Not Redeployed After Adding Variables**

✅ **Solution:** You MUST redeploy after adding environment variables!

**Other Possible Causes:**

1. **Variables Not Added to Correct Environment**
   - ✅ Solution: Make sure you selected **Production, Preview, AND Development**

2. **Typo in Variable Name**
   - ✅ Check: `STRIPE_SECRET_KEY` (not `STRIPE_SECRET` or `STRIPE_KEY`)
   - ✅ Check: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (exact spelling)

3. **Spaces or Quotes in Value**
   - ❌ Wrong: `STRIPE_SECRET_KEY = "sk_test_..."`
   - ❌ Wrong: `STRIPE_SECRET_KEY = sk_test_...` (space before =)
   - ✅ Correct: `STRIPE_SECRET_KEY=sk_test_...`

4. **Variables Added to Wrong Project**
   - ✅ Solution: Double-check you're in the correct project

### Verify Variables Are Set

You can create a temporary test route to verify:

```typescript
// dashboard/app/api/test-env/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    // Don't expose actual values!
  });
}
```

Visit: `https://pr-scope.vercel.app/api/test-env`

**⚠️ Remember to delete this route after testing!**

---

## 📋 Quick Checklist

- [ ] Added all 5 environment variables
- [ ] Selected ALL environments (Production, Preview, Development)
- [ ] No spaces around `=` sign
- [ ] No quotes around values
- [ ] Clicked **Save** for each variable
- [ ] **Redeployed** the application (IMPORTANT!)
- [ ] Checked deployment logs for success
- [ ] Tested the app - no "not set" errors

---

## 🚀 After Successful Setup

Once environment variables are working:
1. Remove the test route (`/api/test-env`) if you created it
2. Test payment flow
3. Test authentication
4. Monitor logs for any issues

---

**Most Common Issue:** Forgetting to redeploy after adding variables! ⚠️

**If you still get "STRIPE_SECRET_KEY is not set" after redeploying:**
1. Double-check the variable name is exactly `STRIPE_SECRET_KEY`
2. Make sure it's added to Production environment
3. Try redeploying again with build cache disabled
