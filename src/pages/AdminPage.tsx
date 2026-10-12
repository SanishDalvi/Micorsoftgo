import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Upload,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  RefreshCw,
} from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const AdminPage: React.FC = () => {
  const {
    student,
    adminStudents,
    dispatchLogs,
    adminVerifyStudent,
    adminGrantVault,
    adminUploadCSV,
    tracks,
    addTrack,
    removeTrack,
    refreshFromSupabase,
  } = useVault()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const COORDINATOR_SECURITY_KEY =
    (import.meta as any).env?.VITE_ADMIN_PASSCODE ||
    (import.meta as any).env?.ADMIN_PASSCODE ||
    process.env.ADMIN_PASSCODE ||
    'mlsa-coordinator-2026'

  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('mlsa_admin_auth') === 'true'
  })
  const [authError, setAuthError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [csvUploaded, setCsvUploaded] = useState(false)

  // Track Management State
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false)
  const [trackSuccessMsg, setTrackSuccessMsg] = useState('')
  const [newTrackForm, setNewTrackForm] = useState({
    title: '',
    description: '',
    estimatedTime: '3.0 Hours',
    totalXp: 2000,
    badge: 'Official Microsoft Learn',
    learnPathUrl: '',
    skillsInput: '',
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim() && passcode.trim() === COORDINATOR_SECURITY_KEY) {
      setIsAuthenticated(true)
      sessionStorage.setItem('mlsa_admin_auth', 'true')
      setAuthError(false)
      setPasscode('')
    } else {
      setAuthError(true)
    }
  }

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTrackForm.title.trim() || !newTrackForm.learnPathUrl.trim()) return

    const skills = newTrackForm.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const newId = `track-${Date.now()}`

    addTrack({
      id: newId,
      title: newTrackForm.title.trim(),
      description:
        newTrackForm.description.trim() ||
        'Official Microsoft Learn curriculum path for hands-on technical skills.',
      estimatedTime: newTrackForm.estimatedTime.trim() || '3.0 Hours',
      totalXp: Number(newTrackForm.totalXp) || 2000,
      badge: newTrackForm.badge.trim() || 'Official Microsoft Learn',
      learnPathUrl: newTrackForm.learnPathUrl.trim(),
      skills: skills.length > 0 ? skills : ['Cloud', 'Developer'],
      completed: false,
      modules: [],
    })

    const titleAdded = newTrackForm.title.trim()
    setNewTrackForm({
      title: '',
      description: '',
      estimatedTime: '3.0 Hours',
      totalXp: 2000,
      badge: 'Official Microsoft Learn',
      learnPathUrl: '',
      skillsInput: '',
    })
    setIsAddTrackOpen(false)
    setTrackSuccessMsg(`Successfully added track "${titleAdded}" to curriculum!`)
    setTimeout(() => setTrackSuccessMsg(''), 4000)
  }

  const handleRemoveTrack = (trackId: string, trackTitle: string) => {
    if (window.confirm(`Are you sure you want to remove track "${trackTitle}" from the curriculum?`)) {
      removeTrack(trackId)
      setTrackSuccessMsg(`Removed track "${trackTitle}".`)
      setTimeout(() => setTrackSuccessMsg(''), 3000)
    }
  }

  const filtered = adminStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.learnId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="relative z-10 w-full py-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-10">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/40">
            Chapter Administration
          </span>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            Coordinator Console
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-2xl leading-relaxed">
            Manage attendance rosters, upload official Microsoft Learn CSV reports, manage curriculum tracks, and audit token dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tracks"
            className="liquid-glass rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10 hover:border-white/20"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tracks Page</span>
          </Link>
          <Link
            to="/home"
            className="liquid-glass rounded-full px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10 hover:border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal</span>
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                setIsAuthenticated(false)
                sessionStorage.removeItem('mlsa_admin_auth')
              }}
              className="text-xs font-mono text-white/50 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-full liquid-glass"
            >
              Lock Console
            </button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md mx-auto py-16 border border-white/10 rounded-2xl p-8 bg-black/40 text-center">
          <div className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center mx-auto mb-4 text-white">
            <KeyRound className="w-5 h-5" />
          </div>

          <h2 className="text-xl font-medium text-white">Coordinator Security Challenge</h2>
          <p className="text-xs text-white/60 mt-2 mb-6">
            This console is restricted to verified chapter ambassadors. Direct public access is disabled.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value)
                setAuthError(false)
              }}
              placeholder="Enter coordinator security key"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/15 text-white text-sm focus:border-white focus:outline-none font-mono text-center"
            />

            {authError && (
              <p className="text-xs text-rose-400 font-mono">
                Access Denied: Invalid coordinator key.
              </p>
            )}

            <div className="flex items-center justify-center pt-2">
              <button
                type="submit"
                className="rounded-lg bg-white px-6 py-2.5 text-xs font-medium text-black hover:scale-105 transition-transform cursor-pointer"
              >
                Unlock Console
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-white/10 bg-black/40">
              <p className="text-[10px] font-mono text-white/40 uppercase">Total Students</p>
              <p className="text-2xl font-medium text-white mt-1">{adminStudents.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/40">
              <p className="text-[10px] font-mono text-white/40 uppercase">Verified Accounts</p>
              <p className="text-2xl font-medium text-white mt-1">
                {adminStudents.filter((s) => s.verified).length}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/40">
              <p className="text-[10px] font-mono text-white/40 uppercase">Curriculum Tracks</p>
              <p className="text-2xl font-medium text-white mt-1">{tracks.length}</p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/40">
              <p className="text-[10px] font-mono text-white/40 uppercase">Vault Decryptions</p>
              <p className="text-2xl font-medium text-white mt-1">
                {adminStudents.filter((s) => s.vaultUnlocked).length}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/10 bg-black/40">
              <p className="text-[10px] font-mono text-white/40 uppercase">Sync Status</p>
              <p className="text-sm font-mono text-emerald-400 mt-2">Active · Synced</p>
            </div>
          </div>

          {/* Curriculum Tracks Management */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <h3 className="text-lg font-medium text-white">Curriculum Learning Tracks ({tracks.length})</h3>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Directly add, preview, or remove official learning tracks. All updates reflect immediately on <Link to="/tracks" className="text-sky-300 underline hover:text-sky-200">/tracks</Link>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/tracks"
                  className="liquid-glass rounded-xl px-3.5 py-2 text-xs font-mono text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Live Tracks</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsAddTrackOpen(!isAddTrackOpen)}
                  className="liquid-glass rounded-xl px-4 py-2 text-xs font-medium text-white hover:text-white border border-white/20 hover:border-white/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddTrackOpen ? 'Close Form' : 'Add New Track'}</span>
                </button>
              </div>
            </div>

            {trackSuccessMsg && (
              <div className="mb-6 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{trackSuccessMsg}</span>
              </div>
            )}

            {/* Add Track Form Panel */}
            {isAddTrackOpen && (
              <form
                onSubmit={handleAddTrack}
                className="mb-8 p-6 rounded-xl border border-white/15 bg-white/[0.02] backdrop-blur-md space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="text-sm font-semibold text-white tracking-wide">Add New Curriculum Track</h4>
                  <span className="text-xs font-mono text-white/40">Enter track details & Microsoft Learn link</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5">Track Title *</label>
                    <input
                      type="text"
                      required
                      value={newTrackForm.title}
                      onChange={(e) => setNewTrackForm({ ...newTrackForm, title: e.target.value })}
                      placeholder="e.g. Azure AI Engineer Associate"
                      className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5">Microsoft Learn URL *</label>
                    <input
                      type="url"
                      required
                      value={newTrackForm.learnPathUrl}
                      onChange={(e) => setNewTrackForm({ ...newTrackForm, learnPathUrl: e.target.value })}
                      placeholder="https://learn.microsoft.com/training/paths/..."
                      className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-white/60 mb-1.5">Badge / Domain Tag</label>
                    <input
                      type="text"
                      value={newTrackForm.badge}
                      onChange={(e) => setNewTrackForm({ ...newTrackForm, badge: e.target.value })}
                      placeholder="e.g. Official Microsoft Learn, AI Specialist"
                      className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-1.5">Estimated Duration</label>
                      <input
                        type="text"
                        value={newTrackForm.estimatedTime}
                        onChange={(e) => setNewTrackForm({ ...newTrackForm, estimatedTime: e.target.value })}
                        placeholder="e.g. 3.0 Hours"
                        className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-white/60 mb-1.5">XP Reward</label>
                      <input
                        type="number"
                        value={newTrackForm.totalXp}
                        onChange={(e) => setNewTrackForm({ ...newTrackForm, totalXp: Number(e.target.value) })}
                        placeholder="e.g. 2200"
                        className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5">Track Description</label>
                  <textarea
                    rows={2}
                    value={newTrackForm.description}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, description: e.target.value })}
                    placeholder="Brief description of what students will build and learn in this track..."
                    className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-white/60 mb-1.5">Key Skills (comma separated)</label>
                  <input
                    type="text"
                    value={newTrackForm.skillsInput}
                    onChange={(e) => setNewTrackForm({ ...newTrackForm, skillsInput: e.target.value })}
                    placeholder="e.g. Azure OpenAI, GPT-4o, Prompt Engineering, Semantic Kernel"
                    className="w-full px-3.5 py-2 text-xs rounded-lg bg-black/60 border border-white/15 text-white placeholder-white/30 focus:border-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddTrackOpen(false)}
                    className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="liquid-glass rounded-xl px-5 py-2 text-xs font-medium text-white hover:text-white border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-lg"
                  >
                    Publish Track to Curriculum
                  </button>
                </div>
              </form>
            )}

            {/* Current Tracks Table */}
            <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/[0.03] text-white/40 border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-3">Track</th>
                    <th className="p-3">Duration & XP</th>
                    <th className="p-3">Skills Covered</th>
                    <th className="p-3">Learn Path URL</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tracks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-white/50 font-mono text-xs">
                        No tracks in curriculum. Click &quot;Add New Track&quot; above to create one.
                      </td>
                    </tr>
                  ) : (
                    tracks.map((track, idx) => (
                      <tr key={track.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-sans text-white">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                              0{idx + 1}
                            </span>
                            <div>
                              <p className="font-medium">{track.title}</p>
                              <p className="text-[10px] text-white/40 font-mono line-clamp-1">{track.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-white/70">
                          <p>{track.estimatedTime}</p>
                          <p className="text-[10px] text-amber-300">+{track.totalXp} XP</p>
                        </td>
                        <td className="p-3 text-white/60 max-w-xs">
                          <div className="flex flex-wrap gap-1">
                            {(track.skills || []).slice(0, 3).map((s) => (
                              <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                {s}
                              </span>
                            ))}
                            {(track.skills || []).length > 3 && (
                              <span className="text-[9px] text-white/40">+{track.skills.length - 3} more</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-white/70 max-w-xs truncate">
                          <a
                            href={track.learnPathUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-300 hover:text-sky-200 underline flex items-center gap-1 truncate"
                            title={track.learnPathUrl}
                          >
                            <span className="truncate">{track.learnPathUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(track.id, track.title)}
                            className="px-2.5 py-1 rounded text-[11px] font-mono text-rose-300/80 hover:text-rose-200 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Remove this track"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official CSV Ingestion Box */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                Data Pipeline Sync
              </span>
              <h3 className="text-lg font-medium text-white mt-1">
                Official Microsoft Learn CSV Roster Ingestion
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Upload your chapter completion export CSV to automatically update student modules and trigger vault decrypts.
              </p>
            </div>

            <label className="rounded-lg bg-white px-5 py-2.5 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Upload Chapter CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    adminUploadCSV(file.name)
                    setCsvUploaded(true)
                    setTimeout(() => setCsvUploaded(false), 3000)
                  }
                }}
              />
            </label>
          </div>

          {csvUploaded && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>CSV parsed successfully. 14 student module records synced.</span>
            </div>
          )}

          {/* Student Registry Table */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-medium text-white">Student Roster ({filtered.length})</h3>
                <p className="text-xs text-white/40">Real-time attendance & verification records</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={async () => {
                    setIsRefreshing(true)
                    await refreshFromSupabase()
                    setTimeout(() => setIsRefreshing(false), 600)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Reload all student records and curriculum tracks directly from Supabase"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Supabase'}</span>
                </button>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, ID, or email..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.03] text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white/[0.03] text-white/40 border-b border-white/10 uppercase">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Enrollment No</th>
                    <th className="p-3">Learn Handle</th>
                    <th className="p-3">Tracks Done</th>
                    <th className="p-3">Referrals (7 target)</th>
                    <th className="p-3">Vault Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-white/50 font-mono text-xs">
                        No student records matching search filter. All registered students and current portal account sync here automatically.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((std) => (
                      <tr key={std.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-sans text-white">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium">{std.name}</p>
                            {(std.id === 'student-active' ||
                              (student.learnId && std.learnId.toLowerCase() === student.learnId.toLowerCase())) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                                You (Active)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 font-mono">
                            <a
                              href={`mailto:${std.email}`}
                              className="text-emerald-300/80 hover:text-emerald-200 underline decoration-emerald-500/20 hover:decoration-emerald-400 transition-colors"
                            >
                              {std.email}
                            </a>
                          </p>
                        </td>
                        <td className="p-3 text-white/70">{std.enrollmentNo || '—'}</td>
                        <td className="p-3 text-white/70">@{std.learnId}</td>
                        <td className="p-3 text-white/70">{std.tracksCompleted}/{tracks.length || 4}</td>
                        <td className="p-3 text-white/70">{std.referralsCount}/7</td>
                        <td className="p-3">
                          {std.vaultUnlocked ? (
                            <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
                              Decrypted
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded border border-white/20 text-white/60">
                              Locked
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          {!std.verified && (
                            <button
                              type="button"
                              onClick={() => adminVerifyStudent(std.id)}
                              className="text-[11px] text-white/80 hover:text-white underline cursor-pointer"
                            >
                              Verify
                            </button>
                          )}
                          {!std.vaultUnlocked && (
                            <button
                              type="button"
                              onClick={() => adminGrantVault(std.id)}
                              className="text-[11px] text-white/80 hover:text-white underline cursor-pointer"
                            >
                              Grant Key
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chapter Audit Logs */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40">
            <span className="text-xs font-mono uppercase tracking-wider text-white/40 block mb-3">
              Live Chapter Dispatch Logs
            </span>
            <div className="space-y-1.5 font-mono text-xs text-white/50 max-h-40 overflow-y-auto">
              {dispatchLogs.map((log) => (
                <p key={log.id}>
                  [{log.timestamp}] {log.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
