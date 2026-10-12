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
 * Fetch student accounts from Supabase `mlsa_students` table
 */
export async function fetchStudentsFromSupabase(): Promise<AdminStudentRecord[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('mlsa_students').select('*')
    if (error || !data) return null

    return data.map((row: any) => ({
      id: row.id || `student-${Math.random().toString(36).substring(7)}`,
      name: row.name || row.display_name || 'Anonymous Student',
      email: row.email || '',
      enrollmentNo: row.enrollment_no || row.enrollment || '',
      learnId: row.learn_id || '',
      tracksCompleted: Number(row.tracks_completed || 0),
      referralsCount: Number(row.referral_count || row.referrals_count || 0),
      vaultUnlocked: Boolean(row.vault_unlocked ?? false),
      lastActive: row.last_active || (row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Recent'),
      verified: Boolean(row.is_verified ?? row.verified ?? true),
    }))
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
