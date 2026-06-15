# HOMS Phase 1 — Setup Guide
## Kayla City ApartHotel

---

## Step 1: Supabase — Run the Schema

1. Go to **supabase.com → Your Project → SQL Editor**
2. Open the file `supabase/schema.sql`
3. Paste the entire contents and click **Run**
4. You should see no errors

---

## Step 2: Supabase — Add the Service Role Key

The owner needs to create staff accounts. This requires the **service_role** key (never expose this publicly).

1. Go to **Supabase → Project Settings → API**
2. Copy the `service_role` key (the secret one, NOT the anon key)
3. Open `.env.local` and replace `your_service_role_key_here` with it

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_actual_key
```

---

## Step 3: Create the Owner Account

1. Go to **Supabase → Authentication → Users → Add User**
2. Use:
   - **Email:** `owner@kaylacity.com`
   - **Password:** `KaylaOwner2025!`
   - Check **"Auto Confirm User"**
3. After creating, click the user and copy their **UUID**
4. Go back to **SQL Editor** and run:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('PASTE_UUID_HERE', 'owner');
```

---

## Step 4: Run the App

```bash
npm run dev
```

Visit: http://localhost:3000/login

Login with:
- Email: `owner@kaylacity.com`
- Password: `KaylaOwner2025!`

You'll be redirected to the Owner Dashboard automatically.

---

## Step 5: Create Your First Staff Member

1. In the dashboard, click **Staff Accounts** in the sidebar
2. Click **Add Staff**
3. Fill in name, email, password, and role
4. Click **Create Account**

The staff member can now log in and will be directed to their role-specific dashboard.

---

## What's Built in Phase 1

| Feature | Status |
|---|---|
| Login / Logout | ✅ |
| Password Reset | ✅ |
| Role-Based Auth (5 roles) | ✅ |
| Route Protection (middleware) | ✅ |
| Owner Dashboard | ✅ |
| Staff Accounts Management | ✅ |
| Create Staff | ✅ |
| Deactivate / Reactivate Staff | ✅ |
| Account Status Check on Login | ✅ |
| Role-Aware Sidebar & Navigation | ✅ |
| Manager Dashboard (shell) | ✅ |
| Staff Dashboards (shell) | ✅ |

---

## Phase 2 Will Add

- Rooms Management
- Guests & Reservations
- Reports Module
- Consumption Tracking
- Maintenance Requests
- Notifications

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add all `.env.local` values as **Environment Variables** in Vercel dashboard.

---

## Troubleshooting

**"Failed to create staff" error:**
- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Restart the dev server after adding it

**Redirected to /unauthorized:**
- The owner UUID wasn't inserted into `user_roles`
- Re-run the INSERT from Step 3

**Profile not loading:**
- The trigger `on_auth_user_created` auto-creates profiles
- Check that you ran the full `schema.sql`
