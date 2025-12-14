# 🚀 MVP SaaS Starter Kit

> **Launch your startup in days, not months.**
> The ultimate boilerplate to build modern, secure, and scalable SaaS applications. Save +40 hours of boring setup.

## ⚡ Key Features

This isn't just code; it's a business architecture ready to deploy:

- **⚛️ Next.js 15 (App Router):** The latest and most powerful React framework version.
- **🛡️ Complete Auth:** Login, Sign Up, and Session Management powered by **Supabase Auth**.
- **💳 Integrated Payments:** Pre-configured payment gateway with **Stripe Checkout**.
- **🔒 Secure Database:** PostgreSQL with **Supabase** and robust RLS (Row Level Security) policies.
- **🎨 Modern UI:** Styled with **Tailwind CSS** and fully responsive components.
- **👮 Middleware:** Automatic protection for private routes (`/dashboard`).
- **☁️ Production Ready:** Optimized configuration for seamless deployment on **Vercel**.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15, React, Tailwind CSS, TypeScript.
* **Backend / DB:** Supabase (Auth & Postgres).
* **Payments:** Stripe.
* **Deploy:** Vercel.

---

## 🚀 Quick Start Guide

Follow these steps to get your app running locally in under 5 minutes.

### 1. Clone the repository
```
git clone [https://github.com/YOUR_USERNAME/mvp-launcher-kit.git](https://github.com/YOUR_USERNAME/mvp-launcher-kit.git)
cd mvp-launcher-kit
```

2. Install dependencies
```
npm install
```

3. Configure Environment Variables
Rename the .env.example file to .env.local and add your keys:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```


4. Setup Database (Supabase)
Go to the SQL Editor in your Supabase dashboard and run this script to create the demo table:
```
-- Create notes table
create table notes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  user_id uuid references auth.users not null default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table notes enable row level security;

-- Policy: Users can only see their own notes
create policy "View own notes" on notes for select using ((select auth.uid()) = user_id);

-- Policy: Users can only insert their own notes
create policy "Insert own notes" on notes for insert with check ((select auth.uid()) = user_id);
```
5. Setup Stripe

    .Create a product in your Stripe Dashboard and copy the API ID (e.g., price_1Pxyz...).
    
    .Open src/app/api/checkout/route.ts and replace the placeholder ID in the price: "..." line with your real ID.

7. Run the server
```
npm run dev
```
Open http://localhost:3000 to see your app in action!

📂 Project Structure
The codebase is organized for scalability and ease of use:
```
src/
├── app/
│   ├── (auth)/      # Public routes (Login/Signup)
│   ├── (dashboard)/ # Protected routes (User Panel)
│   ├── api/         # Webhooks & Stripe Endpoints
│   └── page.tsx     # Landing Page
├── components/      # Reusable UI components
├── libs/            # Supabase & Stripe configuration
└── types/           # TypeScript definitions
```

🚢 Deployment

The easiest way to publish your app is with Vercel:

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Add the Environment Variables (same as step 3).
4. Click Deploy.
5. Important: Update NEXT_PUBLIC_BASE_URL in Vercel and the Site URL in Supabase Auth with your new production domain.

🤝 Contribution & Support
If you find a bug or have a feature request, feel free to open an Issue or Pull Request.

Created with ❤️ by Midnarr
