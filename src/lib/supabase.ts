import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { CurriculumTrack, StudentProfile, AdminStudentRecord, DispatchLog } from '../types'

// Supabase Project credentials
// Automatically supports both VITE_SUPABASE_URL and SUPABASE_URL
const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://muqxdpgjtkirgdijcheh.supabase.co'

const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim().length > 10)
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

/**
 * Fetch tracks from Supabase `mlsa_plans` table if configured
 */
export async function fetchTracksFromSupabase(): Promise<CurriculumTrack[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('mlsa_plans').select('*')
    if (error || !data || data.length === 0) return null

    return data.map((row: any) => ({
      id: row.id || row.plan_id || `track-${Math.random().toString(36).substring(7)}`,
      title: row.title || row.name || 'Untitled Track',
      shortTitle: row.short_title || row.title?.split(' ')[0] || 'Track',
      badge: row.badge || 'Official Microsoft Learn',
      iconName: row.icon_name || 'Cloud',
      color: row.color || '#ffffff',
      accentColor: row.accent_color || 'rgba(255, 255, 255, 0.1)',
      description: row.description || '',
      skills: Array.isArray(row.skills) ? row.skills : typeof row.skills === 'string' ? row.skills.split(',') : [],
      totalXp: Number(row.total_xp || row.xp || 2000),
      estimatedTime: row.estimated_time || '3.0 Hours',
      learnPathUrl: row.learn_path_url || row.url || 'https://learn.microsoft.com',
      modules: Array.isArray(row.modules) ? row.modules : [],
      completed: Boolean(row.completed),
    }))
  } catch (err) {
    console.warn('[Supabase] Failed to fetch tracks:', err)
    return null
  }
}

/**
 * Save / Update a track in Supabase
 */
export async function saveTrackToSupabase(track: CurriculumTrack): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('mlsa_plans').upsert({
      id: track.id,
      title: track.title,
      short_title: track.shortTitle,
      badge: track.badge,
      description: track.description,
      skills: track.skills,
      total_xp: track.totalXp,
      estimated_time: track.estimatedTime,
      learn_path_url: track.learnPathUrl,
      modules: track.modules,
      completed: track.completed,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch (err) {
    console.warn('[Supabase] Failed to save track:', err)
    return false
  }
}

/**
 * Delete a track from Supabase
 */
export async function deleteTrackFromSupabase(trackId: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('mlsa_plans').delete().eq('id', trackId)
    return !error
  } catch (err) {
    console.warn('[Supabase] Failed to delete track:', err)
    return false
  }
}

/**
 * Fetch student accounts from Supabase (`mlsa_students` or `students` table)
 */
export async function fetchStudentsFromSupabase(): Promise<AdminStudentRecord[] | null> {
  if (!supabase) {
    console.warn('[Supabase] Client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    return null
  }
  try {
    let rows: any[] = []

    // 1. Try mlsa_students
    const res1 = await supabase.from('mlsa_students').select('*')
    if (!res1.error && res1.data && res1.data.length > 0) {
      rows = res1.data
    } else {
      // 2. Try students table fallback
      const res2 = await supabase.from('students').select('*')
      if (!res2.error && res2.data && res2.data.length > 0) {
        rows = res2.data
      }
    }

    if (!rows || rows.length === 0) {
      console.warn('[Supabase] No student records returned from mlsa_students or students.')
      return null
    }

    console.log('[Supabase] Successfully fetched student rows:', rows.length)

    return rows.map((row: any, idx: number) => {
      const learnId =
        row.user_id ||
        row.userId ||
        row.learn_id ||
        row.learn_user_id ||
        row.learnUserId ||
        row.learn_handle ||
        row.username ||
        row.id ||
        `student-${idx + 1}`

      const name =
        row.name ||
        row.display_name ||
        row.displayName ||
        row.full_name ||
        row.fullName ||
        learnId ||
        `Student ${idx + 1}`

      const email =
        row.email ||
        (learnId ? `${String(learnId).toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu` : `student${idx + 1}@student.edu`)

      const enrollmentNo =
        row.enrollment_no ||
        row.enrollmentNo ||
        row.enrollment ||
        row.roll_no ||
        row.rollNo ||
        ''

      const tracksCompleted = Number(row.tracks_completed ?? row.completed_tracks ?? row.modules_completed ?? 0)
      const referralsCount = Number(row.referral_count ?? row.referrals_count ?? row.referrals ?? 0)
      const vaultUnlocked = Boolean(row.vault_unlocked ?? row.vaultUnlocked ?? row.is_unlocked ?? false)
      const verified = Boolean(row.is_verified ?? row.verified ?? true)
      const lastActive =
        row.last_active ||
        row.lastActive ||
        (row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Active')

      return {
        id: String(row.id || `supa-${learnId || idx}`),
        name: String(name),
        email: String(email),
        enrollmentNo: String(enrollmentNo),
        learnId: String(learnId),
        tracksCompleted,
        referralsCount,
        vaultUnlocked,
        lastActive,
        verified,
      }
    })
  } catch (err) {
    console.warn('[Supabase] Failed to fetch students:', err)
    return null
  }
}

/**
 * Upsert student registration to Supabase
 */
export async function syncStudentToSupabase(student: StudentProfile): Promise<boolean> {
  if (!supabase || !student.email) return false
  try {
    const { error } = await supabase.from('mlsa_students').upsert({
      email: student.email,
      learn_id: student.learnId,
      display_name: student.displayName,
      enrollment_no: student.enrollmentNo,
      xp: student.xp,
      level: student.level,
      referral_code: student.referralCode,
      updated_at: new Date().toISOString(),
    })
    return !error
  } catch (err) {
    console.warn('[Supabase] Failed to sync student profile:', err)
    return false
  }
}

/**
 * Update student modules / referrals / status directly in Supabase
 */
export async function updateStudentInSupabase(
  student: { id?: string; email?: string; learnId?: string },
  fields: {
    tracksCompleted?: number
    referralsCount?: number
    vaultUnlocked?: boolean
    verified?: boolean
  }
): Promise<boolean> {
  if (!supabase) return false
  try {
    const payload: any = {
      updated_at: new Date().toISOString(),
    }
    if (fields.tracksCompleted !== undefined) {
      payload.tracks_completed = fields.tracksCompleted
      payload.completed_tracks = fields.tracksCompleted
      payload.modules_completed = fields.tracksCompleted
    }
    if (fields.referralsCount !== undefined) {
      payload.referral_count = fields.referralsCount
      payload.referrals_count = fields.referralsCount
      payload.referrals = fields.referralsCount
    }
    if (fields.vaultUnlocked !== undefined) {
      payload.vault_unlocked = fields.vaultUnlocked
    }
    if (fields.verified !== undefined) {
      payload.is_verified = fields.verified
      payload.verified = fields.verified
    }

    let updated = false
    if (student.email) {
      const { error } = await supabase.from('mlsa_students').update(payload).eq('email', student.email)
      if (!error) updated = true
    }
    if (!updated && student.learnId) {
      const { error } = await supabase.from('mlsa_students').update(payload).or(`learn_id.eq.${student.learnId},user_id.eq.${student.learnId}`)
      if (!error) updated = true
    }
    if (!updated && student.id && !student.id.startsWith('supa-') && !student.id.startsWith('reg-')) {
      const { error } = await supabase.from('mlsa_students').update(payload).eq('id', student.id)
      if (!error) updated = true
    }

    // Also attempt on students fallback table
    if (student.email) {
      await supabase.from('students').update(payload).eq('email', student.email)
    } else if (student.learnId) {
      await supabase.from('students').update(payload).or(`learn_id.eq.${student.learnId},user_id.eq.${student.learnId}`)
    }

    return true
  } catch (err) {
    console.warn('[Supabase] Failed to update student in Supabase:', err)
    return false
  }
}

/**
 * Delete student record directly from Supabase
 */
export async function deleteStudentFromSupabase(student: {
  id?: string
  email?: string
  learnId?: string
}): Promise<boolean> {
  if (!supabase) return false
  try {
    if (student.email) {
      await supabase.from('mlsa_students').delete().eq('email', student.email)
      await supabase.from('students').delete().eq('email', student.email)
    }
    if (student.learnId) {
      await supabase.from('mlsa_students').delete().or(`learn_id.eq.${student.learnId},user_id.eq.${student.learnId}`)
      await supabase.from('students').delete().or(`learn_id.eq.${student.learnId},user_id.eq.${student.learnId}`)
    }
    if (student.id && !student.id.startsWith('supa-') && !student.id.startsWith('reg-')) {
      await supabase.from('mlsa_students').delete().eq('id', student.id)
      await supabase.from('students').delete().eq('id', student.id)
    }
    return true
  } catch (err) {
    console.warn('[Supabase] Failed to delete student from Supabase:', err)
    return false
  }
}

/**
 * Log action or admin dispatch to Supabase `mlsa_dispatch_logs`
 */
export async function logDispatchToSupabase(log: DispatchLog): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('mlsa_dispatch_logs').insert({
      id: log.id,
      timestamp: log.timestamp,
      type: log.type,
      message: log.message,
    })
    return !error
  } catch (err) {
    console.warn('[Supabase] Failed to log dispatch:', err)
    return false
  }
}
