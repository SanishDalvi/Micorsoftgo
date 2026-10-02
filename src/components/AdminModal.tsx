import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  KeyRound,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Save,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import type { LearnPlan, CsvUploadResult } from '../types.js';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: LearnPlan[];
  onRefreshData: () => void;
  onAdminAuthChange?: (isAuthed: boolean) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  plans,
  onRefreshData,
  onAdminAuthChange,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'roster' | 'vault'>('upload');

  // CSV Upload state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CsvUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Overview / Roster state
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Vault editing state
  const [vaultConfig, setVaultConfig] = useState({
    githubRepoUrl: '',
    youtubeTutorialUrl: '',
    secretAccessToken: '',
    unlockInstructions: '',
  });
  const [isSavingVault, setIsSavingVault] = useState(false);
  const [vaultSaveSuccess, setVaultSaveSuccess] = useState(false);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans]);

  useEffect(() => {
    if (isOpen) {
      const savedToken = localStorage.getItem('mlsa_admin_token');
      if (savedToken) {
        setPasscode(savedToken);
        verifyLogin(savedToken);
      }
    }
  }, [isOpen]);

  const verifyLogin = async (code: string) => {
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('mlsa_admin_token', code);
        onAdminAuthChange?.(true);
        fetchOverview(code);
      } else {
        setIsAuthenticated(false);
        onAdminAuthChange?.(false);
        setAuthError(data.error || 'Invalid administrator passcode');
      }
    } catch {
      setIsAuthenticated(false);
      onAdminAuthChange?.(false);
      setAuthError('Connection error verifying administrator credentials');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;
    verifyLogin(passcode);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('mlsa_admin_token');
    onAdminAuthChange?.(false);
    setPasscode('');
    setOverview(null);
  };

  const fetchOverview = async (token: string) => {
    setLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { 'x-admin-passcode': token },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
        if (data.vault) {
          setVaultConfig(data.vault);
        }
      }
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedPlanId) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('planId', selectedPlanId);

    try {
      const res = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        headers: { 'x-admin-passcode': passcode },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload CSV');
      }

      setUploadResult(data);
      setCsvFile(null);
      const fileInput = document.getElementById('csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      onRefreshData();
      fetchOverview(passcode);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading and processing CSV');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVault(true);
    setVaultSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/vault', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ vault: vaultConfig }),
      });

      if (res.ok) {
        setVaultSaveSuccess(true);
        setTimeout(() => setVaultSaveSuccess(false), 3000);
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to save vault:', err);
    } finally {
      setIsSavingVault(false);
    }
  };

  const handleToggleStudentPlan = async (studentEmail: string, planId: string) => {
    try {
      const res = await fetch('/api/admin/student/toggle-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ email: studentEmail, planId }),
      });
      if (res.ok) {
        fetchOverview(passcode);
        onRefreshData();
      }
    } catch (err) {
      console.error('Failed to toggle plan:', err);
    }
  };

  const downloadMasterCsv = () => {
    window.open(`/api/admin/export-master-csv?token=${encodeURIComponent(passcode)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] text-[var(--ink)] shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[var(--paper-2)] border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[var(--ink)] tracking-tight">
                  Student Welfare Project · Admin Console
                </h3>
                {isAuthenticated && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Logged In</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">
                Student Roster Aggregator · Plan Verification Store · Project Vault Config
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-full border border-[var(--line-strong)] hover:border-rose-400 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Log out from administrator session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--panel)] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AUTHENTICATION VIEW */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-md mx-auto text-center space-y-6">
            <div className="w-14 h-14 rounded-full border border-[var(--line-strong)] bg-[var(--card-bg)] text-[var(--ink)] mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-[var(--ink)]">Coordinator Passcode</h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Authorized project leads only. Enter your administrator passcode.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter administrator passcode..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)] transition"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-700 text-left mt-2 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {authError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="button button-dark w-full justify-center text-xs py-2.5"
              >
                <span>Unlock Coordinator Console</span>
                <span className="arrow-badge">→</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN PANEL */
          <div>
            {/* Prominent Logged-In Status Banner */}
            <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between font-semibold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>You are currently logged in as Project Administrator</span>
              </div>
              <span className="text-[11px] text-[var(--muted)] font-normal">Session active</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-[var(--line)] px-6 bg-[var(--paper-2)] text-xs font-bold uppercase tracking-wider overflow-x-auto">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--card-bg)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Student Roster CSV</span>
              </button>
              <button
                onClick={() => setActiveTab('roster')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'roster'
                    ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--card-bg)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Master Student Roster</span>
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`py-3.5 px-4 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'vault'
                    ? 'border-[var(--ink)] text-[var(--ink)] bg-[var(--card-bg)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Secret Vault Config</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-6">
              {/* TAB 1: CSV UPLOAD & AGGREGATOR */}
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs text-[var(--muted)] leading-relaxed">
                    <p className="font-bold text-[var(--ink)] mb-1">
                      In-Memory Stream Processing Architecture
                    </p>
                    Each uploaded roster CSV is parsed and immediately aggregated into the master database. To conserve memory and eliminate clutter, individual CSV files are discarded instantly after ingestion.
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-300 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-blue-950 dark:text-blue-200">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Automated System Verification Active</span>
                    </div>
                    <p>
                      When you upload a Microsoft Learn challenge roster CSV, student User IDs are stored in the system. During registration, the system automatically verifies that the student's User ID exists in this roster—stopping fake or random IDs without requiring manual checks.
                    </p>
                  </div>

                  <form onSubmit={handleFileUpload} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                        1. Select Processing Mode / Target Track:
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      >
                        <option value="auto">
                          ✨ Auto-Detect from CSV ("Completed Plans" column: e.g. "ALL" or track titles)
                        </option>
                        <option value="all">
                          🏆 All Curriculum Tracks (Grant 100% Completion &amp; Unlock Vault)
                        </option>
                        <optgroup label="Single Track Specific Upload">
                          {plans.map((p, idx) => (
                            <option key={p.id} value={p.id}>
                              Track {idx + 1}: {p.title} ({p.badgeTitle})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                        2. Select Student Attendance CSV File:
                      </label>
                      <div className="border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--ink)] rounded-2xl p-6 text-center bg-[var(--card-bg)] transition">
                        <FileSpreadsheet className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-2" />
                        <div className="text-xs text-[var(--ink)] mb-2 font-semibold">
                          {csvFile ? (
                            <span className="text-emerald-700 font-bold">{csvFile.name}</span>
                          ) : (
                            <span>Drag and drop CSV here, or browse</span>
                          )}
                        </div>
                        <input
                          id="csv-file-input"
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          className="text-xs text-[var(--muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--ink)] file:text-[var(--paper)] hover:file:opacity-90 cursor-pointer"
                        />
                        <p className="text-[11px] text-[var(--muted-2)] mt-2">
                          Supported headers: Email, Full Name, College, AZ-900, Copilot, AI-900, Security, or Completed Plans.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open('/api/admin/template-csv?type=multi', '_blank')}
                          className="px-3 py-2 rounded-full bg-[var(--card-bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line-strong)] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Multi-Track Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open('/api/admin/template-csv?type=single', '_blank')}
                          className="px-3 py-2 rounded-full bg-[var(--card-bg)] hover:bg-[var(--panel)] text-[var(--ink)] border border-[var(--line-strong)] text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Single Template</span>
                        </button>
                        <button
                          type="button"
                          onClick={downloadMasterCsv}
                          className="px-3 py-2 rounded-full bg-[var(--acid)] text-[var(--ink)] border border-[var(--line-strong)] text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Export Master CSV</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!csvFile || isUploading}
                        className={`button button-dark text-xs py-2 px-5 ${
                          !csvFile || isUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Process &amp; Merge CSV</span>
                            <span className="arrow-badge">→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {uploadError && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadResult && (
                    <div className="p-4 rounded-xl bg-white border-2 border-emerald-600 text-[var(--ink)] text-xs space-y-2">
                      <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CSV Aggregation Successful!</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--line)] text-xs">
                        <div>
                          <span className="text-[var(--muted)] block font-medium">PLAN:</span>
                          <span className="font-bold truncate block">{uploadResult.planTitle}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block font-medium">PARSED ROWS:</span>
                          <span className="font-bold">{uploadResult.processedCount} students</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block font-medium">NEW COMPLETIONS:</span>
                          <span className="text-emerald-700 font-bold">+{uploadResult.newCompletionsCount}</span>
                        </div>
                        <div>
                          <span className="text-[var(--muted)] block font-medium">TOTAL IN DB:</span>
                          <span className="font-bold">{uploadResult.totalStudentsInDb} students</span>
                        </div>
                      </div>
                      <div className="pt-2 text-[11px] text-[var(--muted)]">
                        Sample processed students:{' '}
                        <span className="font-semibold text-[var(--ink)]">
                          {uploadResult.sampleProcessed.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MASTER STUDENT ROSTER */}
              {activeTab === 'roster' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search student email or name..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      />
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => fetchOverview(passcode)}
                        className="p-2 rounded-full border border-[var(--line-strong)] bg-[var(--card-bg)] text-[var(--ink)] hover:bg-[var(--panel)] transition cursor-pointer"
                        title="Refresh Roster"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingOverview ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={downloadMasterCsv}
                        className="button button-dark text-xs py-1.5 px-3.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="border border-[var(--line-strong)] rounded-xl overflow-hidden overflow-x-auto bg-[var(--card-bg)] shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--paper-2)] border-b border-[var(--line-strong)] text-[var(--ink)]">
                        <tr>
                          <th className="py-3 px-4 font-bold">Student / Email</th>
                          <th className="py-3 px-4 font-bold">College</th>
                          <th className="py-3 px-4 font-bold text-center">Progress</th>
                          <th className="py-3 px-4 font-bold text-center">Vault Status</th>
                          <th className="py-3 px-4 font-bold text-right">Plans Toggle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {overview?.students
                          ?.filter((s: any) =>
                            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.fullName && s.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                          ?.map((student: any) => (
                            <tr key={student.email} className="hover:bg-[var(--paper)] transition">
                              <td className="py-3 px-4">
                                <div className="font-bold text-[var(--ink)] truncate max-w-[200px]">
                                  {student.fullName || student.email.split('@')[0]}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] text-[var(--muted)] truncate max-w-[140px]">
                                    {student.email}
                                  </span>
                                  {student.learnUserId && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold" title="Microsoft Learn User ID">
                                      @{student.learnUserId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[var(--muted)] truncate max-w-[150px]">
                                {student.college || '—'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="font-bold text-[var(--ink)]">
                                  {student.completedCount} / {student.totalPlans}
                                </span>{' '}
                                <span className="text-[11px] text-[var(--muted)]">
                                  ({student.progressPercentage}%)
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {student.isUnlocked ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--acid)] text-[var(--ink)] text-[10px] font-bold">
                                    UNLOCKED
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--muted)] text-[10px] font-semibold">
                                    LOCKED
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {plans.map((p, pIdx) => {
                                    const isDone = student.completedPlanIds.includes(p.id);
                                    return (
                                      <button
                                        key={p.id}
                                        onClick={() => handleToggleStudentPlan(student.email, p.id)}
                                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition flex items-center justify-center border cursor-pointer ${
                                          isDone
                                            ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]'
                                            : 'bg-white hover:bg-[var(--panel)] border-[var(--line-strong)] text-[var(--muted)]'
                                        }`}
                                        title={`Toggle Plan ${pIdx + 1}: ${p.title}`}
                                      >
                                        P{pIdx + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SECRET VAULT CONFIGURATION */}
              {activeTab === 'vault' && (
                <form onSubmit={handleSaveVault} className="space-y-4 max-w-2xl">
                  <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs text-[var(--muted)] leading-relaxed">
                    <p className="font-bold text-[var(--ink)] mb-1">Protected Server Vault Resources</p>
                    These protected URLs and tokens are housed securely on the server and are only transmitted to authenticated students who have achieved 100% verified completion.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                      Secret GitHub Repository URL (7B Tokens / Claude Code Sandbox):
                    </label>
                    <input
                      type="url"
                      value={vaultConfig.githubRepoUrl}
                      onChange={(e) =>
                        setVaultConfig({ ...vaultConfig, githubRepoUrl: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                      Fallback YouTube Tutorial Masterclass URL:
                    </label>
                    <input
                      type="url"
                      value={vaultConfig.youtubeTutorialUrl}
                      onChange={(e) =>
                        setVaultConfig({ ...vaultConfig, youtubeTutorialUrl: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                      Secret Access Token / Passkey (Displayed to 100% Completers):
                    </label>
                    <input
                      type="text"
                      value={vaultConfig.secretAccessToken}
                      onChange={(e) =>
                        setVaultConfig({ ...vaultConfig, secretAccessToken: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] font-mono text-xs focus:outline-none focus:border-[var(--ink)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                      Vault Unlock Instructions / Congratulations:
                    </label>
                    <textarea
                      value={vaultConfig.unlockInstructions}
                      onChange={(e) =>
                        setVaultConfig({ ...vaultConfig, unlockInstructions: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={isSavingVault}
                      className="button button-dark text-xs py-2 px-5"
                    >
                      {isSavingVault ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Secrets...</span>
                        </>
                      ) : (
                        <>
                          <span>Update Vault Configuration</span>
                          <span className="arrow-badge">→</span>
                        </>
                      )}
                    </button>

                    {vaultSaveSuccess && (
                      <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Vault updated successfully!
                      </span>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
