# 🎓 MLSA Gamified Learning Platform & Secret Vault

A state-of-the-art gamified learning platform and restricted vault portal for the **Microsoft Learn Student Ambassador (MLSA)** community. Students track their progress through official Microsoft Learn curriculum tracks, compete on live chapter leaderboards, invite peers, and decrypt an exclusive high-compute repository enclave upon completing designated milestones.

---

## 🚀 Active Curriculum Tracks

| # | Track Name | Category | Microsoft Learn Plan Link |
|---|---|---|---|
| 1 | **AI, Agents and Vibe Coding** | Generative AI & Agents | [Launch Plan](https://learn.microsoft.com/en-us/plans/zwyzadt7p0jo34?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757) |
| 2 | **Git and GitHub Developer Mastery** | DevOps & Tooling | [Launch Plan](https://learn.microsoft.com/en-us/plans/508ktqt08p6y2p?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757) |
| 3 | **Internet of Things (IoT) Fundamentals** | IoT & Connected Systems | [Launch Plan](https://learn.microsoft.com/en-us/plans/qr3ntqtkprpep1?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757) |
| 4 | **Python Programming & Automation** | Core Programming | [Launch Plan](https://learn.microsoft.com/en-us/plans/8w73azt4mjmwx5?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757) |

---

## 📖 Official Visual Guide (How to Sign In, Complete & Verify Modules)

The built-in modal and login page guide walks students through 5 steps with screenshot slots:

1. **Step 1: Sign In & Copy Microsoft Learn User ID**
   - Go to [learn.microsoft.com](https://learn.microsoft.com/en-us/users/) and sign in with your student or personal Microsoft account.
   - Click avatar > **Profile** and copy your unique **Learn User ID** (username in URL).
2. **Step 2: Link Your Learn User ID on the Campus Platform**
   - Open **Student Sign In** or **Register**, paste your Learn User ID, and link your campus profile.
3. **Step 3: Launch & Complete Official Learning Plans**
   - Click **Launch** on any track to join the study plan on Microsoft Learn.
   - Complete interactive modules, sandboxes, and knowledge check quizzes.
4. **Step 4: How to Know If a Module is 100% Completed**
   - All unit items display a **solid green checkmark**.
   - Progress bar indicates **100% Completed** with XP awarded.
   - Achievement badge appears in your profile under **Achievements**.
   - When the coordinator syncs the roster CSV, your card turns to **Verified**.
5. **Step 5: Roster Sync, Referral Keys & Secret Vault Decryption**
   - Decrypt the Secret Vault by either completing all 4 modules (100%) **OR** referring 7 peers with your invite link!

---

## 📸 ImageKit Integration (Screenshot URLs)

You can easily host and link your guide screenshots using **ImageKit**:

1. Log into your [ImageKit Dashboard](https://imagekit.io).
2. Upload your screenshots into a folder named `guide/` (e.g. `step1-ms-learn-profile.png`, `step2-platform-link.png`, `step3-module-launch.png`, `step4-module-completed-check.png`, `step5-vault-unlocked.png`).
3. In `.env` or Vercel Environment Variables, set:
   ```env
   VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
   ```
4. You can also customize image URLs directly via the **Coordinator Admin Console** at `/admin` under the **Official Guide** tab or in `data/store.json`.

---

## 🗄️ Supabase Backend Integration (Optional & Production Ready)

The application supports dual data storage:
- **Local / Ephemeral (Default)**: Uses `data/store.json` and memory caching with CSV hot-reloading.
- **Supabase Cloud PostgreSQL (Recommended for Vercel)**:
  1. Create a project at [supabase.com](https://supabase.com).
  2. Open the **SQL Editor** in Supabase and run the provided script [`supabase_schema.sql`](file:///d:/mlsa-gamified-learning-platform-&-secret-vault%20%281%29/supabase_schema.sql).
  3. Add the following environment variables to your `.env` or Vercel project:
     ```env
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=your-supabase-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
     ```

---

## 🚀 Deploying to Vercel

1. Push your project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MLSA Gamified Learning Platform"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"** > **Import Git Repository**.
3. Vercel automatically detects the configuration from [`vercel.json`](file:///d:/mlsa-gamified-learning-platform-&-secret-vault%20%281%29/vercel.json).
4. In **Project Settings > Environment Variables**, add your desired environment variables:
   - `ADMIN_PASSCODE` (Set your custom secure coordinator passcode)
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY` (if using Supabase)
   - `VITE_IMAGEKIT_URL_ENDPOINT` (if using ImageKit)
5. Click **Deploy**. Your frontend SPA and serverless API functions (`/api/*`) are live instantly!

---

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Copy environment configuration:**
   ```bash
   cp .env.example .env
   ```
3. **Run development server:**
   ```bash
   npm run dev
   ```
4. **Open in browser:**
   - Student Dashboard: [http://localhost:3000](http://localhost:3000)
   - Admin Console: [http://localhost:3000/admin](http://localhost:3000/admin)
