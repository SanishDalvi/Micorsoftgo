import React, { createContext, useContext, useState, useEffect } from 'react'
import type {
  StudentProfile,
  CurriculumTrack,
  ReferralPeer,
  AdminStudentRecord,
  DispatchLog,
} from '../types'
import {
  INITIAL_TRACKS,
  TRACKS_DATA_VERSION,
  INITIAL_STUDENT,
  INITIAL_PEERS,
  INITIAL_ADMIN_STUDENTS,
  INITIAL_DISPATCH_LOGS,
  extractCleanLearnId,
} from '../store/vaultStore'
import { soundManager } from '../lib/soundEffects'
import {
  isSupabaseConfigured,
  fetchTracksFromSupabase,
  saveTrackToSupabase,
  deleteTrackFromSupabase,
  syncStudentToSupabase,
  logDispatchToSupabase,
} from '../lib/supabase'

export interface VideoTheme {
  id: string
  name: string
  url: string
  color: string
}

export const VIDEO_THEMES: VideoTheme[] = [
  {
    id: 'ocean',
    name: '01 / Deep Ocean',
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4',
    color: '#38bdf8',
  },
  {
    id: 'gridwave',
    name: '02 / Grid Wave',
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260629_030107_874273ea-684a-4e90-bb96-8fdfde48d53d.mp4',
    color: '#818cf8',
  },
  {
    id: 'lighttunnel',
    name: '03 / Light Tunnel',
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260627_094019_4214ea73-b963-46a4-8327-61489192de99.mp4',
    color: '#34d399',
  },
  {
    id: 'celestial',
    name: '04 / Celestial Ether',
    url: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4',
    color: '#f472b6',
  },
]

interface VaultContextType {
  student: StudentProfile
  tracks: CurriculumTrack[]
  peers: ReferralPeer[]
  adminStudents: AdminStudentRecord[]
  dispatchLogs: DispatchLog[]
  activeVideo: VideoTheme
  soundEnabled: boolean
  isVaultUnlocked: boolean
  unlockedViaKey1: boolean
  unlockedViaKey2: boolean
  isOnboardingOpen: boolean
  isLinkIdOpen: boolean
  isAdminOpen: boolean
  completedTracksCount: number
  totalTracksCount: number
  overallProgressPercent: number
  totalEarnedXp: number
  setActiveVideo: (theme: VideoTheme) => void
  toggleSound: () => void
  setIsOnboardingOpen: (open: boolean) => void
  setIsLinkIdOpen: (open: boolean) => void
  setIsAdminOpen: (open: boolean) => void
  toggleModule: (trackId: string, moduleId: string) => void
  toggleTrack: (trackId: string) => void
  addTrack: (track: CurriculumTrack) => void
  removeTrack: (trackId: string) => void
  completeAllTracks: () => void
  resetTracks: () => void
  isLoggedIn: boolean
  setIsLoggedIn: (logged: boolean) => void
  logout: () => void
  linkStudentAccount: (email: string, rawInput: string, enrollmentNo?: string) => boolean
  updateStudentProfile: (email: string, rawInput: string, enrollmentNo?: string, displayName?: string) => boolean
  addReferralPeer: (name?: string, email?: string) => void
  simulateReachSevenReferrals: () => void
  manualUnlockVault: () => void
  adminVerifyStudent: (studentId: string) => void
  adminGrantVault: (studentId: string) => void
  adminUploadCSV: (fileName: string) => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentProfile>(() => {
    const saved = localStorage.getItem('mlsa_student')
    return saved ? JSON.parse(saved) : INITIAL_STUDENT
  })

  const [tracks, setTracks] = useState<CurriculumTrack[]>(() => {
    const savedVersion = localStorage.getItem('mlsa_tracks_version')
    const saved = localStorage.getItem('mlsa_tracks')
    if (saved && savedVersion === TRACKS_DATA_VERSION) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    localStorage.setItem('mlsa_tracks_version', TRACKS_DATA_VERSION)
    localStorage.setItem('mlsa_tracks', JSON.stringify(INITIAL_TRACKS))
    return INITIAL_TRACKS
  })

  const [peers, setPeers] = useState<ReferralPeer[]>(() => {
    const saved = localStorage.getItem('mlsa_peers')
    return saved ? JSON.parse(saved) : INITIAL_PEERS
  })

  const [adminOverrides, setAdminOverrides] = useState<
    Record<string, { verified?: boolean; vaultUnlocked?: boolean }>
  >(() => {
    try {
      const saved = localStorage.getItem('mlsa_admin_overrides')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [adminStudents, setAdminStudents] = useState<AdminStudentRecord[]>(INITIAL_ADMIN_STUDENTS)
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>(INITIAL_DISPATCH_LOGS)
  const [activeVideo, setActiveVideo] = useState<VideoTheme>(VIDEO_THEMES[0])
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [manualOverrideUnlock, setManualOverrideUnlock] = useState<boolean>(() => {
    return localStorage.getItem('mlsa_manual_vault_override') === 'true'
  })

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('mlsa_logged_in') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('mlsa_logged_in', isLoggedIn ? 'true' : 'false')
  }, [isLoggedIn])

  useEffect(() => {
    localStorage.setItem('mlsa_manual_vault_override', manualOverrideUnlock ? 'true' : 'false')
  }, [manualOverrideUnlock])

  // Hydrate tracks from Supabase if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchTracksFromSupabase().then((remoteTracks) => {
        if (remoteTracks && remoteTracks.length > 0) {
          setTracks(remoteTracks)
        }
      })
    }
  }, [])

  const logout = () => {
    setIsLoggedIn(false)
    localStorage.removeItem('mlsa_logged_in')
    soundManager.playClick()
    addDispatchLog('VERIFICATION', 'Student signed out of portal.')
  }

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false)
  const [isLinkIdOpen, setIsLinkIdOpen] = useState<boolean>(false)
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false)

  // Track completion calculations
  const totalTracksCount = tracks.length
  const completedTracksCount = tracks.filter((t) => {
    if (t.completed !== undefined) return t.completed
    if (t.modules && t.modules.length > 0) return t.modules.every((m) => m.completed)
    return false
  }).length

  const overallProgressPercent = totalTracksCount > 0
    ? Math.round((completedTracksCount / totalTracksCount) * 100)
    : 0

  const totalEarnedXp = tracks.reduce((acc, t) => {
    const isDone = t.completed || (t.modules && t.modules.length > 0 && t.modules.every((m) => m.completed))
    if (isDone) return acc + (t.totalXp || 0)
    if (t.modules && t.modules.length > 0) {
      return acc + t.modules.reduce((mAcc, m) => (m.completed ? mAcc + m.xp : mAcc), 0)
    }
    return acc
  }, 0)

  // Vault Unlock Protocol:
  // Strictly requires 7 student referrals to decrypt the Secret Vault
  const unlockedViaKey1 = completedTracksCount === totalTracksCount && totalTracksCount > 0
  const unlockedViaKey2 = peers.length >= 7
  const isVaultUnlocked = peers.length >= 7 || manualOverrideUnlock


  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('mlsa_student', JSON.stringify(student))
  }, [student])

  useEffect(() => {
    localStorage.setItem('mlsa_tracks', JSON.stringify(tracks))
  }, [tracks])

  useEffect(() => {
    localStorage.setItem('mlsa_peers', JSON.stringify(peers))
    if (student.referralCode) {
      localStorage.setItem(`mlsa_peers_${student.referralCode}`, JSON.stringify(peers))
    }
  }, [peers, student.referralCode])

  // Synchronize adminStudents from main portal active student and registered accounts
  useEffect(() => {
    let accounts: any[] = []
    try {
      const raw = localStorage.getItem('mlsa_registered_accounts')
      if (raw) accounts = JSON.parse(raw)
    } catch {}

    const list: AdminStudentRecord[] = []

    // 1. Current active student from main portal
    if (student.learnId || student.email) {
      const overrideKey = (student.learnId || student.email).toLowerCase()
      const override = adminOverrides[overrideKey] || {}
      list.push({
        id: 'student-active',
        name: student.displayName || student.learnId || 'Active Student',
        email: student.email || `${student.learnId}@campus.edu`,
        learnId: student.learnId,
        enrollmentNo: student.enrollmentNo || '',
        tracksCompleted: completedTracksCount,
        referralsCount: peers.length,
        vaultUnlocked: isVaultUnlocked || Boolean(override.vaultUnlocked),
        lastActive: 'Active Now',
        verified: override.verified !== undefined ? override.verified : true,
      })
    }

    // 2. All registered accounts
    for (const acc of accounts) {
      const key = (acc.learnUserId || acc.email || '').toLowerCase()
      if (
        student.learnId &&
        (acc.learnUserId?.toLowerCase() === student.learnId.toLowerCase() ||
          acc.email?.toLowerCase() === student.email?.toLowerCase())
      ) {
        continue
      }
      const override = adminOverrides[key] || {}
      list.push({
        id: `reg-${acc.learnUserId || acc.email}`,
        name: acc.displayName || acc.learnUserId || 'Student',
        email: acc.email,
        learnId: acc.learnUserId || 'student',
        enrollmentNo: acc.enrollmentNo || '',
        tracksCompleted: acc.tracksCompleted !== undefined ? acc.tracksCompleted : 2,
        referralsCount: acc.referralsCount !== undefined ? acc.referralsCount : 0,
        vaultUnlocked: Boolean(override.vaultUnlocked),
        lastActive: acc.registeredAt ? new Date(acc.registeredAt).toLocaleDateString() : 'Recent',
        verified: override.verified !== undefined ? override.verified : true,
      })
    }

    setAdminStudents(list)
    localStorage.setItem('mlsa_admin_overrides', JSON.stringify(adminOverrides))
  }, [student, completedTracksCount, peers.length, isVaultUnlocked, adminOverrides])

  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundManager.setEnabled(next)
    if (next) soundManager.playClick()
  }

  const toggleModule = (trackId: string, moduleId: string) => {
    soundManager.playClick()
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track
        const currentModules = track.modules || []
        const updatedModules = currentModules.map((m) =>
          m.id === moduleId ? { ...m, completed: !m.completed } : m
        )
        const allCompletedNow = updatedModules.length > 0 && updatedModules.every((m) => m.completed)
        if (allCompletedNow) {
          soundManager.playComplete()
        }
        return { ...track, modules: updatedModules }
      })
    )
  }

  const toggleTrack = (trackId: string) => {
    soundManager.playClick()
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track
        const isCurrentlyComplete =
          track.completed !== undefined
            ? track.completed
            : track.modules && track.modules.length > 0
            ? track.modules.every((m) => m.completed)
            : false
        const nextCompleted = !isCurrentlyComplete
        if (nextCompleted) {
          soundManager.playComplete()
        }
        return {
          ...track,
          completed: nextCompleted,
          modules: track.modules ? track.modules.map((m) => ({ ...m, completed: nextCompleted })) : [],
        }
      })
    )
  }

  const completeAllTracks = () => {
    soundManager.playComplete()
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        completed: true,
        modules: track.modules ? track.modules.map((m) => ({ ...m, completed: true })) : [],
      }))
    )
    addDispatchLog('ROSTER_SYNC', `Student ${student.learnId || 'User'} achieved all tracks completion. XP badges credited.`)
  }

  const resetTracks = () => {
    soundManager.playClick()
    setTracks(INITIAL_TRACKS)
    localStorage.setItem('mlsa_tracks', JSON.stringify(INITIAL_TRACKS))
    localStorage.setItem('mlsa_tracks_version', TRACKS_DATA_VERSION)
    setManualOverrideUnlock(false)
  }

  const addTrack = (newTrack: CurriculumTrack) => {
    soundManager.playClick()
    setTracks((prev) => {
      const updated = [...prev, newTrack]
      localStorage.setItem('mlsa_tracks', JSON.stringify(updated))
      return updated
    })
    saveTrackToSupabase(newTrack)
    addDispatchLog('CURRICULUM_UPDATE', `Admin added track: "${newTrack.title}" (${newTrack.totalXp} XP)`)
  }

  const removeTrack = (trackId: string) => {
    soundManager.playClick()
    setTracks((prev) => {
      const trackToRemove = prev.find((t) => t.id === trackId)
      const updated = prev.filter((t) => t.id !== trackId)
      localStorage.setItem('mlsa_tracks', JSON.stringify(updated))
      if (trackToRemove) {
        addDispatchLog('CURRICULUM_UPDATE', `Admin removed track: "${trackToRemove.title}"`)
      }
      return updated
    })
    deleteTrackFromSupabase(trackId)
  }

  const linkStudentAccount = (email: string, rawInput: string, enrollmentNo?: string): boolean => {
    const cleanId = extractCleanLearnId(rawInput)
    if (!cleanId) return false

    soundManager.playComplete()
    const refCode = `MLSC-${cleanId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'STUDENT'}`

    // Load any existing referral peers saved for this code
    const savedForCode = localStorage.getItem(`mlsa_peers_${refCode}`)
    if (savedForCode) {
      try {
        const parsed = JSON.parse(savedForCode)
        if (Array.isArray(parsed)) {
          setPeers(parsed)
        }
      } catch {}
    }

    const updated: StudentProfile = {
      ...student,
      email: email || student.email,
      learnId: cleanId,
      enrollmentNo: enrollmentNo || student.enrollmentNo || '',
      displayName: cleanId
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      referralCode: refCode,
      linkedAt: new Date().toISOString(),
    }
    setStudent(updated)
    setIsLoggedIn(true)
    localStorage.setItem('mlsa_logged_in', 'true')
    syncStudentToSupabase(updated)

    addDispatchLog(
      'VERIFICATION',
      `Live verification confirmed Microsoft Learn profile for @${cleanId}${enrollmentNo ? ` (Enrollment: ${enrollmentNo})` : ''}. Linked to ${updated.email}.`
    )
    return true
  }

  const updateStudentProfile = (email: string, rawInput: string, enrollmentNo?: string, displayName?: string): boolean => {
    const cleanId = extractCleanLearnId(rawInput) || student.learnId
    soundManager.playComplete()
    const refCode = cleanId ? `MLSC-${cleanId.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'STUDENT'}` : student.referralCode

    const updated: StudentProfile = {
      ...student,
      email: email.trim() || student.email,
      learnId: cleanId,
      enrollmentNo: enrollmentNo?.trim() || student.enrollmentNo || '',
      displayName: displayName?.trim() || (cleanId
        ? cleanId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : student.displayName),
      referralCode: refCode,
    }
    setStudent(updated)
    localStorage.setItem('mlsa_student', JSON.stringify(updated))
    syncStudentToSupabase(updated)
    addDispatchLog(
      'VERIFICATION',
      `Updated profile credentials for @${cleanId}${enrollmentNo ? ` (Enrollment: ${enrollmentNo})` : ''}.`
    )
    return true
  }

  const addReferralPeer = (name?: string, email?: string) => {
    soundManager.playClick()
    const peerNames = [
      'Devon Vance',
      'Zoe Lin',
      'Jordan Blake',
      'Samantha Reed',
      'Tariq Mansoor',
      'Hannah Abbott',
      'Lucas Silva',
    ]
    const randomName = name || peerNames[peers.length % peerNames.length]
    const randomEmail = email || `${randomName.toLowerCase().replace(/\s+/g, '.')}@student.edu`

    const newPeer: ReferralPeer = {
      id: `p-${Date.now()}`,
      name: randomName,
      email: randomEmail,
      joinedAt: 'Just now',
      modulesCompleted: Math.floor(Math.random() * 4) + 1,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (peers.length * 373) % 1000}?auto=format&fit=crop&w=120&q=80`,
    }

    setPeers((prev) => {
      const updated = [newPeer, ...prev]
      if (updated.length === 7) {
        soundManager.playVaultUnlock()
        addDispatchLog(
          'VAULT_DECRYPT',
          `Milestone reached! 7 student referrals verified for ${student.referralCode}. Key 2 activated.`
        )
      }
      return updated
    })
  }

  const simulateReachSevenReferrals = () => {
    soundManager.playVaultUnlock()
    const needed = Math.max(0, 7 - peers.length)
    if (needed === 0) return
    const demoPeers: ReferralPeer[] = [
      {
        id: `p-sim-1`,
        name: 'Alex Rivera',
        email: 'alex.r@student.edu',
        joinedAt: '1 min ago',
        modulesCompleted: 4,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: `p-sim-2`,
        name: 'Jordan Chen',
        email: 'jordan.c@student.edu',
        joinedAt: '3 mins ago',
        modulesCompleted: 5,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: `p-sim-3`,
        name: 'Morgan Taylor',
        email: 'morgan.t@student.edu',
        joinedAt: '5 mins ago',
        modulesCompleted: 3,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
      },
      {
        id: `p-sim-4`,
        name: 'Casey Harper',
        email: 'casey.h@student.edu',
        joinedAt: '8 mins ago',
        modulesCompleted: 7,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      },
    ]

    setPeers((prev) => {
      const merged = [...demoPeers.slice(0, needed), ...prev]
      return merged
    })
    addDispatchLog('VAULT_DECRYPT', `Classmate referrals reached 7/7 threshold. Ambassador Key unlocked!`)
  }

  const manualUnlockVault = () => {
    soundManager.playVaultUnlock()
    setManualOverrideUnlock(true)
    addDispatchLog('VAULT_DECRYPT', `Coordinator manual override activated. High-Compute Enclave decrypted.`)
  }

  const adminVerifyStudent = (studentId: string) => {
    soundManager.playClick()
    const found = adminStudents.find((s) => s.id === studentId)
    const key = (found?.learnId || found?.email || studentId).toLowerCase()
    setAdminOverrides((prev) => ({
      ...prev,
      [key]: { ...prev[key], verified: true },
    }))
    addDispatchLog('VERIFICATION', `Coordinator verified student: @${found?.learnId || studentId}.`)
  }

  const adminGrantVault = (studentId: string) => {
    soundManager.playVaultUnlock()
    const found = adminStudents.find((s) => s.id === studentId)
    const key = (found?.learnId || found?.email || studentId).toLowerCase()
    setAdminOverrides((prev) => ({
      ...prev,
      [key]: { ...prev[key], vaultUnlocked: true },
    }))
    // If the granted student is the active student or matches handle, unlock main page immediately!
    if (
      studentId === 'student-active' ||
      found?.learnId?.toLowerCase() === student.learnId.toLowerCase() ||
      found?.email?.toLowerCase() === student.email.toLowerCase()
    ) {
      setManualOverrideUnlock(true)
    }
    addDispatchLog('TOKEN_DISPATCH', `Dispatched high-compute bearer token to student: @${found?.learnId || studentId}.`)
  }

  const adminUploadCSV = (fileName: string) => {
    soundManager.playComplete()
    completeAllTracks()
    addDispatchLog(
      'ROSTER_SYNC',
      `Official CSV "${fileName}" parsed. Synchronized student module completions with main portal.`
    )
  }

  const addDispatchLog = (type: DispatchLog['type'], message: string) => {
    const newLog: DispatchLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-GB'),
      type,
      message,
    }
    setDispatchLogs((prev) => [newLog, ...prev.slice(0, 19)])
    logDispatchToSupabase(newLog)
  }

  return (
    <VaultContext.Provider
      value={{
        student,
        tracks,
        peers,
        adminStudents,
        dispatchLogs,
        activeVideo,
        soundEnabled,
        isVaultUnlocked,
        unlockedViaKey1,
        unlockedViaKey2,
        isOnboardingOpen,
        isLinkIdOpen,
        isAdminOpen,
        completedTracksCount,
        totalTracksCount,
        overallProgressPercent,
        totalEarnedXp,
        setActiveVideo,
        toggleSound,
        setIsOnboardingOpen,
        setIsLinkIdOpen,
        setIsAdminOpen,
        toggleModule,
        toggleTrack,
        addTrack,
        removeTrack,
        completeAllTracks,
        resetTracks,
        isLoggedIn,
        setIsLoggedIn,
        logout,
        linkStudentAccount,
        updateStudentProfile,
        addReferralPeer,
        simulateReachSevenReferrals,
        manualUnlockVault,
        adminVerifyStudent,
        adminGrantVault,
        adminUploadCSV,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export const useVault = () => {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}
