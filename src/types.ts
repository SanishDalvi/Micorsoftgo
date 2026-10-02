export interface LearnPlan {
  id: string;
  title: string;
  description: string;
  category: string;
  badgeTitle: string;
  msLearnLink: string;
  estimatedHours: string;
  moduleCount: number;
  orderIndex: number;
  colorAccent: 'blue' | 'red' | 'yellow' | 'green' | 'cyan' | 'purple' | 'indigo' | 'emerald' | 'amber' | 'violet';
}

export interface StudentProgress {
  email: string;
  fullName: string;
  studentId?: string;
  learnUserId?: string;
  college?: string;
  completedPlanIds: string[];
  totalPlans: number;
  completedCount: number;
  progressPercentage: number;
  isUnlocked: boolean;
  lastUpdated: string;
  lastRosterSync?: string;
  inviteCode?: string;
  referralsCount?: number;
  referralsTarget?: number;
  referredBy?: string;
  referredStudents?: Array<{
    email: string;
    fullName?: string;
    joinedAt: string;
  }>;
  unlockedBy?: 'modules' | 'referrals' | 'both' | null;
  hasStartedTrack?: boolean;
  slideStartMode?: 'first_login' | 'every_login' | 'disabled';
  loginCount?: number;
  lastLogin?: string;
}

export interface SecretRewardPayload {
  githubRepoUrl: string;
  youtubeTutorialUrl: string;
  secretAccessToken: string;
  unlockInstructions: string;
  unlockedAt: string;
}

export interface GuideStep {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  description: string;
  images: string[];
  imageUrl?: string;
  tip?: string;
  actionText?: string;
  actionLink?: string;
}

export interface MasterStoreData {
  plans: LearnPlan[];
  students: Record<string, {
    email: string;
    fullName: string;
    password?: string;
    studentId?: string;
    learnUserId?: string;
    college?: string;
    completedPlanIds: string[];
    lastUpdated: string;
    inviteCode?: string;
    referralsCount?: number;
    referredBy?: string;
    registeredAt?: string;
    hasStartedTrack?: boolean;
    tempPassword?: string;
    tempPasswordExpiresAt?: number;
    tempPasswordIssued?: boolean;
    loginCount?: number;
    lastLogin?: string;
    name?: string;
    referredStudents?: Array<{
      email: string;
      fullName?: string;
      joinedAt: string;
    }>;
  }>;
  vault: {
    githubRepoUrl: string;
    youtubeTutorialUrl: string;
    secretAccessToken: string;
    unlockInstructions: string;
  };
  adminPasscode: string;
  slideStartMode?: 'first_login' | 'every_login' | 'disabled';
  lastRosterSync?: string;
  guideSteps?: GuideStep[];
}

export interface CsvUploadResult {
  success: boolean;
  planId: string;
  planTitle: string;
  processedCount: number;
  newCompletionsCount: number;
  totalStudentsInDb: number;
  timestamp: string;
  sampleProcessed: string[];
}
