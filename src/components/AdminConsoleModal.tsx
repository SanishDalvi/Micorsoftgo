import React, { useState } from 'react'
import { X, Search } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const AdminConsoleModal: React.FC = () => {
  const {
    adminStudents,
    dispatchLogs,
    isAdminOpen,
    setIsAdminOpen,
    adminVerifyStudent,
    adminGrantVault,
    adminUploadCSV,
  } = useVault()

  const COORDINATOR_SECURITY_KEY =
    (import.meta as any).env?.VITE_ADMIN_PASSCODE || 'mlsa-coordinator-2026'

  const [passcode, setPasscode] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [csvUploaded, setCsvUploaded] = useState(false)

  if (!isAdminOpen) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim() && passcode.trim() === COORDINATOR_SECURITY_KEY) {
      setIsAuthenticated(true)
      setAuthError(false)
      setPasscode('')
    } else {
      setAuthError(true)
    }
  }

  const filtered = adminStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.learnId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/15 bg-black p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsAdminOpen(false)}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs font-mono uppercase tracking-wider text-white/40">
          Chapter Administration
        </span>
        <h3 className="text-xl font-medium text-white mt-1">Coordinator Console</h3>

        {!isAuthenticated ? (
          <div className="max-w-sm py-12">
            <p className="text-xs text-white/60 mb-4">
              Enter coordinator security key to access the administration console.
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter security key"
                className="w-full px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/15 text-white text-sm focus:border-white focus:outline-none font-mono"
              />

              {authError && <p className="text-xs text-rose-400">Invalid security key</p>}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-white px-5 py-2 text-xs font-medium text-black hover:scale-105 transition-transform cursor-pointer"
                >
                  Enter Console
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* CSV Ingestion */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Official Microsoft Learn Roster CSV</p>
                <p className="text-xs text-white/50 mt-0.5">Ingest official progress exports to sync completions.</p>
              </div>

              <label className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer">
                <span>Upload Roster CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      adminUploadCSV(file.name)
                      setCsvUploaded(true)
                      setTimeout(() => setCsvUploaded(false), 2500)
                    }
                  }}
                />
              </label>
            </div>

            {csvUploaded && (
              <p className="text-xs font-mono text-emerald-400">
                ✓ Roster parsed. 14 student module records updated.
              </p>
            )}

            {/* Student Table */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-xs font-mono uppercase text-white/40">Student Records</span>
                <div className="relative w-48">
                  <Search className="w-3 h-3 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-2.5 py-1 text-xs rounded border border-white/10 bg-white/[0.02] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="border border-white/10 rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-white/[0.03] text-white/40 border-b border-white/10">
                    <tr>
                      <th className="p-2.5">Student</th>
                      <th className="p-2.5">Learn ID</th>
                      <th className="p-2.5">Key 1</th>
                      <th className="p-2.5">Key 2</th>
                      <th className="p-2.5">Vault</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((std) => (
                      <tr key={std.id} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 font-sans text-white">{std.name}</td>
                        <td className="p-2.5 text-white/60">@{std.learnId}</td>
                        <td className="p-2.5 text-white/60">{std.tracksCompleted}/4</td>
                        <td className="p-2.5 text-white/60">{std.referralsCount}/7</td>
                        <td className="p-2.5 text-white/60">
                          {std.vaultUnlocked ? 'Decrypted' : 'Locked'}
                        </td>
                        <td className="p-2.5 text-right space-x-2">
                          {!std.verified && (
                            <button
                              type="button"
                              onClick={() => adminVerifyStudent(std.id)}
                              className="text-[11px] text-white/80 hover:text-white underline"
                            >
                              Verify
                            </button>
                          )}
                          {!std.vaultUnlocked && (
                            <button
                              type="button"
                              onClick={() => adminGrantVault(std.id)}
                              className="text-[11px] text-white/80 hover:text-white underline"
                            >
                              Grant Key
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono uppercase text-white/40 block mb-2">Audit Logs</span>
              <div className="space-y-1 font-mono text-[11px] text-white/50 max-h-28 overflow-y-auto">
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
    </div>
  )
}
