export interface StudentProfile {
  email: string
  learnId: string
  displayName: string
  enrollmentNo?: string
  avatarUrl: string
  xp: number
  level: number
  linkedAt: string
  referralCode: string
}

export interface CurriculumModule {
  id: string
  title: string
  duration: string
  xp: number
  learnUrl: string
  completed: boolean
}

export interface CurriculumTrack {
  id: string
  title: string
  shortTitle?: string
  badge?: string
  iconName?: string
  color?: string
  accentColor?: string
  description: string
  skills: string[]
  totalXp: number
  estimatedTime: string
  learnPathUrl: string
  completed?: boolean
  modules?: CurriculumModule[]
}

export interface ReferralPeer {
  id: string
  name: string
  email: string
  enrollmentNo?: string
  joinedAt: string
  modulesCompleted: number
  avatar: string
}

export interface AdminStudentRecord {
  id: string
  name: string
  email: string
  learnId: string
  enrollmentNo?: string
  tracksCompleted: number
  referralsCount: number
  vaultUnlocked: boolean
  lastActive: string
  verified: boolean
}

export interface DispatchLog {
  id: string
  timestamp: string
  type: 'VERIFICATION' | 'VAULT_DECRYPT' | 'ROSTER_SYNC' | 'TOKEN_DISPATCH' | 'CURRICULUM_UPDATE'
  message: string
}

