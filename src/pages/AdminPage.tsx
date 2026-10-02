import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  KeyRound,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Save,
  LogOut,
  ShieldCheck,
  ArrowLeft,
  Sun,
  Moon,
  BookOpen,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  ExternalLink,
  Lightbulb,
  UserPlus,
  Edit3,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  Minus,
  Copy,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { LearnPlan, CsvUploadResult, GuideStep } from '../types.js';

interface AdminPageProps {
  plans: LearnPlan[];
  onNavigateHome: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onRefreshData?: () => void;
}

// Helper to map track metadata and color accents matching the main platform curriculum tracks
export function getTrackDisplayMeta(p: LearnPlan, idx: number) {
  const title = (p?.title || '').toLowerCase();
  const id = (p?.id || '').toLowerCase();
  if (id.includes('vibe') || id.includes('agent') || title.includes('agent') || idx === 0) {
    return {
      short: 'AI & Agents',
      color: 'purple',
      badge: p?.badgeTitle || 'Agentic AI Architect',
      doneClass: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-2xs',
      activeText: 'text-purple-600 dark:text-purple-400',
    };
  }
  if (id.includes('git') || title.includes('git') || idx === 1) {
    return {
      short: 'Git & GitHub',
      color: 'green',
      badge: p?.badgeTitle || 'Git Systems Builder',
      doneClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs',
      activeText: 'text-emerald-600 dark:text-emerald-400',
    };
  }
  if (id.includes('iot') || title.includes('iot') || idx === 2) {
    return {
      short: 'IoT Fundamentals',
      color: 'blue',
      badge: p?.badgeTitle || 'IoT Cloud Specialist',
      doneClass: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-700 shadow-2xs',
      activeText: 'text-sky-600 dark:text-sky-400',
    };
  }
  if (id.includes('python') || title.includes('python') || idx === 3) {
    return {
      short: 'Python',
      color: 'amber',
      badge: p?.badgeTitle || 'Python Dev Craftsman',
      doneClass: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 shadow-2xs',
      activeText: 'text-amber-600 dark:text-amber-400',
    };
  }
  return {
    short: p?.badgeTitle || `Track ${idx + 1}`,
    color: p?.colorAccent || 'blue',
    badge: p?.badgeTitle || `Track ${idx + 1}`,
    doneClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs',
    activeText: 'text-emerald-600 dark:text-emerald-400',
  };
}

export const AdminPage: React.FC<AdminPageProps> = ({
  plans,
  onNavigateHome,
  theme,
  onToggleTheme,
  onRefreshData,
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'upload' | 'vault' | 'guide'>('roster');

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct Student Management & Filters state
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'in-progress' | 'zero'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<any | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [studentModalError, setStudentModalError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    learnUserId: '',
    college: '',
    password: 'azure2026',
    referralsCount: 0,
    completedPlanIds: [] as string[],
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    learnUserId: '',
    college: '',
    newPassword: '',
    referralsCount: 0,
    completedPlanIds: [] as string[],
  });
  const [showEditPassword, setShowEditPassword] = useState(false);

  // CSV Upload state
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || 'auto');
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

  // Guide editing state
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(0);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [isSavingGuide, setIsSavingGuide] = useState(false);
  const [guideSaveSuccess, setGuideSaveSuccess] = useState(false);
  const [guideSaveError, setGuideSaveError] = useState<string | null>(null);

  // Slide to Start Gate state & commands
  const [slideStartMode, setSlideStartMode] = useState<'first_login' | 'every_login' | 'disabled'>('first_login');
  const [isUpdatingSlideMode, setIsUpdatingSlideMode] = useState(false);
  const [isResettingAllSlide, setIsResettingAllSlide] = useState(false);
  const [isResettingSanish, setIsResettingSanish] = useState(false);
  const [showCliCommands, setShowCliCommands] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('mlsa_admin_token');
    if (savedToken) {
      setPasscode(savedToken);
      verifyLogin(savedToken);
    }
  }, []);

  const fetchGuideSteps = async () => {
    setLoadingGuide(true);
    try {
      const res = await fetch('/api/guide');
      if (res.ok) {
        const data = await res.json();
        if (data.guideSteps && Array.isArray(data.guideSteps)) {
          setGuideSteps(data.guideSteps);
        }
      }
    } catch (err) {
      console.error('Failed to load guide steps:', err);
    } finally {
      setLoadingGuide(false);
    }
  };

  const handleUpdateStepField = (field: keyof GuideStep, value: any) => {
    setGuideSteps((prev) => {
      const updated = [...prev];
      if (!updated[selectedStepIdx]) return prev;
      updated[selectedStepIdx] = {
        ...updated[selectedStepIdx],
        [field]: value,
      };
      return updated;
    });
  };

  const handleUpdateStepImage = (imgIdx: number, newUrl: string) => {
    setGuideSteps((prev) => {
      const updated = [...prev];
      const cur = updated[selectedStepIdx];
      if (!cur) return prev;
      const images = [...(cur.images || [])];
      images[imgIdx] = newUrl;
      updated[selectedStepIdx] = {
        ...cur,
        images,
        imageUrl: images[0] || '',
      };
      return updated;
    });
  };

  const handleAddStepImage = () => {
    setGuideSteps((prev) => {
      const updated = [...prev];
      const cur = updated[selectedStepIdx];
      if (!cur) return prev;
      const images = [...(cur.images || [])];
      if (images.length >= 3) return prev;
      images.push('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80');
      updated[selectedStepIdx] = {
        ...cur,
        images,
        imageUrl: images[0] || '',
      };
      return updated;
    });
  };

  const handleRemoveStepImage = (imgIdx: number) => {
    setGuideSteps((prev) => {
      const updated = [...prev];
      const cur = updated[selectedStepIdx];
      if (!cur) return prev;
      const images = [...(cur.images || [])];
      images.splice(imgIdx, 1);
      updated[selectedStepIdx] = {
        ...cur,
        images,
        imageUrl: images[0] || '',
      };
      return updated;
    });
  };

  const handleAddNewStep = () => {
    setGuideSteps((prev) => {
      const nextNum = prev.length + 1;
      const newStep: GuideStep = {
        id: `step-${Date.now()}`,
        stepNumber: nextNum,
        title: `New Guide Step ${nextNum}`,
        badge: 'General Guidance',
        description: 'Provide clear instructions for students in this step.',
        images: [
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
        ],
        tip: 'Pro-tip or reminder for learners.',
        actionText: 'Explore Module',
        actionLink: 'https://learn.microsoft.com',
      };
      return [...prev, newStep];
    });
    setSelectedStepIdx(guideSteps.length);
  };

  const handleDeleteStep = (idxToDelete: number) => {
    if (guideSteps.length <= 1) {
      alert('The guide must have at least one step.');
      return;
    }
    if (!confirm('Are you sure you want to delete this guide step?')) return;
    setGuideSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== idxToDelete);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
    if (selectedStepIdx >= idxToDelete && selectedStepIdx > 0) {
      setSelectedStepIdx(selectedStepIdx - 1);
    }
  };

  const handleMoveStep = (fromIdx: number, direction: 'up' | 'down') => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= guideSteps.length) return;
    setGuideSteps((prev) => {
      const copy = [...prev];
      const temp = copy[fromIdx];
      copy[fromIdx] = copy[toIdx];
      copy[toIdx] = temp;
      return copy.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
    setSelectedStepIdx(toIdx);
  };

  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGuide(true);
    setGuideSaveSuccess(false);
    setGuideSaveError(null);

    try {
      const res = await fetch('/api/admin/guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ guideSteps }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save guide steps');
      }

      setGuideSaveSuccess(true);
      setTimeout(() => setGuideSaveSuccess(false), 3000);
      onRefreshData?.();
    } catch (err: any) {
      setGuideSaveError(err.message || 'Error saving guide steps');
    } finally {
      setIsSavingGuide(false);
    }
  };

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
        fetchOverview(code);
        fetchGuideSteps();
      } else {
        setIsAuthenticated(false);
        setAuthError(data.error || 'Invalid administrator passcode');
      }
    } catch {
      setIsAuthenticated(false);
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
        if (data.slideStartMode) {
          setSlideStartMode(data.slideStartMode);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setUploadError('Please select a student attendance CSV file.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('planId', selectedPlanId);

    try {
      const res = await fetch('/api/admin/upload-csv', {
        method: 'POST',
        headers: {
          'x-admin-passcode': passcode,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and parse CSV roster');
      }

      setUploadResult(data);
      setCsvFile(null);
      const fileInput = document.getElementById('admin-page-csv-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchOverview(passcode);
      onRefreshData?.();
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during CSV upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const toggleStudentPlan = async (studentEmail: string, planIdToToggle: string, currentCompleted: boolean) => {
    // Optimistic UI update
    setOverview((prev: any) => {
      if (!prev?.students) return prev;
      const updatedStudents = prev.students.map((s: any) => {
        if (s.email.toLowerCase() === studentEmail.toLowerCase()) {
          const newCompleted = currentCompleted
            ? s.completedPlanIds.filter((id: string) => id !== planIdToToggle)
            : [...s.completedPlanIds, planIdToToggle];
          const compCount = newCompleted.length;
          const isUnlocked = (prev.plans.length > 0 && compCount >= prev.plans.length) || (s.referralsCount || 0) >= 7;
          return {
            ...s,
            completedPlanIds: newCompleted,
            completedCount: compCount,
            progressPercentage: prev.plans.length > 0 ? Math.round((compCount / prev.plans.length) * 100) : 0,
            isUnlocked,
          };
        }
        return s;
      });
      return {
        ...prev,
        students: updatedStudents,
        unlockedStudents: updatedStudents.filter((s: any) => s.isUnlocked).length,
      };
    });

    try {
      const res = await fetch('/api/admin/student/toggle-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({
          email: studentEmail,
          planId: planIdToToggle,
          completed: !currentCompleted,
        }),
      });

      if (res.ok) {
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        fetchOverview(passcode);
      }
    } catch (err) {
      console.error('Failed to toggle student plan:', err);
      fetchOverview(passcode);
    }
  };

  const handleToggleAllPlans = async (studentEmail: string, unlockAll: boolean) => {
    try {
      const res = await fetch('/api/admin/student/toggle-all-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({
          email: studentEmail,
          unlockAll,
        }),
      });

      if (res.ok) {
        showNotification(
          'success',
          unlockAll
            ? `Granted 100% completion & unlocked vault for ${studentEmail}`
            : `Reset all track completions for ${studentEmail}`
        );
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        const data = await res.json();
        showNotification('error', data.error || 'Failed to update plans');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update plans');
    }
  };

  const handleAdjustReferrals = async (studentEmail: string, currentCount: number, delta: number) => {
    const newCount = Math.max(0, currentCount + delta);
    // Optimistic update
    setOverview((prev: any) => {
      if (!prev?.students) return prev;
      const updated = prev.students.map((s: any) => {
        if (s.email.toLowerCase() === studentEmail.toLowerCase()) {
          const isUnlocked = (prev.plans.length > 0 && s.completedCount >= prev.plans.length) || newCount >= 7;
          return { ...s, referralsCount: newCount, isUnlocked };
        }
        return s;
      });
      return { ...prev, students: updated };
    });

    try {
      const res = await fetch('/api/admin/student/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({
          email: studentEmail,
          referralsCount: newCount,
        }),
      });

      if (res.ok) {
        fetchOverview(passcode);
        onRefreshData?.();
      }
    } catch (err) {
      console.error('Failed to update referral count:', err);
    }
  };

  const handleUpdateSlideMode = async (mode: 'first_login' | 'every_login' | 'disabled') => {
    setIsUpdatingSlideMode(true);
    try {
      const res = await fetch('/api/admin/slide-start-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setSlideStartMode(mode);
        showNotification('success', data.message || `Slide to Start mode set to ${mode}`);
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        showNotification('error', data.error || 'Failed to update slide gate policy');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to update slide gate policy');
    } finally {
      setIsUpdatingSlideMode(false);
    }
  };

  const handleResetAllSlideStart = async () => {
    if (!window.confirm('Reset Slide to Start for ALL registered students? On next login, every student will be gated by Slide to Start.')) {
      return;
    }
    setIsResettingAllSlide(true);
    try {
      const res = await fetch('/api/admin/reset-all-slide-start', {
        method: 'POST',
        headers: {
          'x-admin-passcode': passcode,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'Reset Slide to Start for all students!');
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        showNotification('error', data.error || 'Failed to reset all slide start');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset all slide start');
    } finally {
      setIsResettingAllSlide(false);
    }
  };

  const handleToggleStudentSlideStart = async (email: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/student/toggle-slide-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ email, hasStartedTrack: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          'success',
          !currentStatus
            ? `Marked Slide to Start as passed for ${email}`
            : `Reset Slide to Start for ${email} (will slide on next login)`
        );
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        showNotification('error', data.error || 'Failed to toggle slide status');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to toggle slide status');
    }
  };

  const handleResetSanishAccount = async () => {
    setIsResettingSanish(true);
    try {
      const res = await fetch('/api/admin/reset-student-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify({ identifier: 'SanishDalvi-1627' }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || 'SanishDalvi-1627 reset as brand new user!');
        fetchOverview(passcode);
        onRefreshData?.();
      } else {
        showNotification('error', data.error || 'Failed to reset SanishDalvi-1627');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to reset SanishDalvi-1627');
    } finally {
      setIsResettingSanish(false);
    }
  };

  const handleOpenEditModal = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.fullName || '',
      email: student.email,
      learnUserId: student.learnUserId || '',
      college: student.college || '',
      newPassword: '',
      referralsCount: student.referralsCount || 0,
      completedPlanIds: [...(student.completedPlanIds || [])],
    });
    setStudentModalError(null);
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsStudentSubmitting(true);
    setStudentModalError(null);

    try {
      const payload: any = {
        email: editingStudent.email,
        fullName: editForm.fullName.trim(),
        learnUserId: editForm.learnUserId.trim(),
        college: editForm.college.trim(),
        referralsCount: editForm.referralsCount,
        completedPlanIds: editForm.completedPlanIds,
      };

      if (editForm.newPassword.trim()) {
        if (editForm.newPassword.trim().length < 4) {
          throw new Error('New password must be at least 4 characters long.');
        }
        payload.password = editForm.newPassword.trim();
      }

      const res = await fetch('/api/admin/student/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update student');
      }

      showNotification('success', data.message || `Student ${editingStudent.email} updated successfully!`);
      setEditingStudent(null);
      fetchOverview(passcode);
      onRefreshData?.();
    } catch (err: any) {
      setStudentModalError(err.message || 'Error saving student');
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email.trim()) {
      setStudentModalError('Please enter a student email address.');
      return;
    }
    setIsStudentSubmitting(true);
    setStudentModalError(null);

    try {
      const res = await fetch('/api/admin/student/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-passcode': passcode,
        },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create student');
      }

      showNotification('success', data.message || 'Student created successfully!');
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        learnUserId: '',
        college: '',
        password: 'azure2026',
        referralsCount: 0,
        completedPlanIds: [],
      });
      fetchOverview(passcode);
      onRefreshData?.();
    } catch (err: any) {
      setStudentModalError(err.message || 'Error creating student');
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handleDeleteStudent = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/student/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-passcode': passcode,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      showNotification('success', `Student ${email} has been removed.`);
      setDeleteConfirmStudent(null);
      fetchOverview(passcode);
      onRefreshData?.();
    } catch (err: any) {
      showNotification('error', err.message || 'Error deleting student');
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
        body: JSON.stringify(vaultConfig),
      });

      if (res.ok) {
        setVaultSaveSuccess(true);
        setTimeout(() => setVaultSaveSuccess(false), 3000);
        onRefreshData?.();
      }
    } catch (err) {
      console.error('Failed to save vault settings:', err);
    } finally {
      setIsSavingVault(false);
    }
  };

  const downloadMasterCsv = () => {
    window.open(`/api/admin/export-master-csv?token=${encodeURIComponent(passcode)}`, '_blank');
  };

  const filteredStudents = overview?.students?.filter((s: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        s.email.toLowerCase().includes(q) ||
        (s.fullName && s.fullName.toLowerCase().includes(q)) ||
        (s.learnUserId && s.learnUserId.toLowerCase().includes(q)) ||
        (s.college && s.college.toLowerCase().includes(q)) ||
        (s.inviteCode && s.inviteCode.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterStatus === 'unlocked') return s.isUnlocked;
    if (filterStatus === 'in-progress') return !s.isUnlocked && s.completedCount > 0;
    if (filterStatus === 'zero') return s.completedCount === 0 && (s.referralsCount || 0) < 7;
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col transition-colors">
      {/* Coordinator Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[var(--paper)]/95 backdrop-blur-md border-b border-[var(--line-strong)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--card-bg)] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Platform</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="mark" aria-hidden="true">
                <i></i><i></i><i></i><i></i>
              </span>
              <div className="leading-tight">
                <h1 className="text-sm sm:text-base font-bold text-[var(--ink)]">
                  Coordinator Control Center
                </h1>
                <p className="text-[11px] text-[var(--muted)] hidden sm:block">
                  Student Welfare Project · Official Learn Verification Portal
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--card-bg)] text-[var(--ink)] transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--acid)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--ink)]" />
              )}
            </button>

            {isAuthenticated && (
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Logged In as Coordinator</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </span>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-full border border-[var(--line-strong)] hover:border-rose-400 hover:bg-rose-50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!isAuthenticated ? (
          /* AUTHENTICATION VIEW */
          <div className="max-w-md mx-auto my-12 p-8 sm:p-10 rounded-2xl border border-[var(--line-strong)] bg-[var(--card-bg)] text-center space-y-6 shadow-xl">
            <div className="w-14 h-14 rounded-full border border-[var(--line-strong)] bg-[var(--paper-2)] text-[var(--ink)] mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">
                Coordinator Sign In
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1.5">
                Authorized chapter coordinators & leads only. Enter your administrator passcode to proceed.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter administrator passcode..."
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-sm focus:outline-none focus:border-[var(--ink)] transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                  title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                <span>Authenticate &amp; Open Control Center</span>
                <span className="arrow-badge">→</span>
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED CONSOLE VIEW */
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex border-b border-[var(--line)] bg-[var(--paper-2)] rounded-xl p-1 text-xs font-bold uppercase tracking-wider overflow-x-auto">
              <button
                onClick={() => setActiveTab('roster')}
                className={`py-2.5 px-4 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Students &amp; Progress Console</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2.5 px-4 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>2. Bulk CSV Roster Import</span>
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`py-2.5 px-4 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'vault'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>3. Secret Vault Config</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('guide');
                  if (guideSteps.length === 0) fetchGuideSteps();
                }}
                className={`py-2.5 px-4 rounded-lg transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>4. Student Guide &amp; Images</span>
              </button>
            </div>

            {/* TAB 1: CSV UPLOAD */}
            {activeTab === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs text-[var(--muted)] leading-relaxed">
                    <p className="font-bold text-[var(--ink)] mb-1">
                      In-Memory Roster Stream Aggregator
                    </p>
                    Uploaded CSV files are parsed and immediately aggregated into the student database. Supports matching by <strong>Email</strong> and/or <strong>Microsoft Learn User ID</strong> (e.g. usernames from Cloud Skills Challenge leaderboards).
                  </div>

                  <form onSubmit={handleFileUpload} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                        Target Track / Processing Mode:
                      </label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                      >
                        <option value="auto">
                          ✨ Auto-Detect from CSV (Binary 0/1 Matrix or "Completed Plans" column)
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
                        Select Student Attendance CSV File:
                      </label>
                      <div className="border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--ink)] rounded-2xl p-6 text-center bg-[var(--card-bg)] transition">
                        <FileSpreadsheet className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-2" />
                        <div className="text-xs text-[var(--ink)] mb-2 font-semibold">
                          {csvFile ? (
                            <span className="text-emerald-700 font-bold">{csvFile.name}</span>
                          ) : (
                            <span>Drag and drop CSV here, or browse files</span>
                          )}
                        </div>
                        <input
                          id="admin-page-csv-file-input"
                          type="file"
                          accept=".csv"
                          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          className="text-xs text-[var(--muted)] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--ink)] file:text-[var(--paper)] hover:file:opacity-90 cursor-pointer"
                        />
                        <p className="text-[11px] text-[var(--muted-2)] mt-2">
                          Supported column headers: Email, Learn User ID, Username, Full Name, College, AZ-900, Copilot, AI-900, Security.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
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
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing CSV Stream...</span>
                          </>
                        ) : (
                          <>
                            <span>Upload &amp; Verify Roster</span>
                            <span className="arrow-badge">↑</span>
                          </>
                        )}
                      </button>
                    </div>

                    {uploadError && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {uploadResult && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-600/40 text-[var(--ink)] text-xs space-y-2">
                        <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Roster Ingested Successfully!</span>
                        </div>
                        <p className="text-[var(--muted)]">
                          Processed <strong>{uploadResult.processedCount}</strong> student rows. Granted{' '}
                          <strong>{uploadResult.newCompletionsCount}</strong> track completions. Database now contains{' '}
                          <strong>{uploadResult.totalStudentsInDb}</strong> registered students.
                        </p>
                      </div>
                    )}
                  </form>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div className="p-5 rounded-2xl border border-[var(--line-strong)] bg-[var(--card-bg)] space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Learn User ID Guidance</span>
                    </h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Microsoft Learn Cloud Skills Challenge exports list students by their <strong>User ID / Profile Username</strong>.
                    </p>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Instruct students to link their Microsoft Learn User ID in their profile. Our system seamlessly reconciles attendance rosters regardless of whether email or Learn User ID is provided!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: MASTER STUDENTS & LIVE PROGRESS CONSOLE (DIRECT EDIT) */}
            {activeTab === 'roster' && (
              <div className="space-y-6">
                {/* Notification Toast */}
                {notification && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all animate-fadeIn ${
                      notification.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {notification.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{notification.message}</span>
                    </div>
                    <button
                      onClick={() => setNotification(null)}
                      className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Direct Control Explainer Banner */}
                <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--acid)]/15 border border-[var(--acid)]/30 text-[var(--acid)] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--ink)] text-xs">
                        Direct In-Platform Student Progress Console
                      </h3>
                      <p className="text-[11px] text-[var(--muted)]">
                        Click any track badge directly (AI &amp; Agents, Git &amp; GitHub, IoT Fundamentals, Python) or use inline referral adjusters to update live student progress instantly — no CSV re-upload needed!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setStudentModalError(null);
                      setIsCreateModalOpen(true);
                    }}
                    className="button button-dark text-xs py-2 px-4 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Register Student</span>
                  </button>
                </div>

                {/* SLIDE TO START LAUNCH GATE POLICY & ADMIN COMMAND CONSOLE */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs shadow-xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[var(--line)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-[var(--ink)] text-sm tracking-tight">
                            Slide to Start Launch Gate Policy
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border uppercase tracking-wider ${
                              slideStartMode === 'every_login'
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                : slideStartMode === 'disabled'
                                ? 'bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-400'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {slideStartMode === 'every_login'
                              ? 'Enforced on Every Login'
                              : slideStartMode === 'disabled'
                              ? 'Disabled / Bypassed'
                              : 'First Login Only (Default)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          Configure whether students must swipe the tactile Slide to Start unlock gate on their first login or on every login session.
                        </p>
                      </div>
                    </div>

                    {/* Mode Selector Buttons */}
                    <div className="flex items-center bg-[var(--paper-2)] p-1 rounded-xl border border-[var(--line-strong)] gap-1 shrink-0 overflow-x-auto">
                      <button
                        onClick={() => handleUpdateSlideMode('first_login')}
                        disabled={isUpdatingSlideMode}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          slideStartMode === 'first_login'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                        title="Require Slide to Start once for new users on their very first login"
                      >
                        <Check className={`w-3.5 h-3.5 ${slideStartMode === 'first_login' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>First Login (Default)</span>
                      </button>

                      <button
                        onClick={() => handleUpdateSlideMode('every_login')}
                        disabled={isUpdatingSlideMode}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          slideStartMode === 'every_login'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                        title="Require Slide to Start on EVERY login session for all users"
                      >
                        <Check className={`w-3.5 h-3.5 ${slideStartMode === 'every_login' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>Every Login</span>
                      </button>

                      <button
                        onClick={() => handleUpdateSlideMode('disabled')}
                        disabled={isUpdatingSlideMode}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          slideStartMode === 'disabled'
                            ? 'bg-slate-700 text-white shadow-2xs'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                        title="Bypass Slide to Start completely"
                      >
                        <Check className={`w-3.5 h-3.5 ${slideStartMode === 'disabled' ? 'opacity-100' : 'opacity-0'}`} />
                        <span>Disabled</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Action Commands */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleResetAllSlideStart}
                        disabled={isResettingAllSlide}
                        className="px-3.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Reset Slide to Start status for ALL students in the database"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isResettingAllSlide ? 'animate-spin' : ''}`} />
                        <span>Reset Slide for ALL Users</span>
                      </button>

                      <button
                        onClick={handleResetSanishAccount}
                        disabled={isResettingSanish}
                        className="px-3.5 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-900 dark:text-indigo-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="Reset SanishDalvi-1627 as fresh new user with Slide to Start active"
                      >
                        <UserPlus className={`w-3.5 h-3.5 ${isResettingSanish ? 'animate-spin' : ''}`} />
                        <span>Re-register &amp; Reset SanishDalvi-1627</span>
                      </button>
                    </div>

                    <button
                      onClick={() => setShowCliCommands(!showCliCommands)}
                      className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)] font-mono flex items-center gap-1 cursor-pointer transition"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{showCliCommands ? 'Hide CLI Commands' : 'View Admin CLI Commands'}</span>
                      {showCliCommands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Copyable CLI Commands Drawer */}
                  {showCliCommands && (
                    <div className="p-3.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[11px] font-mono space-y-2 mt-2">
                      <div className="font-bold text-[var(--ink)] flex items-center justify-between">
                        <span>Terminal / cURL Command Reference:</span>
                        <span className="text-[10px] text-[var(--muted)] font-normal">Direct HTTP execution against backend</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="bg-[var(--card-bg)] p-2 rounded-lg border border-[var(--line)] flex items-center justify-between gap-2 overflow-x-auto">
                          <code className="text-[var(--ink)]">
                            curl -X POST http://localhost:3000/api/admin/slide-start-mode -H "Content-Type: application/json" -H "x-admin-passcode: {passcode || 'zxcvbnm,./'}" -d '{`{"mode":"every_login"}`}'
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`curl -X POST http://localhost:3000/api/admin/slide-start-mode -H "Content-Type: application/json" -H "x-admin-passcode: ${passcode || 'zxcvbnm,./'}" -d '{"mode":"every_login"}'`);
                              showNotification('success', 'Copied command to clipboard!');
                            }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="bg-[var(--card-bg)] p-2 rounded-lg border border-[var(--line)] flex items-center justify-between gap-2 overflow-x-auto">
                          <code className="text-[var(--ink)]">
                            curl -X POST http://localhost:3000/api/admin/reset-all-slide-start -H "x-admin-passcode: {passcode || 'zxcvbnm,./'}"
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`curl -X POST http://localhost:3000/api/admin/reset-all-slide-start -H "x-admin-passcode: ${passcode || 'zxcvbnm,./'}"`);
                              showNotification('success', 'Copied command to clipboard!');
                            }}
                            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KPI Metrics Summary */}
                {overview && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div
                      onClick={() => setFilterStatus('all')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        filterStatus === 'all'
                          ? 'border-[var(--ink)] bg-[var(--paper-2)]'
                          : 'border-[var(--line-strong)] bg-[var(--card-bg)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
                        <span>Total Students</span>
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[var(--ink)] mt-1">
                        {overview?.students?.length || 0}
                      </div>
                      <div className="text-[10px] text-[var(--muted-2)] mt-0.5">All registered accounts</div>
                    </div>

                    <div
                      onClick={() => setFilterStatus('unlocked')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        filterStatus === 'unlocked'
                          ? 'border-emerald-600 bg-emerald-500/10'
                          : 'border-[var(--line-strong)] bg-[var(--card-bg)] hover:border-emerald-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                        <span>100% Unlocked</span>
                        <Unlock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                        {(overview?.students || []).filter((s: any) => s.isUnlocked).length}
                      </div>
                      <div className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">Vault access granted</div>
                    </div>

                    <div
                      onClick={() => setFilterStatus('in-progress')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        filterStatus === 'in-progress'
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-[var(--line-strong)] bg-[var(--card-bg)] hover:border-amber-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center justify-between">
                        <span>In Progress</span>
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                        {(overview?.students || []).filter((s: any) => !s.isUnlocked && s.completedCount > 0).length}
                      </div>
                      <div className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-0.5">Partial tracks verified</div>
                    </div>

                    <div
                      onClick={() => setFilterStatus('zero')}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        filterStatus === 'zero'
                          ? 'border-slate-500 bg-slate-500/10'
                          : 'border-[var(--line-strong)] bg-[var(--card-bg)] hover:border-slate-500'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
                        <span>0 Completions</span>
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-[var(--ink)] mt-1">
                        {(overview?.students || []).filter((s: any) => s.completedCount === 0 && (s.referralsCount || 0) < 7).length}
                      </div>
                      <div className="text-[10px] text-[var(--muted-2)] mt-0.5">Awaiting verification</div>
                    </div>
                  </div>
                )}

                {/* Filter & Search Bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, email, Learn ID, college, or invite code..."
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills & Actions */}
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <div className="flex items-center bg-[var(--paper-2)] p-1 rounded-xl border border-[var(--line-strong)] text-[11px] font-semibold">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          filterStatus === 'all'
                            ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-2xs font-bold'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        All ({overview?.students?.length || 0})
                      </button>
                      <button
                        onClick={() => setFilterStatus('unlocked')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          filterStatus === 'unlocked'
                            ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        Unlocked ({(overview?.students || []).filter((s: any) => s.isUnlocked).length})
                      </button>
                      <button
                        onClick={() => setFilterStatus('in-progress')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          filterStatus === 'in-progress'
                            ? 'bg-amber-600 text-white shadow-2xs font-bold'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => setFilterStatus('zero')}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          filterStatus === 'zero'
                            ? 'bg-slate-700 text-white shadow-2xs font-bold'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        0 Done
                      </button>
                    </div>

                    <button
                      onClick={() => fetchOverview(passcode)}
                      className="p-2 rounded-xl border border-[var(--line-strong)] bg-[var(--card-bg)] text-[var(--ink)] hover:bg-[var(--panel)] transition cursor-pointer"
                      title="Refresh Student Roster"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                      onClick={downloadMasterCsv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--line-strong)] bg-[var(--card-bg)] hover:bg-[var(--panel)] text-[var(--ink)] text-xs font-semibold transition cursor-pointer"
                      title="Download full progress roster as CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Export Master CSV</span>
                    </button>
                  </div>
                </div>

                {/* Direct Interactive Students Table */}
                <div className="border border-[var(--line-strong)] rounded-2xl overflow-hidden overflow-x-auto bg-[var(--card-bg)] shadow-sm">
                  <table className="w-full min-w-[840px] text-left text-xs">
                    <thead className="bg-[var(--paper-2)] border-b border-[var(--line-strong)] text-[var(--ink)] select-none">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Student Account</th>
                        <th className="py-3.5 px-4 font-bold">Microsoft Learn ID</th>
                        <th className="py-3.5 px-3 font-bold text-center">Slide to Start</th>
                        <th className="py-3.5 px-4 font-bold text-center">Referrals (Direct Adjust)</th>
                        <th className="py-3.5 px-4 font-bold text-center">Progress %</th>
                        <th className="py-3.5 px-4 font-bold text-center">Vault Status</th>
                        <th className="py-3.5 px-4 font-bold text-center">
                          Direct Track Toggles (Click to verify)
                        </th>
                        <th className="py-3.5 px-4 font-bold text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {filteredStudents && filteredStudents.length > 0 ? (
                        filteredStudents.map((s: any) => {
                          const isUnlocked = s.isUnlocked;
                          const progressPct = s.progressPercentage || 0;
                          const studentInitials = (s.fullName || s.email)
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase();

                          return (
                            <tr key={s.email} className="hover:bg-[var(--paper-2)]/40 transition">
                              {/* Student Name & Email */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] border border-[var(--line-strong)] text-[11px] font-bold text-[var(--ink)] flex items-center justify-center shrink-0">
                                    {studentInitials}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                                      <span>{s.fullName || 'Registered Student'}</span>
                                      {s.college && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)]">
                                          {s.college}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-mono text-[var(--muted)]">
                                      {s.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Microsoft Learn User ID */}
                              <td className="py-3 px-4">
                                {s.learnUserId ? (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--paper-2)] border border-[var(--line)]">
                                    <span className="font-mono text-[11px] font-semibold text-[var(--ink)]">
                                      {s.learnUserId}
                                    </span>
                                    <a
                                      href={`https://learn.microsoft.com/en-us/users/${s.learnUserId}/`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[var(--muted)] hover:text-[var(--ink)]"
                                      title="Open official Microsoft Learn profile"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleOpenEditModal(s)}
                                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline italic flex items-center gap-1"
                                    title="Click to link Microsoft Learn User ID"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Link Learn ID</span>
                                  </button>
                                )}
                              </td>

                              {/* Slide to Start Status & Instant Toggle */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={() => handleToggleStudentSlideStart(s.email, Boolean(s.hasStartedTrack))}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                                    s.hasStartedTrack
                                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-700'
                                      : 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-700'
                                  }`}
                                  title={
                                    s.hasStartedTrack
                                      ? 'User completed Slide to Start. Click to reset to Unstarted (forces slide on next login).'
                                      : 'User is pending Slide to Start. Click to mark as Passed / Bypassed.'
                                  }
                                >
                                  {s.hasStartedTrack ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Slid / Passed</span>
                                    </>
                                  ) : (
                                    <>
                                      <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                                      <span>Pending Slide</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Referrals with Direct Inline Adjuster */}
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1 bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-lg p-0.5">
                                  <button
                                    onClick={() => handleAdjustReferrals(s.email, s.referralsCount || 0, -1)}
                                    disabled={(s.referralsCount || 0) <= 0}
                                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--card-bg)] text-[var(--ink)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                    title="Decrease referral count by 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span
                                    className={`px-2 text-xs font-bold font-mono ${
                                      (s.referralsCount || 0) >= 7
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-[var(--ink)]'
                                    }`}
                                  >
                                    {s.referralsCount || 0} / 7
                                  </span>
                                  <button
                                    onClick={() => handleAdjustReferrals(s.email, s.referralsCount || 0, 1)}
                                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-[var(--card-bg)] text-[var(--ink)] transition cursor-pointer"
                                    title="Increase referral count by 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>

                              {/* Progress Fraction & Bar */}
                              <td className="py-3 px-4 text-center">
                                <div className="w-24 mx-auto space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-[var(--ink)]">{s.completedCount}/{s.totalPlans}</span>
                                    <span className="text-[var(--muted)] text-[10px]">{progressPct}%</span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        progressPct === 100
                                          ? 'bg-emerald-500'
                                          : progressPct > 0
                                          ? 'bg-[var(--acid)]'
                                          : 'bg-transparent'
                                      }`}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Vault Status */}
                              <td className="py-3 px-4 text-center">
                                {isUnlocked ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>UNLOCKED</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-[var(--muted)] text-[10px] font-semibold">
                                    <Lock className="w-3 h-3" />
                                    <span>LOCKED</span>
                                  </span>
                                )}
                              </td>

                              {/* Direct Interactive Track Toggles */}
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                                  {plans.map((p, idx) => {
                                    const isDone = s.completedPlanIds.includes(p.id);
                                    const meta = getTrackDisplayMeta(p, idx);

                                    return (
                                      <button
                                        key={p.id}
                                        onClick={() => toggleStudentPlan(s.email, p.id, isDone)}
                                        title={`${p.title} (${isDone ? 'COMPLETED - Click to mark Pending' : 'PENDING - Click to mark Completed'})`}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border cursor-pointer ${
                                          isDone
                                            ? meta.doneClass
                                            : 'bg-[var(--paper-2)] hover:bg-[var(--panel)] border-[var(--line-strong)] text-[var(--muted)] hover:text-[var(--ink)]'
                                        }`}
                                      >
                                        {isDone ? (
                                          <Check className="w-3 h-3 text-white" />
                                        ) : (
                                          <Plus className="w-3 h-3 text-[var(--muted-2)]" />
                                        )}
                                        <span>{meta.short}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>

                              {/* Row Action Buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {/* Quick Unlock 100% or Reset */}
                                  <button
                                    onClick={() => handleToggleAllPlans(s.email, s.completedCount < plans.length)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                      s.completedCount >= plans.length
                                        ? 'bg-[var(--paper-2)] border-[var(--line-strong)] text-[var(--muted)] hover:text-rose-600'
                                        : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20'
                                    }`}
                                    title={
                                      s.completedCount >= plans.length
                                        ? 'Reset all completed tracks'
                                        : 'Instantly grant 100% curriculum completion'
                                    }
                                  >
                                    {s.completedCount >= plans.length ? 'Reset' : '100%'}
                                  </button>

                                  {/* Edit Student Button */}
                                  <button
                                    onClick={() => handleOpenEditModal(s)}
                                    className="p-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--card-bg)] hover:bg-[var(--paper-2)] text-[var(--ink)] transition cursor-pointer"
                                    title="Edit student profile, password & details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Student Button */}
                                  <button
                                    onClick={() => setDeleteConfirmStudent(s)}
                                    className="p-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--card-bg)] hover:bg-rose-50 hover:border-rose-300 text-rose-600 transition cursor-pointer"
                                    title="Delete student record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-xs text-[var(--muted)] space-y-2">
                            <Users className="w-8 h-8 mx-auto text-[var(--muted-2)]" />
                            <div className="font-semibold text-[var(--ink)]">No students found</div>
                            <p className="text-[11px] text-[var(--muted)]">
                              Try clearing your search query or click "+ Register Student" to add a new student directly.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SECRET VAULT CONFIG */}
            {activeTab === 'vault' && (
              <form onSubmit={handleSaveVault} className="space-y-4 max-w-2xl">
                <div className="p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-xs text-[var(--muted)] leading-relaxed">
                  <p className="font-bold text-[var(--ink)] mb-1">Protected Server Vault Resources</p>
                  These protected URLs and instructions are guarded on the server and are transmitted only to students whose attendance is 100% verified.
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider mb-1">
                    Secret GitHub Repository URL (7B Models / Claude Code Sandbox):
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
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingVault ? 'Saving Changes...' : 'Save Vault Configuration'}</span>
                  </button>

                  {vaultSaveSuccess && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Saved successfully!</span>
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* TAB 4: STUDENT ONBOARDING GUIDE & MULTI-IMAGE MANAGEMENT */}
            {activeTab === 'guide' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)]">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>Student Roadmap &amp; Guide Manager</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                        Admin Only
                      </span>
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Control the step-by-step onboarding displayed to all students. Regular users cannot edit these instructions. You can attach 1 to 3 screenshots or illustrations per step.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAddNewStep}
                      className="px-3.5 py-1.5 rounded-xl border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Step</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveGuide}
                      disabled={isSavingGuide}
                      className="button button-dark text-xs py-1.5 px-4 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingGuide ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isSavingGuide ? 'Saving Guide...' : 'Save Guide to Platform'}</span>
                    </button>
                  </div>
                </div>

                {guideSaveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">Guide steps saved successfully! Students will see these updated steps and images immediately.</span>
                  </div>
                )}

                {guideSaveError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{guideSaveError}</span>
                  </div>
                )}

                {loadingGuide && guideSteps.length === 0 ? (
                  <div className="p-12 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--ink)]" />
                    <span>Loading guide configuration from server...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Step List & Reorder */}
                    <div className="lg:col-span-4 space-y-2">
                      <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider px-1 flex items-center justify-between">
                        <span>Roadmap Steps ({guideSteps.length})</span>
                        <span className="text-[11px] text-[var(--muted-2)]">Select to edit</span>
                      </div>

                      <div className="space-y-2">
                        {guideSteps.map((step, idx) => {
                          const isSelected = idx === selectedStepIdx;
                          return (
                            <div
                              key={step.id || idx}
                              onClick={() => setSelectedStepIdx(idx)}
                              className={`p-3 rounded-xl border transition flex items-center justify-between group cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--card-bg)] border-[var(--ink)] shadow-xs'
                                  : 'bg-[var(--paper-2)]/60 border-[var(--line)] hover:bg-[var(--card-bg)] hover:border-[var(--line-strong)]'
                              }`}
                            >
                              <div className="flex items-center space-x-3 truncate">
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                                    isSelected
                                      ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]'
                                      : 'bg-[var(--card-bg)] border-[var(--line-strong)] text-[var(--muted)]'
                                  }`}
                                >
                                  {step.stepNumber}
                                </div>
                                <div className="truncate">
                                  <div className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">
                                    {step.title || `Step ${step.stepNumber}`}
                                  </div>
                                  <div className="text-[11px] text-[var(--muted)] truncate">
                                    {step.badge} · {(step.images?.length || 0)} image(s)
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0 ml-2 opacity-80 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveStep(idx, 'up');
                                  }}
                                  disabled={idx === 0}
                                  className="p-1 rounded hover:bg-[var(--panel)] disabled:opacity-30 cursor-pointer"
                                  title="Move Up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5 text-[var(--muted)]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveStep(idx, 'down');
                                  }}
                                  disabled={idx === guideSteps.length - 1}
                                  className="p-1 rounded hover:bg-[var(--panel)] disabled:opacity-30 cursor-pointer"
                                  title="Move Down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteStep(idx);
                                  }}
                                  className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 transition cursor-pointer"
                                  title="Delete Step"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Step Editor */}
                    <div className="lg:col-span-8 bg-[var(--card-bg)] border border-[var(--line-strong)] rounded-2xl p-5 sm:p-6 space-y-5">
                      {guideSteps[selectedStepIdx] ? (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                            <div className="flex items-center space-x-2">
                              <span className="w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--paper)] text-xs font-bold flex items-center justify-center">
                                {guideSteps[selectedStepIdx].stepNumber}
                              </span>
                              <span className="text-xs font-bold text-[var(--ink)]">
                                Editing Step #{guideSteps[selectedStepIdx].stepNumber}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--muted)]">
                              Images Attached: {guideSteps[selectedStepIdx].images?.length || 0} / 3
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                                Step Title:
                              </label>
                              <input
                                type="text"
                                value={guideSteps[selectedStepIdx].title || ''}
                                onChange={(e) => handleUpdateStepField('title', e.target.value)}
                                placeholder="e.g. Set Up Your Microsoft Learn Profile"
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                                Category / Step Badge:
                              </label>
                              <input
                                type="text"
                                value={guideSteps[selectedStepIdx].badge || ''}
                                onChange={(e) => handleUpdateStepField('badge', e.target.value)}
                                placeholder="e.g. Mandatory First Step"
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                              Step Instructions / Description:
                            </label>
                            <textarea
                              rows={3}
                              value={guideSteps[selectedStepIdx].description || ''}
                              onChange={(e) => handleUpdateStepField('description', e.target.value)}
                              placeholder="Describe what the student should do..."
                              className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1 flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              <span>Pro Tip / Reminder:</span>
                            </label>
                            <input
                              type="text"
                              value={guideSteps[selectedStepIdx].tip || ''}
                              onChange={(e) => handleUpdateStepField('tip', e.target.value)}
                              placeholder="e.g. Ensure you are signed in with the same email used for chapter enrollment"
                              className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                                Action Button Text (Optional):
                              </label>
                              <input
                                type="text"
                                value={guideSteps[selectedStepIdx].actionText || ''}
                                onChange={(e) => handleUpdateStepField('actionText', e.target.value)}
                                placeholder="e.g. Open Learn Settings ↗"
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                                Action Target URL (Optional):
                              </label>
                              <input
                                type="url"
                                value={guideSteps[selectedStepIdx].actionLink || ''}
                                onChange={(e) => handleUpdateStepField('actionLink', e.target.value)}
                                placeholder="https://learn.microsoft.com/users/settings"
                                className="w-full px-3.5 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                              />
                            </div>
                          </div>

                          {/* MULTI-IMAGE MANAGEMENT (2-3 IMAGES PER STEP) */}
                          <div className="pt-2 border-t border-[var(--line)] space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Step Screenshots / Illustrations ({guideSteps[selectedStepIdx].images?.length || 0} / 3)</span>
                                </label>
                                <p className="text-[11px] text-[var(--muted)]">
                                  Add up to 3 high-resolution images or screenshots to guide students visually.
                                </p>
                              </div>

                              {(guideSteps[selectedStepIdx].images?.length || 0) < 3 && (
                                <button
                                  type="button"
                                  onClick={handleAddStepImage}
                                  className="px-3 py-1 rounded-lg border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper-2)] text-[var(--ink)] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Image URL</span>
                                </button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {(guideSteps[selectedStepIdx].images || []).map((imgUrl, imgIdx) => (
                                <div
                                  key={imgIdx}
                                  className="p-3 rounded-xl border border-[var(--line)] bg-[var(--paper-2)]/60 flex flex-col sm:flex-row items-center gap-3"
                                >
                                  <div className="w-full sm:w-28 h-20 rounded-lg overflow-hidden border border-[var(--line)] bg-black/10 shrink-0 flex items-center justify-center">
                                    <img
                                      src={imgUrl}
                                      alt={`Screenshot ${imgIdx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80';
                                      }}
                                    />
                                  </div>

                                  <div className="flex-1 w-full space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-[var(--ink)]">
                                        Screenshot {imgIdx + 1}
                                      </span>
                                      {(guideSteps[selectedStepIdx].images?.length || 0) > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveStepImage(imgIdx)}
                                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Remove</span>
                                        </button>
                                      )}
                                    </div>
                                    <input
                                      type="text"
                                      value={imgUrl}
                                      onChange={(e) => handleUpdateStepImage(imgIdx, e.target.value)}
                                      placeholder="https://... image URL or screenshot link"
                                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
                            <span className="text-xs text-[var(--muted)]">
                              Remember to click "Save Guide to Platform" to publish changes.
                            </span>
                            <button
                              type="button"
                              onClick={handleSaveGuide}
                              disabled={isSavingGuide}
                              className="button button-dark text-xs py-2 px-5 cursor-pointer flex items-center gap-2"
                            >
                              {isSavingGuide ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Save className="w-3.5 h-3.5" />
                              )}
                              <span>{isSavingGuide ? 'Saving Changes...' : 'Save Guide to Platform'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-[var(--muted)]">
                          Select a step on the left to begin editing, or click "+ Add New Step".
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: REGISTER NEW STUDENT (DIRECT ADD - NO CSV NEEDED) */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl bg-[var(--card-bg)] border border-[var(--line-strong)] shadow-2xl p-6 sm:p-7 space-y-5 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)]">Register Student Direct</h3>
                    <p className="text-[11px] text-[var(--muted)]">Add a student without uploading CSV</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {studentModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{studentModalError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Campus Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="student@campus.edu"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Microsoft Learn ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={createForm.learnUserId}
                      onChange={(e) => setCreateForm({ ...createForm, learnUserId: e.target.value })}
                      placeholder="e.g. alexmorgan-4029"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      value={createForm.college}
                      onChange={(e) => setCreateForm({ ...createForm, college: e.target.value })}
                      placeholder="e.g. College Name"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Initial Password
                    </label>
                    <input
                      type="text"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="azure2026"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Referrals Count
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={createForm.referralsCount}
                      onChange={(e) => setCreateForm({ ...createForm, referralsCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                {/* Pre-grant Completed Tracks */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                    Pre-Grant Verified Curriculum Tracks:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plans.map((p, idx) => {
                      const isChecked = createForm.completedPlanIds.includes(p.id);
                      const meta = getTrackDisplayMeta(p, idx);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--ink)] font-bold'
                              : 'bg-[var(--paper-2)] border-[var(--line-strong)] text-[var(--muted)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCreateForm({
                                  ...createForm,
                                  completedPlanIds: [...createForm.completedPlanIds, p.id],
                                });
                              } else {
                                setCreateForm({
                                  ...createForm,
                                  completedPlanIds: createForm.completedPlanIds.filter((id) => id !== p.id),
                                });
                              }
                            }}
                            className="rounded accent-emerald-600"
                          />
                          <span className="truncate">{meta.short} ({meta.badge})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--line-strong)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper-2)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isStudentSubmitting}
                    className="button button-dark text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isStudentSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{isStudentSubmitting ? 'Creating...' : 'Register Student'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT STUDENT & PROGRESS DIRECTLY */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-lg rounded-2xl bg-[var(--card-bg)] border border-[var(--line-strong)] shadow-2xl p-6 sm:p-7 space-y-5 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--ink)]">
                      Edit Student: {editingStudent.fullName || editingStudent.email}
                    </h3>
                    <p className="text-[11px] text-[var(--muted)]">Direct progress &amp; credential update</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper-2)] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {studentModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{studentModalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveStudentEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Campus Email (Unique Key)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={editForm.email}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)]/50 border border-[var(--line)] text-[var(--muted)] text-xs cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Microsoft Learn ID
                    </label>
                    <input
                      type="text"
                      value={editForm.learnUserId}
                      onChange={(e) => setEditForm({ ...editForm, learnUserId: e.target.value })}
                      placeholder="e.g. alexmorgan-4029"
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      value={editForm.college}
                      onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Reset Password (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editForm.newPassword}
                        onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                        placeholder="Leave blank to keep current"
                        className="w-full pl-3 pr-9 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                        title={showEditPassword ? 'Hide password' : 'Show password'}
                        aria-label={showEditPassword ? 'Hide password' : 'Show password'}
                      >
                        {showEditPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5">
                      Cannot match existing password.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                      Referrals Count (7 unlocks vault)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editForm.referralsCount}
                      onChange={(e) => setEditForm({ ...editForm, referralsCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                    />
                  </div>
                </div>

                {/* Track Completion Checkboxes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                    Completed Curriculum Tracks:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plans.map((p, idx) => {
                      const isChecked = editForm.completedPlanIds.includes(p.id);
                      const meta = getTrackDisplayMeta(p, idx);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--ink)] font-bold'
                              : 'bg-[var(--paper-2)] border-[var(--line-strong)] text-[var(--muted)]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditForm({
                                  ...editForm,
                                  completedPlanIds: [...editForm.completedPlanIds, p.id],
                                });
                              } else {
                                setEditForm({
                                  ...editForm,
                                  completedPlanIds: editForm.completedPlanIds.filter((id) => id !== p.id),
                                });
                              }
                            }}
                            className="rounded accent-emerald-600"
                          />
                          <span className="truncate">{meta.short} ({meta.badge})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      const isFull = editForm.completedPlanIds.length >= plans.length;
                      setEditForm({
                        ...editForm,
                        completedPlanIds: isFull ? [] : plans.map((p) => p.id),
                      });
                    }}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {editForm.completedPlanIds.length >= plans.length ? 'Clear All Tracks' : 'Select All Tracks (100%)'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 rounded-xl border border-[var(--line-strong)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper-2)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isStudentSubmitting}
                      className="button button-dark text-xs py-2 px-5 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isStudentSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isStudentSubmitting ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: DELETE STUDENT CONFIRMATION */}
        {deleteConfirmStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--line-strong)] shadow-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/30 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[var(--ink)]">Remove Student Record?</h3>
                <p className="text-xs text-[var(--muted)]">
                  Are you sure you want to delete <strong>{deleteConfirmStudent.email}</strong>? All completion badges, referrals, and progress will be permanently removed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmStudent(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--line-strong)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper-2)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(deleteConfirmStudent.email)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
