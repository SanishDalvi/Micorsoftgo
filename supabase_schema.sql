-- ==============================================================================
-- MLSA Gamified Learning Platform & Secret Vault
-- Complete Supabase PostgreSQL Schema & Seed Migration
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Plans Table
CREATE TABLE IF NOT EXISTS public.mlsa_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    badge_title TEXT NOT NULL,
    ms_learn_link TEXT NOT NULL,
    estimated_hours TEXT NOT NULL,
    module_count INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 1,
    color_accent TEXT NOT NULL DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS public.mlsa_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL DEFAULT 'pass123',
    learn_user_id TEXT,
    student_id TEXT,
    college TEXT DEFAULT 'College Name',
    completed_plan_ids JSONB DEFAULT '[]'::jsonb,
    invite_code TEXT UNIQUE,
    referrals_count INTEGER DEFAULT 0,
    referred_by TEXT,
    referred_students JSONB DEFAULT '[]'::jsonb,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    temp_password TEXT,
    temp_password_expires_at BIGINT
);

-- Index on search fields
CREATE INDEX IF NOT EXISTS idx_mlsa_students_email ON public.mlsa_students (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_mlsa_students_learn_id ON public.mlsa_students (LOWER(learn_user_id));
CREATE INDEX IF NOT EXISTS idx_mlsa_students_invite_code ON public.mlsa_students (UPPER(invite_code));

-- 4. Create Vault Configuration Table
CREATE TABLE IF NOT EXISTS public.mlsa_vault (
    id TEXT PRIMARY KEY DEFAULT 'default_vault',
    github_repo_url TEXT NOT NULL,
    youtube_tutorial_url TEXT NOT NULL,
    secret_access_token TEXT NOT NULL,
    unlock_instructions TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Guide Steps Table
CREATE TABLE IF NOT EXISTS public.mlsa_guide_steps (
    id TEXT PRIMARY KEY,
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    badge TEXT NOT NULL,
    description TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    tip TEXT,
    action_text TEXT,
    action_link TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Email Dispatches Log Table
CREATE TABLE IF NOT EXISTS public.mlsa_email_dispatches (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    student_name TEXT,
    subject TEXT NOT NULL,
    temp_password TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security (RLS) Setup
ALTER TABLE public.mlsa_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlsa_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlsa_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlsa_guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlsa_email_dispatches ENABLE ROW LEVEL SECURITY;

-- Allow public read access to plans, guide steps, and basic queries
CREATE POLICY "Public Read Plans" ON public.mlsa_plans FOR SELECT USING (true);
CREATE POLICY "Public Read Guide Steps" ON public.mlsa_guide_steps FOR SELECT USING (true);
CREATE POLICY "Public Read Vault Info" ON public.mlsa_vault FOR SELECT USING (true);
CREATE POLICY "Public Students Access" ON public.mlsa_students FOR ALL USING (true);
CREATE POLICY "Public Dispatches Access" ON public.mlsa_email_dispatches FOR ALL USING (true);

-- 8. Seed Default Active Curriculum Tracks (AI & Agents, Git & GitHub, IoT, Python)
INSERT INTO public.mlsa_plans (id, title, description, category, badge_title, ms_learn_link, estimated_hours, module_count, order_index, color_accent)
VALUES
  (
    'plan-ai-agents-vibe-coding',
    'AI, Agents and Vibe Coding',
    'Build intelligent autonomous agents, leverage modern AI frameworks, prompt engineering, and master vibe coding workflows.',
    'Generative AI & Agents',
    'AI Agent Architect',
    'https://learn.microsoft.com/en-us/plans/zwyzadt7p0jo34?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    '4.0 hrs',
    5,
    1,
    'purple'
  ),
  (
    'plan-git-and-github',
    'Git and GitHub Developer Mastery',
    'Master distributed version control, branches, pull requests, collaborative open-source workflows, and GitHub automation.',
    'DevOps & Tooling',
    'Git Systems Builder',
    'https://learn.microsoft.com/en-us/plans/508ktqt08p6y2p?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    '3.5 hrs',
    4,
    2,
    'green'
  ),
  (
    'plan-iot',
    'Internet of Things (IoT) Fundamentals',
    'Connect smart devices, telemetry sensors, Azure IoT Hub, edge computing architectures, and real-time data pipelines.',
    'IoT & Embedded Systems',
    'IoT Cloud Explorer',
    'https://learn.microsoft.com/en-us/plans/qr3ntqtkprpep1?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    '4.5 hrs',
    5,
    3,
    'blue'
  ),
  (
    'plan-python',
    'Python Programming & Automation',
    'Master Python programming fundamentals, modern data structures, object-oriented concepts, and practical automation scripts.',
    'Core Programming',
    'Python Craftsman',
    'https://learn.microsoft.com/en-us/plans/8w73azt4mjmwx5?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    '5.0 hrs',
    6,
    4,
    'yellow'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  badge_title = EXCLUDED.badge_title,
  ms_learn_link = EXCLUDED.ms_learn_link,
  estimated_hours = EXCLUDED.estimated_hours,
  module_count = EXCLUDED.module_count,
  order_index = EXCLUDED.order_index,
  color_accent = EXCLUDED.color_accent;

-- 9. Seed Default Vault Configuration
INSERT INTO public.mlsa_vault (id, github_repo_url, youtube_tutorial_url, secret_access_token, unlock_instructions)
VALUES (
  'default_vault',
  'https://github.com/tashfeenahmed/freellmapi',
  'https://youtu.be/lVauGVmaYhA',
  'MLSC-7B-CLAUDE-ACCESS-TOKEN-KEY-8942-VERIFIED',
  'Congratulations Fellowship Keyholder! You have verified 100% completion of all designated Microsoft Learn tracks. Use your secret access token to clone the high-compute model codebase and watch the deployment tutorial below.'
)
ON CONFLICT (id) DO UPDATE SET
  github_repo_url = EXCLUDED.github_repo_url,
  youtube_tutorial_url = EXCLUDED.youtube_tutorial_url;

-- 10. Seed Guide Steps (Sign In, User ID Link, Complete Module, Know If Completed, Vault Decryption)
INSERT INTO public.mlsa_guide_steps (id, step_number, title, badge, description, images, tip, action_text, action_link, order_index)
VALUES
  (
    'step-1',
    1,
    'Sign In to Microsoft Learn & Copy Your User ID',
    'Step 1 · Account & ID',
    'Visit learn.microsoft.com and sign in with your personal or student Microsoft account. Click your profile avatar in the upper-right corner and select "Profile". On your profile page, look under your display name or copy the username from the URL (e.g., learn.microsoft.com/en-us/users/your-learn-id/). This unique User ID is how completions are recorded in challenge leaderboards.',
    '["https://ik.imagekit.io/mlsa_community/guide/step1-ms-learn-profile.png", "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"]'::jsonb,
    'Always make sure you copy the exact Learn User ID (username) rather than just an email address, as Microsoft challenge exports match by User ID.',
    'Open Microsoft Learn Profile',
    'https://learn.microsoft.com/en-us/users/',
    1
  ),
  (
    'step-2',
    2,
    'Register & Link Your Learn User ID on This Platform',
    'Step 2 · Campus Linking',
    'On our platform, click "Student Sign In" or "Register New Student". Enter your campus email and paste your Microsoft Learn User ID. This permanently links your campus account to the MLSA chapter challenge tracking roster.',
    '["https://ik.imagekit.io/mlsa_community/guide/step2-platform-link.png", "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"]'::jsonb,
    'Once linked, you can log in anytime using either your email or your Microsoft Learn username.',
    'Student Portal Sign In',
    '#signin',
    2
  ),
  (
    'step-3',
    3,
    'Launch & Complete Learning Plans & Modules',
    'Step 3 · Curriculum',
    'On your Dashboard, explore the 4 active tracks: (1) AI, Agents & Vibe Coding, (2) Git & GitHub Developer Mastery, (3) IoT Fundamentals, and (4) Python Programming. Click "Launch" on any track card to open the official Microsoft Learn study plan. Sign into Learn, click "Start", and complete all modules, hands-on units, and knowledge check quizzes.',
    '["https://ik.imagekit.io/mlsa_community/guide/step3-module-launch.png", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop"]'::jsonb,
    'Stay logged into Microsoft Learn while completing exercises so all XP, badges, and unit checkmarks are saved to your profile.',
    'Browse Microsoft Learn Plans',
    'https://learn.microsoft.com/en-us/training/',
    3
  ),
  (
    'step-4',
    4,
    'How to Know If a Module is 100% Completed',
    'Step 4 · Verification Checklist',
    'To verify a module/plan is complete: (1) Check that all unit rows display a solid green checkmark; (2) The progress bar on Microsoft Learn indicates 100% (or "Completed"); (3) A completion badge/trophy is unlocked on your Learn Profile under Achievements; and (4) When chapter coordinators sync the challenge CSV, your dashboard card turns to "Verified".',
    '["https://ik.imagekit.io/mlsa_community/guide/step4-module-completed-check.png", "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop"]'::jsonb,
    'If a module is stuck at 90%, check if there is an unsubmitted knowledge check quiz or an unviewed summary page at the end of the module.',
    'Check Your Learn Achievements',
    'https://learn.microsoft.com/en-us/users/me/achievements',
    4
  ),
  (
    'step-5',
    5,
    'Roster Sync & Decrypt the Secret Vault',
    'Step 5 · Vault Decryption',
    'Completions are synced into the platform database via the coordinator challenge roster. Once all 4 designated curriculum tracks are verified OR you refer 7 peer students with your personal invite link, the Secret Vault enclaves decrypt instantly, granting you full access to the private 7B Claude Sandbox repository and masterclass tutorial.',
    '["https://ik.imagekit.io/mlsa_community/guide/step5-vault-unlocked.png", "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop"]'::jsonb,
    'Dual Keyholder rule: You can unlock either by completing all 4 modules (100%) or by achieving 7 successful student referrals.',
    NULL,
    NULL,
    5
  )
ON CONFLICT (id) DO UPDATE SET
  step_number = EXCLUDED.step_number,
  title = EXCLUDED.title,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  images = EXCLUDED.images,
  tip = EXCLUDED.tip,
  action_text = EXCLUDED.action_text,
  action_link = EXCLUDED.action_link,
  order_index = EXCLUDED.order_index;
