import type {
  StudentProfile,
  CurriculumTrack,
  ReferralPeer,
  AdminStudentRecord,
  DispatchLog,
} from '../types'
export const TRACKS_DATA_VERSION = 'v2_2026_tracks'

/**
 * ============================================================================
 * HOW TO UPDATE OR ADD YOUR OWN TRACKS:
 * ============================================================================
 * 1. TO EDIT AN EXISTING TRACK:
 *    Change any fields below (title, description, skills, totalXp, estimatedTime,
 *    learnPathUrl).
 *
 * 2. TO ADD A NEW TRACK:
 *    Add a new object inside this INITIAL_TRACKS array:
 *    {
 *      id: 'my-custom-track',
 *      title: 'Your Track Name Here',
 *      description: 'Explain what this track covers.',
 *      skills: ['Skill 1', 'Skill 2'],
 *      totalXp: 2000,
 *      estimatedTime: '3.0 Hours',
 *      learnPathUrl: 'https://learn.microsoft.com/training/paths/...',
 *      completed: false,
 *    },
 *
 * 3. TO REMOVE A TRACK:
 *    Simply delete the object from the INITIAL_TRACKS array.
 * ============================================================================
 */
export const INITIAL_TRACKS: CurriculumTrack[] = [
  {
    id: 'track-az-900',
    title: 'Azure Cloud AZ-900',
    shortTitle: 'AZ-900',
    badge: 'Official Microsoft Learn',
    iconName: 'Cloud',
    color: '#ffffff',
    accentColor: 'rgba(255, 255, 255, 0.1)',
    description:
      'Master core Azure architectural components, compute and networking services, storage options, and cloud security governance.',
    skills: ['Azure Architecture', 'Compute & Storage', 'Virtual Networks', 'Governance & SLA', 'Cloud Pricing'],
    totalXp: 2200,
    estimatedTime: '3.0 Hours',
    learnPathUrl: 'https://learn.microsoft.com/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/',
    modules: [
      {
        id: 'mod-az-1',
        title: 'Describe Cloud Computing Concepts & Shared Responsibility',
        duration: '45 mins',
        xp: 500,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
        completed: false,
      },
      {
        id: 'mod-az-2',
        title: 'Describe Azure Core Architectural Components & Datacenters',
        duration: '50 mins',
        xp: 600,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/',
        completed: false,
      },
      {
        id: 'mod-az-3',
        title: 'Azure Virtual Machines, Container Instances & Azure Functions',
        duration: '45 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-azure-compute-networking-services/',
        completed: false,
      },
      {
        id: 'mod-az-4',
        title: 'Configure Identity, Access Control & Azure Role-Based Access',
        duration: '40 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-azure-identity-access-security/',
        completed: false,
      },
    ],
  },
  {
    id: 'track-copilot',
    title: 'GitHub Copilot Productivity',
    shortTitle: 'Copilot',
    badge: 'AI Developer Suite',
    iconName: 'GitBranch',
    color: '#ffffff',
    accentColor: 'rgba(255, 255, 255, 0.1)',
    description:
      'Accelerate software development with GitHub Copilot in VS Code and Codespaces, prompt craft, automated unit testing, and pull requests.',
    skills: ['GitHub Copilot', 'Codespaces', 'Prompt Engineering', 'Unit Test Generation', 'Automated CI/CD'],
    totalXp: 2000,
    estimatedTime: '2.5 Hours',
    learnPathUrl: 'https://learn.microsoft.com/training/paths/copilot/',
    modules: [
      {
        id: 'mod-cp-1',
        title: 'Introduction to GitHub Copilot & Workspace Setup',
        duration: '35 mins',
        xp: 450,
        learnUrl: 'https://learn.microsoft.com/training/modules/introduction-to-github-copilot/',
        completed: false,
      },
      {
        id: 'mod-cp-2',
        title: 'Craft Precise Prompts for Code Completion & Refactoring',
        duration: '45 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/craft-effective-prompts-for-github-copilot/',
        completed: false,
      },
      {
        id: 'mod-cp-3',
        title: 'Cloud-Native Dev Environments with GitHub Codespaces',
        duration: '45 mins',
        xp: 500,
        learnUrl: 'https://learn.microsoft.com/training/modules/use-github-codespaces-with-github/',
        completed: false,
      },
      {
        id: 'mod-cp-4',
        title: 'Automate Testing & Code Documentation with Copilot Chat',
        duration: '40 mins',
        xp: 500,
        learnUrl: 'https://learn.microsoft.com/training/modules/accelerate-app-development-using-github-copilot/',
        completed: false,
      },
    ],
  },
  {
    id: 'track-ai-900',
    title: 'Azure OpenAI AI-900',
    shortTitle: 'AI-900',
    badge: 'Foundational AI',
    iconName: 'Bot',
    color: '#ffffff',
    accentColor: 'rgba(255, 255, 255, 0.1)',
    description:
      'Explore core concepts of artificial intelligence, machine learning, computer vision, natural language processing, and Azure OpenAI Service.',
    skills: ['Azure OpenAI', 'GPT-4o Integration', 'Computer Vision', 'RAG Architecture', 'Responsible AI'],
    totalXp: 2400,
    estimatedTime: '3.5 Hours',
    learnPathUrl: 'https://learn.microsoft.com/training/paths/get-started-with-artificial-intelligence-on-azure/',
    modules: [
      {
        id: 'mod-ai-1',
        title: 'Fundamentals of Machine Learning & Model Training',
        duration: '45 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/fundamentals-machine-learning/',
        completed: false,
      },
      {
        id: 'mod-ai-2',
        title: 'Explore Azure OpenAI Service & Generative AI Solutions',
        duration: '50 mins',
        xp: 650,
        learnUrl: 'https://learn.microsoft.com/training/modules/explore-azure-openai/',
        completed: false,
      },
      {
        id: 'mod-ai-3',
        title: 'Computer Vision & Document Intelligence Analysis',
        duration: '40 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/explore-computer-vision-microsoft-azure/',
        completed: false,
      },
      {
        id: 'mod-ai-4',
        title: 'Natural Language Processing & Conversational AI Bots',
        duration: '45 mins',
        xp: 650,
        learnUrl: 'https://learn.microsoft.com/training/modules/explore-natural-language-processing/',
        completed: false,
      },
    ],
  },
  {
    id: 'track-sc-900',
    title: 'Security & Identity SC-900',
    shortTitle: 'SC-900',
    badge: 'Zero Trust & Security',
    iconName: 'Shield',
    color: '#ffffff',
    accentColor: 'rgba(255, 255, 255, 0.1)',
    description:
      'Understand Microsoft security, compliance, and identity solutions, Zero Trust architecture, Microsoft Entra ID, and threat protection.',
    skills: ['Zero Trust', 'Microsoft Entra ID', 'Threat Protection', 'Data Governance', 'Compliance Manager'],
    totalXp: 2100,
    estimatedTime: '2.8 Hours',
    learnPathUrl: 'https://learn.microsoft.com/training/paths/describe-concepts-of-security-compliance-identity/',
    modules: [
      {
        id: 'mod-sc-1',
        title: 'Describe Security and Compliance Concepts & Zero Trust',
        duration: '40 mins',
        xp: 500,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-security-concepts-methodologies/',
        completed: false,
      },
      {
        id: 'mod-sc-2',
        title: 'Describe Identity Capabilities with Microsoft Entra ID',
        duration: '45 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-identity-principles-concepts/',
        completed: false,
      },
      {
        id: 'mod-sc-3',
        title: 'Describe Cloud Security Capabilities & Microsoft Defender',
        duration: '45 mins',
        xp: 550,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-security-solutions-azure/',
        completed: false,
      },
      {
        id: 'mod-sc-4',
        title: 'Describe Compliance Management & Microsoft Purview',
        duration: '40 mins',
        xp: 500,
        learnUrl: 'https://learn.microsoft.com/training/modules/describe-compliance-management-capabilities-microsoft/',
        completed: false,
      },
    ],
  },
]

export const VAULT_RESOURCES = {
  githubRepoUrl: 'https://github.com/microsoft-student-community/sample-ai-enclave',
  youtubeTutorialUrl: 'https://www.youtube.com/watch?v=sample-deployment-tutorial',
  secretAccessToken: 'MLSC-7B-CLAUDE-ACCESS-TOKEN-KEY-8942-VERIFIED',
  unlockInstructions:
    'Congratulations Fellowship Keyholder! You have verified 7 referrals and unlocked the Secret Vault. Use your secret access token to clone the high-compute model codebase and watch the deployment tutorial below.',
}

export const INITIAL_STUDENT: StudentProfile = {
  email: '',
  learnId: '',
  displayName: '',
  enrollmentNo: '',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
  xp: 0,
  level: 1,
  linkedAt: '',
  referralCode: '',
}

export const INITIAL_PEERS: ReferralPeer[] = []

export const INITIAL_ADMIN_STUDENTS: AdminStudentRecord[] = []

export const INITIAL_DISPATCH_LOGS: DispatchLog[] = []

export function extractCleanLearnId(raw: string): string {
  let cleaned = (raw || '').trim()
  if (!cleaned) return ''
  cleaned = cleaned.split('?')[0].split('#')[0]

  const userMatch = cleaned.match(
    /(?:users\/|@|^)([a-zA-Z0-9_.-]+)(?:\/(?:settings|achievements|activity|collections|history|transcripts?)|\/|$)/i
  )
  if (userMatch && userMatch[1]) {
    cleaned = userMatch[1]
  } else {
    cleaned = cleaned.replace(/^https?:\/\/learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '')
    cleaned = cleaned.replace(/^learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '')
  }

  cleaned = cleaned.replace(/\/.*$/, '').replace(/^@+/, '').replace(/\/+$/, '').trim()
  return cleaned
}
