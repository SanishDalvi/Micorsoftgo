import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LearnPlan, MasterStoreData, StudentProgress, SecretRewardPayload, GuideStep } from '../src/types.js';
import { syncStoreToSupabase, isSupabaseConfigured, fetchStoreFromSupabase } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const INITIAL_PLANS: LearnPlan[] = [
  {
    id: 'plan-ai-agents-vibe-coding',
    title: 'AI, Agents and Vibe Coding',
    description: 'Master generative AI architectures, prompt orchestration, autonomous multi-agent systems, and real-time vibe coding workflows.',
    category: 'Generative AI & Agents',
    badgeTitle: 'Agentic AI Architect',
    msLearnLink: 'https://learn.microsoft.com/en-us/plans/zwyzadt7p0jo34?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    estimatedHours: '4.0 hrs',
    moduleCount: 5,
    orderIndex: 1,
    colorAccent: 'red',
  },
  {
    id: 'plan-git-and-github',
    title: 'Git and GitHub Developer Mastery',
    description: 'Master distributed version control, branch management, pull requests, collaborative open-source workflows, and GitHub automation.',
    category: 'DevOps & Tooling',
    badgeTitle: 'Git Systems Builder',
    msLearnLink: 'https://learn.microsoft.com/en-us/plans/508ktqt08p6y2p?sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    estimatedHours: '3.5 hrs',
    moduleCount: 4,
    orderIndex: 2,
    colorAccent: 'blue',
  },
  {
    id: 'plan-iot',
    title: 'Internet of Things (IoT) Fundamentals',
    description: 'Connect smart edge devices, sensor telemetry, Azure IoT Hub, device twins, and real-time streaming analytics.',
    category: 'IoT & Connected Systems',
    badgeTitle: 'IoT Cloud Specialist',
    msLearnLink: 'https://learn.microsoft.com/en-us/plans/qr3ntqtkprpep1?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    estimatedHours: '4.5 hrs',
    moduleCount: 5,
    orderIndex: 3,
    colorAccent: 'green',
  },
  {
    id: 'plan-python',
    title: 'Python Programming & Automation',
    description: 'Master core Python syntax, algorithms, data structures, scripting, and practical automation tools for modern developers.',
    category: 'Core Programming',
    badgeTitle: 'Python Dev Craftsman',
    msLearnLink: 'https://learn.microsoft.com/en-us/plans/8w73azt4mjmwx5?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757',
    estimatedHours: '5.0 hrs',
    moduleCount: 6,
    orderIndex: 4,
    colorAccent: 'yellow',
  },
];

export const DEFAULT_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Sign In to Microsoft Learn & Copy Your User ID',
    badge: 'Step 1 · Account & ID Setup',
    description: 'First, visit learn.microsoft.com and sign in with your personal or student Microsoft account. Click your profile avatar in the upper-right corner and select "Profile". On your profile overview page or in your browser address bar (e.g. learn.microsoft.com/en-us/users/your-learn-id/), locate and copy your exact Learn User ID (username). This unique ID is how completions are recorded in challenge leaderboards.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step1-ms-learn-profile.png',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Challenge leaderboards strictly track completions by your Microsoft Learn User ID (username), not personal emails. Copy the username exactly as shown on your profile.',
    actionText: 'Open Microsoft Learn Profile',
    actionLink: 'https://learn.microsoft.com/en-us/users/',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Register & Link Your Learn User ID on This Platform',
    badge: 'Step 2 · Campus Linking',
    description: 'On our campus platform, sign up or log in. When registering, enter your campus email and paste your Microsoft Learn User ID. Your account is automatically linked to challenge tracking and leaderboards.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step2-platform-link.png',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Once registered, your Microsoft Learn username is permanently linked to your profile.'
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Launch & Complete Official Learning Plans',
    badge: 'Step 3 · Curriculum Tracks',
    description: 'Explore the 4 curriculum tracks on the dashboard: (1) AI, Agents & Vibe Coding, (2) Git & GitHub Developer Mastery, (3) IoT Fundamentals, and (4) Python. Click "Launch" on each card to open the official Microsoft Learn study plan. Log in, click "Start", and complete all units, interactive labs, and end-of-module knowledge check quizzes.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step3-module-launch.png',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Make sure you are logged into your Microsoft Learn account while completing exercises so your badges, XP, and trophies are recorded to your profile.',
    actionText: 'Browse Microsoft Learn Catalog',
    actionLink: 'https://learn.microsoft.com/en-us/training/',
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: 'How to Know If a Module is 100% Completed',
    badge: 'Step 4 · Verification Checklist',
    description: 'To confirm your module is 100% completed: (1) All unit rows in the module display a green circle with a white checkmark; (2) The module status banner shows "100% Completed" with XP awarded; (3) The achievement badge appears under your Learn Profile > Achievements tab; (4) Upon chapter roster sync, your dashboard card turns to "Verified".',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step4-module-completed-check.png',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'If a module shows incomplete, verify that you pressed "Check your answers" on all knowledge check questions and clicked the final "Summary" unit.',
    actionText: 'View Your Learn Achievements',
    actionLink: 'https://learn.microsoft.com/en-us/users/me/achievements',
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: 'Roster Sync & Decrypt the Secret Vault',
    badge: 'Step 5 · Vault Decryption',
    description: 'Completions are verified against official challenge roster CSVs uploaded by chapter coordinators. Verify 100% completion of all 4 tracks to decrypt the Secret Vault! Once unlocked, instant access to the 7B Claude Sandbox code repository and deployment tutorial is granted.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step5-vault-unlocked.png',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Complete all 4 curriculum tracks to receive your verified keyholder access token.'
  },
];

const DEFAULT_VAULT = {
  githubRepoUrl: 'https://github.com/tashfeenahmed/freellmapi',
  youtubeTutorialUrl: 'https://youtu.be/lVauGVmaYhA',
  secretAccessToken: 'MLSC-7B-CLAUDE-ACCESS-TOKEN-KEY-8942-VERIFIED',
  unlockInstructions: 'Congratulations Fellowship Keyholder! You have verified 100% completion of all designated Microsoft Learn tracks. Use your secret access token to clone the high-compute model codebase and watch the deployment tutorial below.',
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function generateInviteCode(nameOrEmail: string, existingCodes?: Set<string>): string {
  let prefix = 'MLSC';
  if (nameOrEmail) {
    const clean = nameOrEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 3) {
      prefix = clean.slice(0, 6);
    }
  }
  let code = '';
  let attempts = 0;
  do {
    const randNum = Math.floor(100 + Math.random() * 900);
    code = `${prefix}-${randNum}`;
    attempts++;
  } while (existingCodes && existingCodes.has(code) && attempts < 50);

  return code;
}

export function loadStore(): MasterStoreData {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initialData: MasterStoreData = {
      plans: INITIAL_PLANS,
      students: {
        'jerry@campus.edu': {
          email: 'jerry@campus.edu',
          fullName: 'Jerry Smith',
          college: 'College Name',
          completedPlanIds: [
            'plan-ai-agents-vibe-coding'
          ],
          lastUpdated: new Date().toISOString(),
          learnUserId: 'jerrysmith',
          password: 'pass123',
          inviteCode: 'JERRY-777',
          referralsCount: 0,
          referredStudents: [],
        }
      },
      vault: DEFAULT_VAULT,
      adminPasscode: 'zxcvbnm,./',
      guideSteps: DEFAULT_GUIDE_STEPS,
    };
    saveStore(initialData);
    return initialData;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.plans || parsed.plans.length === 0) {
      parsed.plans = INITIAL_PLANS;
    }
    if (!parsed.vault) {
      parsed.vault = DEFAULT_VAULT;
    }
    if (!parsed.adminPasscode) {
      parsed.adminPasscode = 'zxcvbnm,./';
    }
    if (!parsed.slideStartMode) {
      parsed.slideStartMode = 'first_login';
    }
    if (!parsed.guideSteps || !Array.isArray(parsed.guideSteps) || parsed.guideSteps.length === 0) {
      parsed.guideSteps = DEFAULT_GUIDE_STEPS;
    } else {
      // Ensure each step has images array
      parsed.guideSteps = parsed.guideSteps.map((s: any) => ({
        ...s,
        images: Array.isArray(s.images) && s.images.length > 0 ? s.images : (s.imageUrl ? [s.imageUrl] : []),
      }));
    }

    // Auto-migrate students: ensure inviteCode, referralsCount, referredStudents exist
    if (parsed.students && typeof parsed.students === 'object') {
      const existingCodes = new Set<string>();
      Object.values(parsed.students).forEach((s: any) => {
        if (s.inviteCode) existingCodes.add(s.inviteCode.toUpperCase());
      });

      let needsSave = false;

      // Ensure Jerry Smith exists
      if (!parsed.students['jerry@campus.edu']) {
        parsed.students['jerry@campus.edu'] = {
          email: 'jerry@campus.edu',
          fullName: 'Jerry Smith',
          college: 'College Name',
          completedPlanIds: ['plan-ai-agents-vibe-coding'],
          hasStartedTrack: false,
          lastUpdated: new Date().toISOString(),
          learnUserId: 'jerrysmith',
          password: 'pass123',
          inviteCode: 'JERRY-777',
          referralsCount: 0,
          referredStudents: [],
        };
        existingCodes.add('JERRY-777');
        needsSave = true;
      }

      Object.values(parsed.students).forEach((s: any) => {
        if (!s.inviteCode) {
          s.inviteCode = generateInviteCode(s.fullName || s.email, existingCodes);
          existingCodes.add(s.inviteCode.toUpperCase());
          needsSave = true;
        }
        if (typeof s.referralsCount !== 'number') {
          s.referralsCount = 0;
          needsSave = true;
        }
        if (!Array.isArray(s.referredStudents)) {
          s.referredStudents = [];
          needsSave = true;
        }
      });

      if (needsSave) {
        saveStore(parsed);
      }
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse store.json, resetting to default', err);
    return {
      plans: INITIAL_PLANS,
      students: {},
      vault: DEFAULT_VAULT,
      adminPasscode: 'zxcvbnm,./',
      guideSteps: DEFAULT_GUIDE_STEPS,
    };
  }
}

export async function hydrateStoreFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const cloudData = await fetchStoreFromSupabase();
    if (cloudData) {
      const store = loadStore();
      if (cloudData.plans && cloudData.plans.length > 0) store.plans = cloudData.plans as any;
      if (cloudData.guideSteps && cloudData.guideSteps.length > 0) store.guideSteps = cloudData.guideSteps as any;
      if (cloudData.vault) store.vault = cloudData.vault as any;
      if (cloudData.students) {
        store.students = { ...store.students, ...cloudData.students };
      }
      try {
        ensureDataDir();
        fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
      } catch {}
      console.log(`[Supabase Sync] Hydrated store from cloud (${Object.keys(store.students).length} students, ${store.plans.length} plans)`);
    }
  } catch (err) {
    console.warn('[Supabase Sync] Could not hydrate from cloud:', err);
  }
}

export function saveStore(data: MasterStoreData): void {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Filesystem write not supported in current environment (ephemeral/serverless). Data retained in memory / synced to cloud:', err);
  }

  if (isSupabaseConfigured) {
    syncStoreToSupabase(data).catch((err) => {
      console.warn('Background Supabase sync error:', err);
    });
  }
}

export async function saveStoreAsync(data: MasterStoreData): Promise<void> {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Filesystem write not supported in current environment (ephemeral/serverless). Data retained in memory / synced to cloud:', err);
  }

  if (isSupabaseConfigured) {
    try {
      await syncStoreToSupabase(data);
    } catch (err) {
      console.warn('Supabase sync error:', err);
    }
  }
}

export function findStudent(identifier: string, storeInstance?: MasterStoreData) {
  if (!identifier) return null;
  const store = storeInstance || loadStore();
  const clean = identifier.trim().toLowerCase();
  // 1. Direct email dictionary lookup
  if (store.students[clean]) return store.students[clean];
  // 2. Lookup by learnUserId, studentId, or case-insensitive match
  return Object.values(store.students).find((s) => {
    return (
      (s.email && s.email.toLowerCase() === clean) ||
      (s.learnUserId && s.learnUserId.toLowerCase() === clean) ||
      (s.studentId && s.studentId.toLowerCase() === clean)
    );
  }) || null;
}

export function findStudentByInviteCode(code: string, storeInstance?: MasterStoreData) {
  if (!code) return null;
  const store = storeInstance || loadStore();
  const clean = code.trim().toUpperCase();
  return Object.values(store.students).find((s) => {
    return s.inviteCode && s.inviteCode.trim().toUpperCase() === clean;
  }) || null;
}

export function getStudentProgress(emailOrId: string, storeInstance?: MasterStoreData): StudentProgress {
  const store = storeInstance || loadStore();
  const student = findStudent(emailOrId, store);
  const totalPlans = store.plans.length;

  if (!student) {
    const isEmail = emailOrId.includes('@');
    const normalized = emailOrId.trim().toLowerCase();
    return {
      email: isEmail ? normalized : `${normalized}@learn.microsoft.com`,
      fullName: isEmail ? normalized.split('@')[0] : normalized,
      learnUserId: !isEmail ? normalized : undefined,
      completedPlanIds: [],
      totalPlans,
      completedCount: 0,
      progressPercentage: 0,
      isUnlocked: false,
      lastUpdated: new Date().toISOString(),
      lastRosterSync: store.lastRosterSync,
      inviteCode: 'GUEST',
      referralsCount: 0,
      referralsTarget: 7,
      referredStudents: [],
      unlockedBy: null,
      hasStartedTrack: false,
      slideStartMode: (store.slideStartMode || 'first_login') as 'first_login' | 'every_login' | 'disabled',
    };
  }

  // Filter valid plan IDs that still exist in plans
  const validCompletedPlanIds = student.completedPlanIds.filter((id) =>
    store.plans.some((p) => p.id === id)
  );

  const completedCount = validCompletedPlanIds.length;
  const progressPercentage = totalPlans > 0 ? Math.round((completedCount / totalPlans) * 100) : 0;
  
  const referralsCount = student.referralsCount || 0;
  const referralsTarget = 7;
  const modulesUnlocked = totalPlans > 0 && completedCount >= totalPlans;
  const referralsUnlocked = referralsCount >= referralsTarget;
  const isUnlocked = modulesUnlocked || referralsUnlocked;
  
  let unlockedBy: 'modules' | 'referrals' | 'both' | null = null;
  if (modulesUnlocked && referralsUnlocked) {
    unlockedBy = 'both';
  } else if (modulesUnlocked) {
    unlockedBy = 'modules';
  } else if (referralsUnlocked) {
    unlockedBy = 'referrals';
  }

  return {
    email: student.email,
    fullName: student.fullName || student.email.split('@')[0],
    studentId: student.studentId,
    learnUserId: student.learnUserId,
    college: student.college,
    completedPlanIds: validCompletedPlanIds,
    totalPlans,
    completedCount,
    progressPercentage,
    isUnlocked,
    lastUpdated: student.lastUpdated,
    lastRosterSync: store.lastRosterSync || student.lastUpdated,
    inviteCode: student.inviteCode || 'MLSC-777',
    referralsCount,
    referralsTarget,
    referredBy: student.referredBy,
    referredStudents: student.referredStudents || [],
    unlockedBy,
    hasStartedTrack: student.hasStartedTrack || false,
    slideStartMode: (store.slideStartMode || 'first_login') as 'first_login' | 'every_login' | 'disabled',
  };
}

export function getSecretReward(email: string, storeInstance?: MasterStoreData): SecretRewardPayload | null {
  const store = storeInstance || loadStore();
  const progress = getStudentProgress(email, store);
  if (!progress.isUnlocked) {
    return null;
  }
  
  let customInstructions = store.vault.unlockInstructions;
  if (progress.unlockedBy === 'referrals') {
    customInstructions = 'Congratulations Fellowship Ambassador! You have successfully referred 7+ students to the MLSC platform. Your peer leadership unlocks full access to the high-compute model codebase and private masterclass tutorial below.';
  } else if (progress.unlockedBy === 'both') {
    customInstructions = 'Double Honor Keyholder! You have verified 100% completion of all designated Microsoft Learn tracks AND referred 7+ community peers. Use your access token below.';
  }

  return {
    githubRepoUrl: store.vault.githubRepoUrl,
    youtubeTutorialUrl: store.vault.youtubeTutorialUrl,
    secretAccessToken: store.vault.secretAccessToken,
    unlockInstructions: customInstructions,
    unlockedAt: new Date().toISOString(),
  };
}

export interface ParsedCsvStudent {
  email: string;
  learnUserId?: string;
  password?: string;
  name?: string;
  college?: string;
  completedPlanIds: string[];
  hasStartedTrack?: boolean;
}

export function parseCsvBuffer(
  buffer: Buffer,
  fallbackPlanId?: string
): ParsedCsvStudent[] {
  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const store = loadStore();
  const allPlanIds = store.plans.map((p) => p.id);

  // Determine delimiter: comma or semicolon or tab
  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';

  // Parse header
  const headers = firstLine
    .split(delimiter)
    .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  let emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
  let learnUserIdIdx = headers.findIndex((h) =>
    h.includes('learn user') || h.includes('user id') || h.includes('userid') ||
    h.includes('username') || h.includes('learn_id') || h.includes('learn id') ||
    h.includes('profile id') || h.includes('learner') || h === 'id' || h.includes('user_id') ||
    h === 'uid' || h === 'user' || h.includes('student id') || h.includes('studentid')
  );
  let passwordIdx = headers.findIndex((h) => h.includes('password') || h.includes('pass') || h.includes('pwd'));
  let nameIdx = headers.findIndex((h) => (h.includes('name') || h.includes('student')) && !h.includes('student_id') && !h.includes('password') && !h.includes('user'));
  let collegeIdx = headers.findIndex((h) => h.includes('college') || h.includes('university') || h.includes('school') || h.includes('org'));
  let slideUsedIdx = headers.findIndex((h) =>
    h.includes('slide') || h.includes('slidetostart') || h.includes('startedtrack') ||
    h.includes('started_track') || h.includes('hasstartedtrack') || h.includes('start to slide') ||
    h.includes('slide to start')
  );
  let completedPlansIdx = headers.findIndex((h) =>
    h.includes('completed plans') || h.includes('completed tracks') || h.includes('tracks') || h.includes('modules')
  );

  // If neither is explicitly found, default column 0 to identifier
  if (emailIdx === -1 && learnUserIdIdx === -1) {
    emailIdx = 0;
  }

  // Check if individual column headers correspond to specific plans (e.g. AZ-900, Copilot, AI-900, Security)
  const planColumnMap = new Map<number, string>();
  headers.forEach((h, colIdx) => {
    if (colIdx === emailIdx || colIdx === learnUserIdIdx || colIdx === passwordIdx || colIdx === nameIdx || colIdx === collegeIdx || colIdx === slideUsedIdx) return;
    for (const plan of store.plans) {
      const pId = plan.id.toLowerCase();
      const pTitle = plan.title.toLowerCase();
      if (
        h === pId ||
        h.includes(pId) ||
        pTitle.includes(h) ||
        (h.includes('vibe') || h.includes('agent') || h.includes('zwyzadt7p0jo34') || h.includes('agentic')) && pId.includes('ai-agents') ||
        (h.includes('git') || h.includes('github') || h.includes('508ktqt08p6y2p')) && pId.includes('git') ||
        (h.includes('iot') || h.includes('internet of things') || h.includes('qr3ntqtkprpep1')) && pId.includes('iot') ||
        (h.includes('python') || h.includes('py') || h.includes('8w73azt4mjmwx5')) && pId.includes('python') ||
        (h.includes('az-900') || h.includes('cloud') || h.includes('az900')) && (pId.includes('azure-fundamentals') || pId.includes('ai-agents')) ||
        (h.includes('copilot')) && (pId.includes('copilot') || pId.includes('git')) ||
        (h.includes('ai-900') || h.includes('openai') || h.includes('ai900') || h === 'ai') && (pId.includes('ai') || pId.includes('ai-agents')) ||
        (h.includes('security') || h.includes('sc-900') || h.includes('sc900') || h.includes('identity') || h.includes('governance')) && pId.includes('security')
      ) {
        planColumnMap.set(colIdx, plan.id);
        break;
      }
    }
  });

  const startIndex = (emailIdx !== -1 || learnUserIdIdx !== -1) ? 1 : 0;

  const results: ParsedCsvStudent[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
    const rawEmail = emailIdx !== -1 ? (parts[emailIdx] || '') : '';
    const rawLearnId = learnUserIdIdx !== -1 ? (parts[learnUserIdIdx] || '') : '';

    let email = '';
    let learnUserId = '';

    if (rawEmail && rawEmail.includes('@')) {
      email = rawEmail.toLowerCase().trim();
      if (rawLearnId) learnUserId = rawLearnId.trim();
    } else if (rawLearnId) {
      learnUserId = rawLearnId.trim();
      email = rawEmail && rawEmail.includes('@') ? rawEmail.toLowerCase().trim() : `${learnUserId.toLowerCase()}@learn.microsoft.com`;
    } else if (rawEmail) {
      learnUserId = rawEmail.trim();
      email = `${learnUserId.toLowerCase()}@learn.microsoft.com`;
    }

    if (email || learnUserId) {
      const password = passwordIdx !== -1 && parts[passwordIdx] ? parts[passwordIdx] : 'pass123';
      const name = nameIdx !== -1 && parts[nameIdx] ? parts[nameIdx] : undefined;
      const college = collegeIdx !== -1 && parts[collegeIdx] ? parts[collegeIdx] : undefined;
      
      let hasStartedTrack: boolean | undefined = undefined;
      if (slideUsedIdx !== -1 && parts[slideUsedIdx] !== undefined) {
        const rawSlide = (parts[slideUsedIdx] || '').trim().toLowerCase();
        hasStartedTrack = ['1', 'true', 'yes', 'y', 'complete', 'completed', 'verified', 'done', 'used'].includes(rawSlide);
      }

      const rowPlansSet = new Set<string>();

      // 1. Check matrix plan columns with binary 0/1 or true/false values
      if (planColumnMap.size > 0) {
        planColumnMap.forEach((planId, colIdx) => {
          const cell = (parts[colIdx] || '').toLowerCase().trim();
          if (['1', 'true', 'yes', 'y', 'complete', 'completed', 'verified', 'x', 'done', 'pass'].includes(cell)) {
            rowPlansSet.add(planId);
          }
        });
      }

      // 2. Check completedPlans column or any part with plan indicators (if no matrix plan was found)
      let planCandidate = (completedPlansIdx !== -1 && parts[completedPlansIdx]) ? parts[completedPlansIdx] : '';
      if (!planCandidate && planColumnMap.size === 0) {
        for (let c = 1; c < parts.length; c++) {
          if (c === emailIdx || c === passwordIdx || c === slideUsedIdx) continue;
          const str = (parts[c] || '').toLowerCase().trim();
          if (str.includes(';') || str === 'all' || str === '*' || str.includes('vibe') || str.includes('agent') || str.includes('git') || str.includes('iot') || str.includes('python') || str.includes('copilot') || str.includes('fundamentals') || str.includes('azure') || str.includes('security') || str.includes('plan-')) {
            planCandidate = parts[c];
            break;
          }
        }
      }

      if (planCandidate) {
        const val = planCandidate.trim().toLowerCase();
        if (val === 'all' || val === '*' || val === '100%' || val === 'completed all') {
          allPlanIds.forEach((pid) => rowPlansSet.add(pid));
        } else {
          const items = val.split(/[;,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
          items.forEach((item) => {
            for (const plan of store.plans) {
              const pId = plan.id.toLowerCase();
              const pTitle = plan.title.toLowerCase();
              if (
                item === pId ||
                pTitle.includes(item) ||
                item.includes(pId) ||
                (item.includes('vibe') || item.includes('agent') || item.includes('zwyzadt7p0jo34')) && pId.includes('ai-agents') ||
                (item.includes('git') || item.includes('github') || item.includes('508ktqt08p6y2p')) && pId.includes('git') ||
                (item.includes('iot') || item.includes('internet of things') || item.includes('qr3ntqtkprpep1')) && pId.includes('iot') ||
                (item.includes('python') || item.includes('py') || item.includes('8w73azt4mjmwx5')) && pId.includes('python') ||
                (item.includes('az-900') || item.includes('cloud')) && (pId.includes('azure-fundamentals') || pId.includes('ai-agents')) ||
                (item.includes('copilot')) && (pId.includes('copilot') || pId.includes('git')) ||
                (item.includes('ai') || item.includes('openai')) && (pId.includes('ai') || pId.includes('ai-agents')) ||
                (item.includes('security') || item.includes('sc-900') || item.includes('identity')) && pId.includes('security')
              ) {
                rowPlansSet.add(plan.id);
              }
            }
          });
        }
      }

      // 3. Fallback to passed fallbackPlanId if no plan columns existed and fallback is specified
      if (rowPlansSet.size === 0 && planColumnMap.size === 0 && fallbackPlanId) {
        if (fallbackPlanId === 'all' || fallbackPlanId === 'all-plans') {
          allPlanIds.forEach((pid) => rowPlansSet.add(pid));
        } else if (allPlanIds.includes(fallbackPlanId)) {
          rowPlansSet.add(fallbackPlanId);
        }
      }

      results.push({
        email,
        learnUserId,
        password,
        name,
        college,
        completedPlanIds: Array.from(rowPlansSet),
        hasStartedTrack,
      });
    }
  }

  return results;
}

export function generateMasterCsv(): string {
  const store = loadStore();
  const totalPlans = store.plans.length;

  const header = [
    'Student Email',
    'User ID',
    'Password',
    'Full Name',
    'College / Organization',
    'Slide to Start Used',
    'Completed Plans Count',
    'Total Plans',
    'Progress (%)',
    'Vault Unlocked',
    'Invite Code',
    'Referrals Count (Target 7)',
    'Completed Plan Titles',
    'Last Activity'
  ];

  const rows = Object.values(store.students).map((s) => {
    const validPlanIds = s.completedPlanIds.filter((pid) => store.plans.some((p) => p.id === pid));
    const completedCount = validPlanIds.length;
    const progress = totalPlans > 0 ? Math.round((completedCount / totalPlans) * 100) : 0;
    const isUnlocked = (totalPlans > 0 && completedCount >= totalPlans) || (s.referralsCount || 0) >= 7;
    const planNames = validPlanIds
      .map((pid) => store.plans.find((p) => p.id === pid)?.title || pid)
      .join('; ');

    return [
      `"${s.email}"`,
      `"${s.learnUserId || ''}"`,
      `"${s.password || 'pass123'}"`,
      `"${(s.fullName || '').replace(/"/g, '""')}"`,
      `"${(s.college || '').replace(/"/g, '""')}"`,
      s.hasStartedTrack ? 'YES' : 'NO',
      completedCount,
      totalPlans,
      `${progress}%`,
      isUnlocked ? 'YES (UNLOCKED)' : 'NO (LOCKED)',
      `"${s.inviteCode || ''}"`,
      s.referralsCount || 0,
      `"${planNames.replace(/"/g, '""')}"`,
      `"${s.lastUpdated}"`
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}

export function updateSampleRosterCsvSlide(emailOrId: string, hasStarted: boolean): void {
  try {
    const sampleCsvPath = path.join(DATA_DIR, 'sample_roster.csv');
    if (!fs.existsSync(sampleCsvPath)) return;

    const content = fs.readFileSync(sampleCsvPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return;

    const clean = emailOrId.trim().toLowerCase();
    const headers = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    const userIdx = headers.findIndex((h) => h.includes('user') || h.includes('id') || h.includes('username'));
    const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
    const slideIdx = headers.findIndex((h) => h.includes('slide') || h.includes('started'));

    if (slideIdx === -1) return;

    let modified = false;
    const newLines = lines.map((line, idx) => {
      if (idx === 0 || !line.trim()) return line;
      const parts = line.split(',');
      const rowUser = userIdx !== -1 && parts[userIdx] ? parts[userIdx].trim().toLowerCase() : '';
      const rowEmail = emailIdx !== -1 && parts[emailIdx] ? parts[emailIdx].trim().toLowerCase() : '';

      if (rowUser === clean || rowEmail === clean || rowEmail.split('@')[0] === clean) {
        parts[slideIdx] = hasStarted ? 'YES' : 'NO';
        modified = true;
        return parts.join(',');
      }
      return line;
    });

    if (modified) {
      fs.writeFileSync(sampleCsvPath, newLines.join('\n'), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not update sample_roster.csv:', err);
  }
}

export function ingestCsvFile(filePath: string): { processedCount: number; newCompletionsCount: number } {
  if (!fs.existsSync(filePath)) return { processedCount: 0, newCompletionsCount: 0 };
  const buffer = fs.readFileSync(filePath);
  const rows = parseCsvBuffer(buffer, 'auto');
  if (rows.length === 0) return { processedCount: 0, newCompletionsCount: 0 };

  const store = loadStore();
  let newCompletionsCount = 0;

  const existingCodes = new Set<string>();
  Object.values(store.students).forEach((s: any) => {
    if (s.inviteCode) existingCodes.add(s.inviteCode.toUpperCase());
  });

  rows.forEach((row) => {
    const rowLearnId = row.learnUserId ? row.learnUserId.trim().toLowerCase() : '';
    const rowEmail = row.email ? row.email.trim().toLowerCase() : '';

    // Match existing student primarily by learnUserId, then email, then username prefix
    let student: any = null;

    if (rowLearnId) {
      student = Object.values(store.students).find((s) => {
        return (
          (s.learnUserId && s.learnUserId.toLowerCase() === rowLearnId) ||
          (s.email && s.email.toLowerCase() === rowLearnId) ||
          (s.email && s.email.split('@')[0].toLowerCase() === rowLearnId)
        );
      });
    }

    if (!student && rowEmail && rowEmail.includes('@')) {
      student = store.students[rowEmail] || Object.values(store.students).find((s) => {
        return (
          (s.email && s.email.toLowerCase() === rowEmail) ||
          (s.learnUserId && s.learnUserId.toLowerCase() === rowEmail) ||
          (s.email && s.email.split('@')[0].toLowerCase() === rowEmail.split('@')[0])
        );
      });
    }

    const plansToAssign = row.completedPlanIds;

    if (!student) {
      const primaryEmail = (rowEmail && rowEmail.includes('@')) ? rowEmail : `${rowLearnId || 'student'}@campus.edu`;
      const generatedCode = generateInviteCode(row.name || row.learnUserId || primaryEmail, existingCodes);
      existingCodes.add(generatedCode.toUpperCase());

      student = {
        email: primaryEmail,
        learnUserId: row.learnUserId || rowLearnId,
        fullName: row.name || (row.learnUserId || primaryEmail.split('@')[0]),
        password: row.password || 'pass123',
        college: row.college || '',
        completedPlanIds: plansToAssign,
        hasStartedTrack: row.hasStartedTrack !== undefined ? row.hasStartedTrack : false,
        lastUpdated: new Date().toISOString(),
        inviteCode: generatedCode,
        referralsCount: 0,
        referredStudents: [],
      };
      store.students[primaryEmail] = student;
      newCompletionsCount += plansToAssign.length;
    } else {
      // OVERWRITE completedPlanIds with exact CSV 0/1 states so changing 1 to 0 immediately locks the vault!
      student.completedPlanIds = plansToAssign;
      if (row.hasStartedTrack !== undefined) {
        student.hasStartedTrack = row.hasStartedTrack;
      }
      if (row.learnUserId) {
        student.learnUserId = row.learnUserId;
      }
      if (row.password) {
        student.password = row.password;
      }
      if (row.name && (!student.fullName || student.fullName === student.email.split('@')[0])) {
        student.fullName = row.name;
      }
      if (row.college && !student.college) {
        student.college = row.college;
      }
      if (!student.inviteCode) {
        student.inviteCode = generateInviteCode(student.fullName || student.email, existingCodes);
        existingCodes.add(student.inviteCode.toUpperCase());
      }
      if (typeof student.referralsCount !== 'number') {
        student.referralsCount = 0;
      }
      if (!Array.isArray(student.referredStudents)) {
        student.referredStudents = [];
      }
      student.lastUpdated = new Date().toISOString();
    }
  });

  store.lastRosterSync = new Date().toISOString();
  saveStore(store);
  return { processedCount: rows.length, newCompletionsCount };
}

export function getGuideSteps(): GuideStep[] {
  const store = loadStore();
  return store.guideSteps || DEFAULT_GUIDE_STEPS;
}

export function saveGuideSteps(steps: GuideStep[]): void {
  const store = loadStore();
  store.guideSteps = steps;
  saveStore(store);
}

export { DATA_DIR, STORE_FILE };


