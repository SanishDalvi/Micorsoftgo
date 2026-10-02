import dotenv from 'dotenv';
import type { MasterStoreData, LearnPlan, GuideStep, StudentProgress, SecretRewardPayload } from '../src/types.js';

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
export async function supabaseFetch<T>(endpoint: string, options: RequestInit = {}): Promise<SupabaseResponse<T>> {
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
 * Fetch entire store state from Supabase Cloud PostgreSQL
 */
export async function fetchStoreFromSupabase(): Promise<Partial<MasterStoreData> | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const [plansRes, stepsRes, studentsRes, vaultRes] = await Promise.all([
      supabaseFetch<any[]>('mlsa_plans?select=*&order=order_index.asc'),
      supabaseFetch<any[]>('mlsa_guide_steps?select=*&order=step_number.asc'),
      supabaseFetch<any[]>('mlsa_students?select=*'),
      supabaseFetch<any[]>('mlsa_vault?select=*&limit=1'),
    ]);

    const partialStore: Partial<MasterStoreData> = {};

    if (plansRes.data && plansRes.data.length > 0) {
      partialStore.plans = plansRes.data.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        badgeTitle: p.badge_title,
        msLearnLink: p.ms_learn_link,
        estimatedHours: p.estimated_hours,
        moduleCount: p.module_count || 1,
        orderIndex: p.order_index || 1,
        colorAccent: p.color_accent || 'blue',
      }));
    }

    if (stepsRes.data && stepsRes.data.length > 0) {
      partialStore.guideSteps = stepsRes.data.map((s) => ({
        id: s.id,
        stepNumber: s.step_number,
        title: s.title,
        badge: s.badge,
        description: s.description,
        images: Array.isArray(s.images) && s.images.length > 0 ? s.images : (s.image_url ? [s.image_url] : []),
        imageUrl: s.image_url || undefined,
        tip: s.tip || undefined,
        actionText: s.action_text || undefined,
        actionLink: s.action_link || undefined,
      }));
    }

    if (studentsRes.data !== null && Array.isArray(studentsRes.data)) {
      const studentsMap: Record<string, any> = {};
      studentsRes.data.forEach((s) => {
        const emailKey = s.email.toLowerCase();
        studentsMap[emailKey] = {
          email: s.email,
          fullName: s.full_name,
          password: s.password || 'pass123',
          learnUserId: s.learn_user_id || undefined,
          studentId: s.student_id || undefined,
          college: s.college || '',
          completedPlanIds: Array.isArray(s.completed_plan_ids) ? s.completed_plan_ids : [],
          inviteCode: s.invite_code || undefined,
          referralsCount: s.referrals_count || 0,
          referredBy: s.referred_by || undefined,
          referredStudents: Array.isArray(s.referred_students) ? s.referred_students : [],
          registeredAt: s.registered_at,
          lastUpdated: s.last_updated,
          hasStartedTrack: Boolean(s.has_started_track),
          slideStartMode: s.slide_start_mode || 'first_login',
        };
      });
      partialStore.students = studentsMap;
    }

    if (vaultRes.data && vaultRes.data.length > 0) {
      const v = vaultRes.data[0];
      partialStore.vault = {
        githubRepoUrl: v.github_repo_url,
        youtubeTutorialUrl: v.youtube_tutorial_url,
        secretAccessToken: v.secret_access_token,
        unlockInstructions: v.unlock_instructions,
      };
    }

    return partialStore;
  } catch (err) {
    console.error('Error fetching store from Supabase:', err);
    return null;
  }
}

/**
 * Upsert a single student to Supabase
 */
export async function syncStudentToSupabase(student: any): Promise<void> {
  if (!isSupabaseConfigured || !student?.email) return;

  try {
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
        has_started_track: Boolean(student.hasStartedTrack),
        slide_start_mode: student.slideStartMode || 'first_login',
      }),
    });
  } catch (err) {
    console.warn('Failed to sync student to Supabase:', err);
  }
}

/**
 * Delete a student from Supabase
 */
export async function deleteStudentFromSupabase(email: string): Promise<void> {
  if (!isSupabaseConfigured || !email) return;
  try {
    await supabaseFetch(`mlsa_students?email=eq.${encodeURIComponent(email.toLowerCase())}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Failed to delete student from Supabase:', err);
  }
}

/**
 * Upsert Vault Config to Supabase
 */
export async function syncVaultToSupabase(vault: MasterStoreData['vault']): Promise<void> {
  if (!isSupabaseConfigured || !vault) return;
  try {
    await supabaseFetch('mlsa_vault', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id: 'default_vault',
        github_repo_url: vault.githubRepoUrl,
        youtube_tutorial_url: vault.youtubeTutorialUrl,
        secret_access_token: vault.secretAccessToken,
        unlock_instructions: vault.unlockInstructions,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('Failed to sync vault to Supabase:', err);
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
      await syncStudentToSupabase(student);
    }

    // 4. Sync Vault
    if (store.vault) {
      await syncVaultToSupabase(store.vault);
    }

    return true;
  } catch (err) {
    console.error('Failed to sync store to Supabase:', err);
    return false;
  }
}
