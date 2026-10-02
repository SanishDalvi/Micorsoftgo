import dotenv from 'dotenv';
import type { MasterStoreData, LearnPlan, GuideStep } from '../src/types.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

/**
 * Lightweight REST-based Supabase helper (zero additional large npm dependency required)
 */
async function supabaseFetch<T>(endpoint: string, options: RequestInit = {}): Promise<SupabaseResponse<T>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: { message: 'Supabase is not configured' } };
  }

  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${endpoint.replace(/^\/+/, '')}`;
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errText = await res.text();
      return { data: null, error: { message: `Supabase HTTP ${res.status}: ${errText}` } };
    }
    const data = await res.json() as T;
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err?.message || 'Supabase network error' } };
  }
}

/**
 * Sync entire store to Supabase if configured
 */
export async function syncStoreToSupabase(store: MasterStoreData): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    // 1. Sync Plans
    for (const plan of store.plans) {
      await supabaseFetch('mlsa_plans', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: plan.id,
          title: plan.title,
          description: plan.description,
          category: plan.category,
          badge_title: plan.badgeTitle,
          ms_learn_link: plan.msLearnLink,
          estimated_hours: plan.estimatedHours,
          module_count: plan.moduleCount,
          order_index: plan.orderIndex,
          color_accent: plan.colorAccent,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    // 2. Sync Guide Steps
    if (store.guideSteps && store.guideSteps.length > 0) {
      for (const step of store.guideSteps) {
        await supabaseFetch('mlsa_guide_steps', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: step.id,
            step_number: step.stepNumber,
            title: step.title,
            badge: step.badge,
            description: step.description,
            images: step.images || [],
            image_url: step.imageUrl || null,
            tip: step.tip || null,
            action_text: step.actionText || null,
            action_link: step.actionLink || null,
            order_index: step.stepNumber,
            updated_at: new Date().toISOString(),
          }),
        });
      }
    }

    // 3. Sync Students
    for (const student of Object.values(store.students)) {
      await supabaseFetch('mlsa_students', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          email: student.email,
          full_name: student.fullName,
          password: student.password || 'pass123',
          learn_user_id: student.learnUserId || null,
          student_id: student.studentId || null,
          college: student.college || '',
          completed_plan_ids: student.completedPlanIds || [],
          invite_code: student.inviteCode || null,
          referrals_count: student.referralsCount || 0,
          referred_by: student.referredBy || null,
          referred_students: student.referredStudents || [],
          registered_at: student.registeredAt || new Date().toISOString(),
          last_updated: student.lastUpdated || new Date().toISOString(),
        }),
      });
    }

    return true;
  } catch (err) {
    console.error('Failed to sync store to Supabase:', err);
    return false;
  }
}
