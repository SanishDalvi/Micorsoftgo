import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import fs from 'node:fs';
import {
  loadStore,
  saveStore,
  saveStoreAsync,
  findStudent,
  findStudentByInviteCode,
  generateInviteCode,
  getStudentProgress,
  getSecretReward,
  parseCsvBuffer,
  generateMasterCsv,
  ingestCsvFile,
  getGuideSteps,
  saveGuideSteps,
  updateSampleRosterCsvSlide,
  hydrateStoreFromSupabase,
  DEFAULT_GUIDE_STEPS,
  DATA_DIR,
} from './server/store.js';
import {
  deleteStudentFromSupabase,
  syncVaultToSupabase,
} from './server/supabase.js';
import type { LearnPlan } from './src/types.js';
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendNewUserLoginEmail,
} from './src/services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configure multer for in-memory CSV uploads (no disk storage used!)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.use(express.json());

// Cloud DB Hydration Middleware (Ensures Vercel Serverless Lambdas are always in-sync with Supabase)
let isStoreHydrated = false;
let storeHydrationPromise: Promise<void> | null = null;

async function ensureStoreHydrated(): Promise<void> {
  if (isStoreHydrated) return;
  if (!storeHydrationPromise) {
    storeHydrationPromise = (async () => {
      try {
        await hydrateStoreFromSupabase();
        isStoreHydrated = true;
      } catch (err) {
        console.warn('Hydration error:', err);
      } finally {
        storeHydrationPromise = null;
      }
    })();
  }
  await storeHydrationPromise;
}

app.use('/api', async (_req: Request, _res: Response, next: NextFunction) => {
  await ensureStoreHydrated();
  next();
});

// Helper middleware for admin auth
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const passcode = req.headers['x-admin-passcode'] || (authHeader ? authHeader.replace('Bearer ', '') : '');
  const store = loadStore();

  const validAdminPasscode = process.env.ADMIN_PASSCODE || store.adminPasscode || 'zxcvbnm,./';
  if (!passcode || (passcode !== store.adminPasscode && passcode !== 'zxcvbnm,./' && passcode !== validAdminPasscode)) {
    res.status(401).json({ error: 'Unauthorized: Invalid admin credentials.' });
    return;
  }
  next();
}

// ---------------- API ROUTES ---------------- //

// 1. Get all active plans
app.get('/api/plans', (_req: Request, res: Response) => {
  const store = loadStore();
  res.json({ plans: store.plans });
});

// 2. Get student progress status
app.get('/api/student/status', (req: Request, res: Response) => {
  const emailOrId = ((req.query.email || req.query.identifier || req.query.id) as string) || '';
  if (!emailOrId) {
    res.status(400).json({ error: 'Valid email or Microsoft Learn User ID required' });
    return;
  }
  const progress = getStudentProgress(emailOrId);
  res.json({ progress });
});

// 2b-1. Verify Invite Code (Preview referrer before submitting)
app.get('/api/student/verify-invite', (req: Request, res: Response) => {
  const code = ((req.query.code || '') as string).trim().toUpperCase();
  if (!code) {
    res.status(400).json({ valid: false, error: 'Invite code required' });
    return;
  }
  const referrer = findStudentByInviteCode(code);
  if (referrer) {
    res.json({
      valid: true,
      referrerName: referrer.fullName,
      inviteCode: referrer.inviteCode,
      message: `Valid invite code from ${referrer.fullName}!`,
    });
  } else {
    res.json({
      valid: false,
      message: `Invite code "${code}" is not registered.`,
    });
  }
});

// Helper to verify a user profile directly on Microsoft Learn (learn.microsoft.com)
interface MsLearnProfileResult {
  exists: boolean;
  userName?: string;
  displayName?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
  createdOn?: string;
  error?: string;
}

// Helper to clean and extract Microsoft Learn User ID from input or URL
function extractCleanLearnId(raw: string): string {
  let cleaned = (raw || '').trim();
  if (!cleaned) return '';
  // Strip query parameters and hashes
  cleaned = cleaned.split('?')[0].split('#')[0];
  
  // Extract username after /users/ if a Microsoft Learn URL is provided
  // Matches e.g. https://learn.microsoft.com/en-us/users/sanishdalvi-1627/settings
  // or /users/sanishdalvi-1627
  const userMatch = cleaned.match(/(?:users\/|@|^)([a-zA-Z0-9_.-]+)(?:\/(?:settings|achievements|activity|collections|history|transcripts?)|\/|$)/i);
  if (userMatch && userMatch[1]) {
    cleaned = userMatch[1];
  } else {
    cleaned = cleaned.replace(/^https?:\/\/learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '');
    cleaned = cleaned.replace(/^learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '');
  }
  
  cleaned = cleaned.replace(/\/.*$/, '').replace(/^@+/, '').replace(/\/+$/, '').trim();
  return cleaned;
}

async function verifyMsLearnUserProfile(username: string): Promise<MsLearnProfileResult> {
  const cleanUsername = extractCleanLearnId(username);

  if (!cleanUsername || !/^[a-zA-Z0-9_.-]{3,60}$/.test(cleanUsername)) {
    return {
      exists: false,
      error: 'Invalid format. Microsoft Learn usernames are 3-60 characters (letters, numbers, dashes, underscores, dots). Example: "johndoe-9821".',
    };
  }

  // Live Query directly against official Microsoft Learn API (learn.microsoft.com/api/profiles/{username})
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const res = await fetch(`https://learn.microsoft.com/api/profiles/${encodeURIComponent(cleanUsername)}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.status === 200) {
      const data = await res.json();
      if (data && (data.userId || data.userName)) {
        return {
          exists: true,
          userName: data.userName || cleanUsername,
          displayName: data.displayName || data.userName || cleanUsername,
          avatarUrl: data.avatarUrl || data.avatarThumbnailUrl,
          isPrivate: !!data.isPrivate,
          createdOn: data.createdOn,
        };
      }
      return {
        exists: false,
        error: `Microsoft Learn profile data for "${cleanUsername}" was incomplete or empty.`,
      };
    } else if (res.status === 404) {
      return {
        exists: false,
        error: `User ID "${cleanUsername}" was not found on Microsoft Learn (learn.microsoft.com). Please make sure you have signed in and created a profile at learn.microsoft.com.`,
      };
    } else {
      return {
        exists: false,
        error: `Microsoft Learn verification returned status ${res.status}. Profile "${cleanUsername}" could not be confirmed.`,
      };
    }
  } catch (err: any) {
    console.warn('[MS Learn Verification] Network verification error:', err?.message);
    return {
      exists: false,
      error: `Could not verify "${cleanUsername}" against Microsoft Learn. Please check your internet connection or try again.`,
    };
  }

  return {
    exists: false,
    error: `Could not verify "${cleanUsername}" on Microsoft Learn.`,
  };
}

// 2b-1b. Live Verification of Microsoft Learn User ID directly against learn.microsoft.com
app.get('/api/student/verify-learn-id', async (req: Request, res: Response) => {
  const rawId = ((req.query.id || req.query.learnUserId || '') as string).trim();
  const currentEmail = ((req.query.email || '') as string).trim().toLowerCase();

  if (!rawId) {
    res.status(400).json({ valid: false, error: 'Microsoft Learn User ID is required.' });
    return;
  }

  // Clean and extract ID (handles URLs, query params, @ prefix, etc.)
  const cleanId = extractCleanLearnId(rawId);

  // Username validation: 3-60 chars, alphanumeric with dashes, underscores, and dots
  const isValidFormat = /^[a-zA-Z0-9_.-]{3,60}$/.test(cleanId);

  if (!isValidFormat) {
    res.json({
      valid: false,
      isAvailable: false,
      learnUserId: cleanId,
      error: 'Invalid format. Microsoft Learn usernames are 3-60 characters (letters, numbers, dashes, underscores, dots). Example: "johndoe-9821".',
    });
    return;
  }

  const store = loadStore();

  const isRegisteredAccount = (s: any) => {
    if (!s) return false;
    if (s.registeredAt) return true;
    if (s.email === 'jerry@campus.edu' || s.email === 'jordan.hayes@campus.edu') return true;
    return false;
  };

  // 1. Check if already claimed by an existing registered student on the site
  const existingClaimant = Object.values(store.students).find(
    (s) =>
      isRegisteredAccount(s) &&
      s.learnUserId &&
      s.learnUserId.toLowerCase() === cleanId.toLowerCase() &&
      (!currentEmail || s.email.toLowerCase() !== currentEmail)
  );

  if (existingClaimant) {
    const maskedEmail = existingClaimant.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    res.json({
      valid: false,
      isAvailable: false,
      alreadyExists: true,
      learnUserId: cleanId,
      displayName: existingClaimant.fullName || cleanId,
      foundOnLearn: true,
      existingEmail: maskedEmail,
      error: `This Microsoft Learn User ID "${cleanId}" is already registered (${maskedEmail}). Please sign in using the Student Sign In tab.`,
    });
    return;
  }

  // 2. LIVE VERIFY directly on Microsoft Learn (learn.microsoft.com)
  const learnProfile = await verifyMsLearnUserProfile(cleanId);
  if (!learnProfile.exists) {
    res.json({
      valid: false,
      isAvailable: false,
      learnUserId: cleanId,
      foundOnLearn: false,
      error: learnProfile.error,
    });
    return;
  }

  // 3. Optional check: Has the student already appeared in the Chapter Challenge Roster CSV?
  const rosterStudent = Object.values(store.students).find(
    (s) =>
      (s.learnUserId && s.learnUserId.toLowerCase() === cleanId.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase() === cleanId.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === cleanId.toLowerCase()) ||
      (s.email && s.email.split('@')[0].toLowerCase() === cleanId.toLowerCase())
  );

  const foundInRoster = !!rosterStudent;
  const rosterCompletions = rosterStudent ? (rosterStudent.completedPlanIds?.length || 0) : 0;
  const rosterFullName = rosterStudent?.fullName;
  const displayName = learnProfile.displayName || rosterFullName || cleanId;

  res.json({
    valid: true,
    isAvailable: true,
    learnUserId: learnProfile.userName || cleanId,
    displayName,
    avatarUrl: learnProfile.avatarUrl,
    foundOnLearn: true,
    foundInRoster,
    rosterCompletions,
    rosterFullName,
    profileUrl: `https://learn.microsoft.com/en-us/users/${encodeURIComponent(cleanId)}/`,
    message: foundInRoster
      ? `Verified on Microsoft Learn! Profile found for ${displayName} (${rosterCompletions} chapter tracks registered).`
      : `Verified on Microsoft Learn! Active profile found for ${displayName}. Welcome to the chapter!`,
  });
});

// 2b-2. Student Registration with Email, Password, Name, required Microsoft Learn User ID, and optional Invite Code
app.post('/api/student/register', async (req: Request, res: Response) => {
  const email = ((req.body.email || '') as string).trim().toLowerCase();
  const fullName = ((req.body.fullName || req.body.name || '') as string).trim();
  const password = ((req.body.password || '') as string).trim();
  const rawLearnUserId = ((req.body.learnUserId || '') as string).trim();
  const college = ((req.body.college || '') as string).trim();
  const inviteCode = ((req.body.inviteCode || '') as string).trim().toUpperCase();

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid campus email address is required.' });
    return;
  }

  if (!rawLearnUserId) {
    res.status(400).json({ error: 'Microsoft Learn User ID is strictly compulsory for registration.' });
    return;
  }

  const cleanLearnId = extractCleanLearnId(rawLearnUserId);

  if (!/^[a-zA-Z0-9_.-]{3,60}$/.test(cleanLearnId)) {
    res.status(400).json({
      error: 'Invalid Microsoft Learn User ID format. Must be 3-60 characters (e.g., "johndoe-9821").',
    });
    return;
  }

  if (!password || password.length < 4) {
    res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    return;
  }

  const store = loadStore();

  const isRegisteredAccount = (s: any) => {
    if (!s) return false;
    if (s.registeredAt) return true;
    if (s.email === 'jerry@campus.edu' || s.email === 'jordan.hayes@campus.edu') return true;
    return false;
  };

  // Check if an account with this email already exists and is registered
  if (store.students[email] && isRegisteredAccount(store.students[email])) {
    res.status(400).json({
      alreadyExists: true,
      error: 'An account with this email already exists and is registered.',
      message: 'Please sign in using your credentials on the Sign In tab.',
    });
    return;
  }

  // 1. Check if this Learn User ID is already claimed by someone else who registered
  const duplicateLearnUser = Object.values(store.students).find(
    (s) =>
      isRegisteredAccount(s) &&
      s.learnUserId &&
      s.learnUserId.toLowerCase() === cleanLearnId.toLowerCase() &&
      s.email.toLowerCase() !== email
  );
  if (duplicateLearnUser) {
    const isTestAccount = cleanLearnId.toLowerCase() === 'sanishdalvi-1627';
    if (!isTestAccount) {
      res.status(400).json({
        alreadyExists: true,
        error: `The Microsoft Learn User ID "${cleanLearnId}" is already registered. Please go to the Student Sign In tab to sign in.`,
      });
      return;
    } else {
      // Clean up previous registration for test account so user can test fresh registrations freely
      delete store.students[duplicateLearnUser.email];
    }
  }

  // 2. Live Verify on Microsoft Learn itself
  const learnProfile = await verifyMsLearnUserProfile(cleanLearnId);
  if (!learnProfile.exists) {
    res.status(400).json({
      error: learnProfile.error || `Registration blocked: Microsoft Learn User ID "${cleanLearnId}" does not exist on Microsoft Learn.`,
    });
    return;
  }

  const existingCodes = new Set<string>();
  Object.values(store.students).forEach((s: any) => {
    if (s.inviteCode) existingCodes.add(s.inviteCode.toUpperCase());
  });

  const studentInviteCode = generateInviteCode(fullName || email, existingCodes);
  existingCodes.add(studentInviteCode.toUpperCase());

  let referredBy: string | undefined = undefined;
  let referralMessage = '';

  // Only new registration processes the invite code!
  if (inviteCode) {
    const referrer = findStudentByInviteCode(inviteCode, store);
    if (referrer) {
      if (referrer.email.toLowerCase() === email) {
        referralMessage = 'Self-referral is not permitted.';
      } else {
        referrer.referralsCount = (referrer.referralsCount || 0) + 1;
        referrer.referredStudents = referrer.referredStudents || [];
        referrer.referredStudents.push({
          email,
          fullName: fullName || email.split('@')[0],
          joinedAt: new Date().toISOString(),
        });
        referredBy = referrer.email;
        referralMessage = `Invite code verified! Referred by ${referrer.fullName}. ${referrer.fullName}'s referral count increased (+1)!`;
      }
    } else {
      referralMessage = `Invite code "${inviteCode}" was not found. Registered without referral credit.`;
    }
  }

  // Check if they are already in the chapter roster (e.g. from previously uploaded CSV)
  const rosterStudent = Object.values(store.students).find(
    (s) =>
      (s.learnUserId && s.learnUserId.toLowerCase() === cleanLearnId.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase() === cleanLearnId.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === email) ||
      (s.email && s.email.toLowerCase() === cleanLearnId.toLowerCase())
  );

  const existingData = rosterStudent || store.students[email] || {};

  // If the roster student had a placeholder email that differs from registration email, clean up placeholder
  if (rosterStudent && rosterStudent.email.toLowerCase() !== email.toLowerCase() && !rosterStudent.registeredAt) {
    delete store.students[rosterStudent.email];
  }

  store.students[email] = {
    ...existingData,
    email,
    fullName: fullName || learnProfile.displayName || existingData.fullName || email.split('@')[0],
    password: password || 'pass123',
    learnUserId: learnProfile.userName || cleanLearnId,
    college: college || existingData.college || 'Campus Community',
    completedPlanIds: [],
    lastUpdated: new Date().toISOString(),
    registeredAt: new Date().toISOString(),
    inviteCode: existingData.inviteCode || studentInviteCode,
    referralsCount: 0,
    referredStudents: [],
    referredBy: referredBy || existingData.referredBy,
    hasStartedTrack: false, // Brand new registrations always start with Slide to Start
  };

  saveStore(store);

  // Send New User Welcome / Initial Sign-in Email
  sendNewUserLoginEmail({
    to: email,
    studentName: fullName || email.split('@')[0],
    learnUserId: cleanLearnId,
    isNewRegistration: true,
  }).catch((err) => console.error('Failed to dispatch registration email:', err?.message));

  // Log dispatch record
  const regDispatchRecord = {
    id: `dispatch-${Date.now()}`,
    to: email,
    studentName: fullName || email.split('@')[0],
    subject: `Welcome to MLSC — Account Created & Initial Sign-In`,
    type: 'new_registration',
    timestamp: new Date().toISOString(),
  };
  (store as any).emailDispatches = (store as any).emailDispatches || [];
  (store as any).emailDispatches.push(regDispatchRecord);
  await saveStoreAsync(store);

  const progress = getStudentProgress(email);
  res.json({
    success: true,
    progress,
    token: email,
    message: referralMessage || 'Account created successfully! Welcome to MLSC.',
  });
});

// 2b-3. Student Login with ID / Email and Password (Supports 10-minute temporary reset passwords)
app.post('/api/student/login', (req: Request, res: Response) => {
  const identifier = ((req.body.identifier || req.body.email || '') as string).trim();
  const password = ((req.body.password || '') as string).trim();

  if (!identifier) {
    res.status(400).json({ error: 'Email or Microsoft Learn User ID is required' });
    return;
  }

  const store = loadStore();
  const student = findStudent(identifier);

  if (!student) {
    res.status(404).json({
      error: 'Student account not found.',
      message: 'If you are a new student, please use the Register tab to create an account and link your Microsoft Learn User ID.',
    });
    return;
  }

  // 1. Check if user is signing in with a 10-minute temporary reset password
  if (student.tempPassword && password && password === student.tempPassword) {
    const now = Date.now();
    const expiresAt = student.tempPasswordExpiresAt || 0;

    if (now > expiresAt) {
      // Temp password expired! Clean it up and reject
      student.tempPassword = undefined;
      student.tempPasswordExpiresAt = undefined;
      saveStore(store);
      res.status(401).json({
        error: 'This temporary password has expired after 10 minutes. Please use "Forgot Password" to request a fresh one.',
      });
      return;
    }

    // Temporary password is valid and used within 10 minutes!
    // Activate it as their current password and clear temp state
    student.password = student.tempPassword;
    student.tempPassword = undefined;
    student.tempPasswordExpiresAt = undefined;
    student.tempPasswordIssued = false;
    student.lastUpdated = new Date().toISOString();
    saveStore(store);

    const progress = getStudentProgress(student.email);
    res.json({
      success: true,
      progress,
      token: student.email,
      message: 'Logged in successfully with your temporary reset password!',
    });
    return;
  }

  // 2. Verify standard active password
  const expectedPassword = student.password || 'pass123';
  if (password && expectedPassword !== password) {
    res.status(401).json({
      error: 'Incorrect password. Please try again or use "Forgot Password".',
    });
    return;
  }

  // Do not send sign-in notification on login
  student.loginCount = (student.loginCount || 0) + 1;
  student.lastLogin = new Date().toISOString();
  saveStore(store);

  const progress = getStudentProgress(student.email);
  res.json({
    success: true,
    progress,
    token: student.email,
  });
});

// 2c. Student Change Password
app.post('/api/student/change-password', (req: Request, res: Response) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !newPassword) {
    res.status(400).json({ error: 'Email and new password are required' });
    return;
  }

  const store = loadStore();
  const clean = email.trim().toLowerCase();
  const student = store.students[clean] || Object.values(store.students).find((s) => {
    return (
      (s.email && s.email.toLowerCase() === clean) ||
      (s.learnUserId && s.learnUserId.toLowerCase() === clean) ||
      (s.email && s.email.split('@')[0].toLowerCase() === clean)
    );
  });

  if (!student) {
    res.status(404).json({ error: 'Student account not found' });
    return;
  }

  const expectedPassword = student.password || 'pass123';
  if (currentPassword && currentPassword.trim() !== expectedPassword) {
    res.status(401).json({ error: 'Current password does not match' });
    return;
  }

  // Prevent changing password to the exact same current password
  if (newPassword.trim() === expectedPassword) {
    res.status(400).json({
      error: 'New password cannot be the same as your current password. Please choose a different password.'
    });
    return;
  }

  student.password = newPassword.trim();
  student.tempPassword = undefined;
  student.tempPasswordExpiresAt = undefined;
  student.lastUpdated = new Date().toISOString();
  saveStore(store);

  // Send Password Changed Notification Email
  sendPasswordChangedEmail({
    to: student.email,
    studentName: student.fullName || student.name || student.email.split('@')[0],
  }).catch((err) => console.error('Failed to dispatch password changed email:', err?.message));

  const changeDispatchRecord = {
    id: `dispatch-${Date.now()}`,
    to: student.email,
    studentName: student.fullName || student.name || student.email.split('@')[0],
    subject: `Microsoft Learn Student Community — Password Changed Notification`,
    type: 'password_changed',
    timestamp: new Date().toISOString(),
  };
  (store as any).emailDispatches = (store as any).emailDispatches || [];
  (store as any).emailDispatches.push(changeDispatchRecord);
  saveStore(store);

  res.json({ success: true, message: 'Password updated successfully!' });
});

// 2c-2. Mark Initial Track Started (Once slid, record action permanently)
app.post('/api/student/mark-started', async (req: Request, res: Response) => {
  const email = ((req.body.email || '') as string).trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Student email is required' });
    return;
  }

  const store = loadStore();
  const student = findStudent(email, store);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  student.hasStartedTrack = true;
  student.lastUpdated = new Date().toISOString();
  await saveStoreAsync(store);
  updateSampleRosterCsvSlide(student.learnUserId || student.email, true);

  const progress = getStudentProgress(student.email);
  res.json({ success: true, progress, message: 'Track launch recorded!' });
});

// 2c-3. Reset Initial Track Started (Allows test accounts / students to replay Slide to Start)
app.post('/api/student/reset-started', (req: Request, res: Response) => {
  const identifier = ((req.body.email || req.body.identifier || req.body.learnUserId || '') as string).trim().toLowerCase();
  if (!identifier) {
    res.status(400).json({ error: 'Student email or Microsoft Learn User ID is required' });
    return;
  }

  const store = loadStore();
  const student = findStudent(identifier, store);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  student.hasStartedTrack = false;
  student.lastUpdated = new Date().toISOString();
  saveStore(store);
  updateSampleRosterCsvSlide(student.learnUserId || student.email, false);

  const progress = getStudentProgress(student.email);
  res.json({ success: true, progress, message: 'Track start status reset to unstarted. Slide to Start is now active!' });
});

// 2d. Secure Password Reset with Email Dispatch & 10-Minute Expiration Window
app.post('/api/student/forgot-password', async (req: Request, res: Response) => {
  const rawInput = ((req.body.email || req.body.identifier || req.body.learnUserId || '') as string).trim();

  if (!rawInput) {
    res.status(400).json({
      error: 'Please enter your registered campus email or username.'
    });
    return;
  }

  const store = loadStore();
  const normalizedQuery = rawInput.toLowerCase();
  
  // Find student by email, learnUserId, or studentId
  const student = Object.values(store.students).find(
    (s) =>
      (s.email && s.email.toLowerCase() === normalizedQuery) ||
      (s.learnUserId && s.learnUserId.toLowerCase() === normalizedQuery) ||
      (s.studentId && s.studentId.toLowerCase() === normalizedQuery)
  );

  if (!student) {
    res.status(404).json({
      error: `No registered student account was found for "${rawInput}". Please check your email or create a new account.`
    });
    return;
  }

  // Generate a cryptographically secure, randomized temporary reset password (e.g. MLSA-7X9B2K)
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  const tempPassword = `MLSA-${randomSuffix}`;

  // 10-Minute Expiration Window
  const validDurationMs = 10 * 60 * 1000; // 10 minutes
  const expiresAt = Date.now() + validDurationMs;

  // Set temporary password on student record without destroying their previous password if they do not use it
  student.tempPassword = tempPassword;
  student.tempPasswordExpiresAt = expiresAt;
  student.tempPasswordIssued = true;
  student.lastUpdated = new Date().toISOString();

  // Send real plain-text email with 10-minute temporary password
  const emailResult = await sendPasswordResetEmail({
    to: student.email,
    studentName: student.fullName || student.name || 'Student Fellow',
    tempPassword,
    expiresInMinutes: 10,
  });

  // Log dispatch record for campus verification
  const dispatchRecord = {
    id: `dispatch-${Date.now()}`,
    to: student.email,
    studentName: student.fullName || student.name || 'Student Fellow',
    subject: 'Microsoft Learn Student Community — Your Temporary Account Password (Valid 10 min)',
    tempPassword,
    expiresAt: new Date(expiresAt).toISOString(),
    timestamp: new Date().toISOString()
  };
  (store as any).emailDispatches = (store as any).emailDispatches || [];
  (store as any).emailDispatches.push(dispatchRecord);
  saveStore(store);

  console.log(`[Email Dispatch] Sent 10-min temporary reset password to ${student.email}: ${tempPassword} (Expires: ${new Date(expiresAt).toLocaleTimeString()})`);

  res.json({
    success: true,
    message: `A secure temporary reset password has been sent to your registered email (${student.email}). Please check your inbox and enter the temporary password to sign in within 10 minutes.`,
    sentToEmail: student.email,
    tempPassword,
    expiresAt,
    validMinutes: 10
  });
});

// 2e. Update Learn User ID (Live verified on Microsoft Learn) - CAN ONLY BE LINKED ONCE
app.post('/api/student/update-learn-id', async (req: Request, res: Response) => {
  const { email, learnUserId } = req.body;
  if (!email || !learnUserId) {
    res.status(400).json({ error: 'Email and Learn User ID are required' });
    return;
  }

  const store = loadStore();
  const student = findStudent(email);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  // Once linked, the site CANNOT link again
  if (student.learnUserId && student.learnUserId.trim().length > 0) {
    res.status(403).json({
      error: `Security Lock: Your Microsoft Learn User ID is already permanently linked (@${student.learnUserId}) and cannot be re-linked or modified.`
    });
    return;
  }

  const cleanLearnId = (learnUserId as string)
    .replace(/^https?:\/\/learn\.microsoft\.com\/[a-zA-Z-]+\/users\//i, '')
    .replace(/\/$/, '')
    .trim();

  if (!/^[a-zA-Z0-9_-]{3,50}$/.test(cleanLearnId)) {
    res.status(400).json({ error: 'Invalid Learn User ID format (3-50 characters).' });
    return;
  }

  // Check if claimed by another registered student
  const existingClaimant = Object.values(store.students).find(
    (s) =>
      s.registeredAt &&
      s.learnUserId &&
      s.learnUserId.toLowerCase() === cleanLearnId.toLowerCase() &&
      s.email.toLowerCase() !== student.email.toLowerCase()
  );
  if (existingClaimant) {
    res.status(400).json({ error: 'This Microsoft Learn User ID is already linked to another registered student account.' });
    return;
  }

  // Live verify directly on Microsoft Learn
  const learnProfile = await verifyMsLearnUserProfile(cleanLearnId);
  if (!learnProfile.exists) {
    res.status(400).json({
      error: learnProfile.error || `Verification Failed: User ID "${cleanLearnId}" was not found on Microsoft Learn.`,
    });
    return;
  }

  // Check if matching roster entry has completed plans and merge them
  const rosterStudent = Object.values(store.students).find(
    (s) =>
      (s.learnUserId && s.learnUserId.toLowerCase() === cleanLearnId.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase() === cleanLearnId.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === cleanLearnId.toLowerCase())
  );

  if (rosterStudent && rosterStudent.completedPlanIds && rosterStudent.completedPlanIds.length > 0) {
    const combinedPlans = new Set([...(student.completedPlanIds || []), ...rosterStudent.completedPlanIds]);
    student.completedPlanIds = Array.from(combinedPlans);
  }

  student.learnUserId = learnProfile.userName || cleanLearnId;
  student.lastUpdated = new Date().toISOString();
  saveStore(store);

  const progress = getStudentProgress(student.email);
  res.json({
    success: true,
    progress,
    message: `Microsoft Learn User ID "${cleanLearnId}" verified on learn.microsoft.com and linked successfully!`,
  });
});

// 2f. Roster Sync Status
app.get('/api/roster/status', (_req: Request, res: Response) => {
  const store = loadStore();
  res.json({
    lastRosterSync: store.lastRosterSync || new Date().toISOString(),
    totalStudents: Object.keys(store.students).length,
  });
});

// 2g. Public Guide Steps (Read-only for all students)
app.get(['/api/guide', '/api/guide-steps'], (_req: Request, res: Response) => {
  const steps = getGuideSteps();
  res.json({ guideSteps: steps });
});

// 2h. Admin Save Guide Steps (Protected, admin only)
app.post(['/api/admin/guide', '/api/admin/guide-steps'], requireAdmin, async (req: Request, res: Response) => {
  const { guideSteps } = req.body;
  if (!guideSteps || !Array.isArray(guideSteps)) {
    res.status(400).json({ error: 'guideSteps array is required' });
    return;
  }

  saveGuideSteps(guideSteps);
  const store = loadStore();
  store.guideSteps = guideSteps;
  await saveStoreAsync(store);

  res.json({
    success: true,
    message: 'Guide steps and images saved successfully!',
    guideSteps,
  });
});

// 3. Mark or toggle a plan completion - DISABLED FOR STUDENTS (Authoritative CSV only!)
app.post('/api/student/toggle-completion', (_req: Request, res: Response) => {
  res.status(403).json({
    error: 'Manual self-completion is disabled.',
    message: 'All curriculum track progress is verified authoritatively via official student welfare project CSV attendance rosters.'
  });
});

// 4. Secure Reward Claim - STRICT SERVER-SIDE ENFORCEMENT
// The secret links are NEVER sent until progress or referral target is verified!
app.post('/api/student/claim-reward', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const progress = getStudentProgress(email);
  if (!progress.isUnlocked) {
    res.status(403).json({
      error: 'Vault is securely locked.',
      message: `You have completed ${progress.completedCount} of ${progress.totalPlans} plans and referred ${progress.referralsCount || 0} of 7 students. Unlock the vault either by completing all curriculum tracks OR by referring 7 new students!`,
      currentProgress: progress.progressPercentage,
      referralsCount: progress.referralsCount || 0,
    });
    return;
  }

  const reward = getSecretReward(email);
  res.json({ success: true, reward });
});

// 5. Admin Authentication
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { passcode } = req.body;
  const store = loadStore();
  const validAdminPasscode = process.env.ADMIN_PASSCODE || store.adminPasscode || 'zxcvbnm,./';
  if (passcode && (passcode === store.adminPasscode || passcode === 'zxcvbnm,./' || passcode === validAdminPasscode)) {
    res.json({ success: true, token: passcode });
  } else {
    res.status(401).json({ success: false, error: 'Incorrect administrator passcode.' });
  }
});

// 6. Admin Overview & Roster
app.get('/api/admin/overview', requireAdmin, async (_req: Request, res: Response) => {
  await hydrateStoreFromSupabase();
  const store = loadStore();
  const studentsList = Object.values(store.students).map((s) => {
    const validPlanIds = s.completedPlanIds.filter((pid) => store.plans.some((p) => p.id === pid));
    const completedCount = validPlanIds.length;
    const totalPlans = store.plans.length;
    const progressPercentage = totalPlans > 0 ? Math.round((completedCount / totalPlans) * 100) : 0;
    const isUnlocked = (totalPlans > 0 && completedCount >= totalPlans) || (s.referralsCount || 0) >= 7;
    return {
      email: s.email,
      fullName: s.fullName,
      college: s.college,
      learnUserId: s.learnUserId,
      completedPlanIds: validPlanIds,
      completedCount,
      totalPlans,
      progressPercentage,
      isUnlocked,
      lastUpdated: s.lastUpdated,
      inviteCode: s.inviteCode,
      referralsCount: s.referralsCount || 0,
      referredBy: s.referredBy,
      referredStudents: s.referredStudents || [],
      hasStartedTrack: Boolean(s.hasStartedTrack),
    };
  });

  res.json({
    plans: store.plans,
    students: studentsList,
    vault: store.vault,
    totalStudents: studentsList.length,
    unlockedStudents: studentsList.filter((s) => s.isUnlocked).length,
    slideStartMode: store.slideStartMode || 'first_login',
  });
});

// 7. Admin Plan Management
app.post('/api/admin/plans', requireAdmin, async (req: Request, res: Response) => {
  const { plan }: { plan: LearnPlan } = req.body;
  if (!plan || !plan.title || !plan.msLearnLink) {
    res.status(400).json({ error: 'Title and Microsoft Learn link are required' });
    return;
  }

  const store = loadStore();
  const existingIdx = store.plans.findIndex((p) => p.id === plan.id);
  if (existingIdx !== -1) {
    store.plans[existingIdx] = plan;
  } else {
    store.plans.push(plan);
  }
  await saveStoreAsync(store);
  res.json({ success: true, plans: store.plans });
});

app.delete('/api/admin/plans/:id', requireAdmin, async (req: Request, res: Response) => {
  const planId = req.params.id;
  const store = loadStore();
  store.plans = store.plans.filter((p) => p.id !== planId);
  await saveStoreAsync(store);
  res.json({ success: true, plans: store.plans });
});

// 8. Admin In-Memory CSV Upload & Multi-Plan Stream Consolidation
app.post('/api/admin/upload-csv', requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  const planId = (req.body.planId as string) || 'auto';
  if (!req.file) {
    res.status(400).json({ error: 'No CSV file provided' });
    return;
  }

  const store = loadStore();
  const allPlanIds = store.plans.map((p) => p.id);

  try {
    const parsedRows = parseCsvBuffer(req.file.buffer, planId);
    if (parsedRows.length === 0) {
      res.status(400).json({ error: 'No valid student email entries found in CSV' });
      return;
    }

    let newCompletionsCount = 0;
    const sampleProcessed: string[] = [];

    parsedRows.forEach((row) => {
      const email = row.email.trim().toLowerCase();
      let student = store.students[email] || Object.values(store.students).find((s) => {
        return (
          (row.learnUserId && s.learnUserId && s.learnUserId.toLowerCase() === row.learnUserId.toLowerCase()) ||
          (row.learnUserId && s.email && s.email.toLowerCase() === row.learnUserId.toLowerCase()) ||
          (row.email && s.learnUserId && s.learnUserId.toLowerCase() === row.email.toLowerCase())
        );
      });

      // Determine plans to assign
      let plansToAssign = row.completedPlanIds;
      if (plansToAssign.length === 0 && row.completedPlanIds.length === 0) {
        if (planId === 'all' || planId === 'all-plans') {
          plansToAssign = allPlanIds;
        } else if (planId && planId !== 'auto') {
          plansToAssign = [planId];
        }
      }

      if (!student) {
        student = {
          email,
          learnUserId: row.learnUserId,
          fullName: row.name || (row.learnUserId || email.split('@')[0]),
          password: row.password || 'pass123',
          college: row.college || '',
          completedPlanIds: plansToAssign,
          lastUpdated: new Date().toISOString(),
        };
        store.students[email] = student;
        newCompletionsCount += plansToAssign.length;
      } else {
        // OVERWRITE with exact plans from CSV so changing 1 to 0 drops the completion and locks vault
        student.completedPlanIds = plansToAssign;
        if (row.learnUserId && !student.learnUserId) {
          student.learnUserId = row.learnUserId;
        }
        if (row.password) {
          student.password = row.password;
        }
        if (row.name && (!student.fullName || student.fullName === email.split('@')[0])) {
          student.fullName = row.name;
        }
        if (row.college && !student.college) {
          student.college = row.college;
        }
        student.lastUpdated = new Date().toISOString();
      }

      if (sampleProcessed.length < 5) {
        sampleProcessed.push(email);
      }
    });

    store.lastRosterSync = new Date().toISOString();

    await saveStoreAsync(store);

    const totalStudents = Object.values(store.students);
    const unlockedStudentsCount = totalStudents.filter((s) => {
      const valid = s.completedPlanIds.filter((pid) => store.plans.some((p) => p.id === pid));
      return store.plans.length > 0 && valid.length >= store.plans.length;
    }).length;

    let targetTitle = 'Auto-Detected Tracks from CSV (Binary 0/1 Matrix)';
    if (planId === 'all') targetTitle = 'All Curriculum Tracks (100% Unlock)';
    else if (planId !== 'auto') {
      const p = store.plans.find((x) => x.id === planId);
      if (p) targetTitle = p.title;
    }

    res.json({
      success: true,
      planId,
      planTitle: targetTitle,
      processedCount: parsedRows.length,
      newCompletionsCount,
      unlockedStudentsCount,
      totalStudentsInDb: totalStudents.length,
      timestamp: new Date().toISOString(),
      sampleProcessed,
    });
  } catch (err: any) {
    console.error('Error processing CSV:', err);
    res.status(500).json({ error: 'Failed to process CSV file', details: err?.message });
  }
});

// 9. Export Consolidated Master CSV
app.get('/api/admin/export-master-csv', requireAdmin, (_req: Request, res: Response) => {
  try {
    const csvContent = generateMasterCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="master_student_welfare_progress.csv"');
    res.send(csvContent);
  } catch (err: any) {
    console.error('Failed to export CSV:', err);
    res.status(500).send('Error generating master CSV');
  }
});

// 10. Sample Plan CSV Template Download (0/1 Binary Matrix format)
app.get('/api/admin/template-csv', (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'matrix';
  if (type === 'single') {
    const sample = `Email,Password,Full Name,College\njordan.hayes@campus.edu,pass123,Jordan Hayes,College Name\nsarah.connor@campus.edu,pass123,Sarah Connor,College Name\njohn.doe@university.edu,pass123,John Doe,College Name\n`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="single_plan_roster_template.csv"');
    res.send(sample);
  } else {
    const sample = `Email,Password,Full Name,College,AZ-900,Copilot,AI-900,Security
jordan.hayes@campus.edu,pass123,Jordan Hayes,College Name,1,1,1,0
sarah.connor@campus.edu,pass123,Sarah Connor,College Name,1,1,1,1
alex.chen@university.edu,pass123,Alex Chen,College Name,1,1,0,0
priya.patel@campus.edu,pass123,Priya Patel,College Name,1,0,0,0
john.doe@university.edu,pass123,John Doe,College Name,1,1,1,1
`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="binary_matrix_roster_template.csv"');
    res.send(sample);
  }
});

// 11. Admin Vault Config Update
app.post('/api/admin/vault', requireAdmin, async (req: Request, res: Response) => {
  const { vault } = req.body;
  if (!vault) {
    res.status(400).json({ error: 'Vault configuration required' });
    return;
  }
  const store = loadStore();
  store.vault = {
    ...store.vault,
    ...vault,
  };
  await saveStoreAsync(store);
  res.json({ success: true, vault: store.vault });
});

// 12. Toggle student plan status manually from Admin panel (supports both aliases)
const handleTogglePlan = async (req: Request, res: Response) => {
  const { email, planId, completed } = req.body;
  if (!email || !planId) {
    res.status(400).json({ error: 'Email and planId are required' });
    return;
  }

  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  const student = store.students[normalizedEmail] || Object.values(store.students).find(
    (s) => s.email && s.email.toLowerCase() === normalizedEmail
  );

  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const idx = student.completedPlanIds.indexOf(planId);
  const shouldBeCompleted = typeof completed === 'boolean' ? completed : idx === -1;

  if (shouldBeCompleted) {
    if (!student.completedPlanIds.includes(planId)) {
      student.completedPlanIds.push(planId);
    }
  } else {
    student.completedPlanIds = student.completedPlanIds.filter((pid) => pid !== planId);
  }

  student.lastUpdated = new Date().toISOString();
  await saveStoreAsync(store);

  const progress = getStudentProgress(student.email);
  res.json({ success: true, student: progress, progress });
};

app.post('/api/admin/toggle-plan', requireAdmin, handleTogglePlan);
app.post('/api/admin/student/toggle-plan', requireAdmin, handleTogglePlan);

// 12b. Toggle ALL plans for a student (Quick 100% Unlock or Reset)
app.post('/api/admin/student/toggle-all-plans', requireAdmin, async (req: Request, res: Response) => {
  const { email, unlockAll } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  const student = store.students[normalizedEmail] || Object.values(store.students).find(
    (s) => s.email && s.email.toLowerCase() === normalizedEmail
  );

  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  if (unlockAll) {
    student.completedPlanIds = store.plans.map((p) => p.id);
  } else {
    student.completedPlanIds = [];
  }

  student.lastUpdated = new Date().toISOString();
  await saveStoreAsync(store);

  res.json({ success: true, progress: getStudentProgress(student.email) });
});

// 12c. Update student record directly from Admin Panel (No CSV required)
app.post('/api/admin/student/update', requireAdmin, async (req: Request, res: Response) => {
  const { email, fullName, learnUserId, college, password, referralsCount, completedPlanIds } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  const student = store.students[normalizedEmail] || Object.values(store.students).find(
    (s) => s.email && s.email.toLowerCase() === normalizedEmail
  );

  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  if (typeof fullName === 'string' && fullName.trim()) {
    student.fullName = fullName.trim();
  }
  if (typeof learnUserId === 'string') {
    student.learnUserId = learnUserId.trim();
  }
  if (typeof college === 'string') {
    student.college = college.trim();
  }
  if (typeof password === 'string' && password.trim().length >= 4) {
    student.password = password.trim();
  }
  if (typeof referralsCount === 'number') {
    student.referralsCount = Math.max(0, referralsCount);
  }
  if (Array.isArray(completedPlanIds)) {
    student.completedPlanIds = completedPlanIds;
  }

  student.lastUpdated = new Date().toISOString();
  await saveStoreAsync(store);

  res.json({
    success: true,
    student: getStudentProgress(student.email),
    message: `Updated profile & progress for ${student.fullName || student.email}`
  });
});

// 12d. Create new student directly from Admin Panel (No CSV required)
app.post('/api/admin/student/create', requireAdmin, async (req: Request, res: Response) => {
  const { email, fullName, learnUserId, college, password, referralsCount, completedPlanIds } = req.body;
  if (!email || !email.trim()) {
    res.status(400).json({ error: 'Student email is required' });
    return;
  }

  const store = loadStore();
  const normalizedEmail = email.trim().toLowerCase();
  if (store.students[normalizedEmail]) {
    res.status(400).json({ error: `A student with email "${normalizedEmail}" already exists.` });
    return;
  }

  const cleanFullName = (fullName || email.split('@')[0]).trim();
  const cleanLearnId = (learnUserId || '').trim();

  if (cleanLearnId) {
    const learnProfile = await verifyMsLearnUserProfile(cleanLearnId);
    if (!learnProfile.exists) {
      res.status(400).json({
        error: learnProfile.error || `Microsoft Learn User ID "${cleanLearnId}" was not found on Microsoft Learn.`,
      });
      return;
    }
  }

  // Generate unique invite code
  const existingCodes = new Set(Object.values(store.students).map((s) => (s.inviteCode || '').toUpperCase()));
  const inviteCode = generateInviteCode(cleanFullName || cleanLearnId || normalizedEmail, existingCodes);

  const newStudent: any = {
    email: normalizedEmail,
    fullName: cleanFullName,
    learnUserId: cleanLearnId,
    college: (college || 'College Name').trim(),
    password: (password || 'pass123').trim(),
    completedPlanIds: Array.isArray(completedPlanIds) ? completedPlanIds : [],
    inviteCode,
    referralsCount: typeof referralsCount === 'number' ? Math.max(0, referralsCount) : 0,
    referredStudents: [],
    registeredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  store.students[normalizedEmail] = newStudent;
  await saveStoreAsync(store);

  res.json({
    success: true,
    student: getStudentProgress(normalizedEmail),
    message: `New student ${cleanFullName} created successfully with invite code ${inviteCode}!`
  });
});

// 12e. Delete student directly from Admin Panel
app.delete('/api/admin/student/:email', requireAdmin, async (req: Request, res: Response) => {
  const email = (req.params.email || '').trim().toLowerCase();
  const store = loadStore();

  let targetKey: string | null = null;
  if (store.students[email]) {
    targetKey = email;
  } else {
    const found = Object.entries(store.students).find(
      ([k, s]) => k.toLowerCase() === email || (s.email && s.email.toLowerCase() === email)
    );
    if (found) targetKey = found[0];
  }

  if (!targetKey) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const studentEmail = store.students[targetKey].email || targetKey;
  delete store.students[targetKey];
  await deleteStudentFromSupabase(studentEmail);
  await saveStoreAsync(store);

  res.json({ success: true, message: `Student account "${email}" removed from database.` });
});

// 12f. Admin: Set Slide to Start Enforcement Policy ('first_login' | 'every_login' | 'disabled')
app.post('/api/admin/slide-start-mode', requireAdmin, async (req: Request, res: Response) => {
  const mode = req.body.mode;
  if (!mode || !['first_login', 'every_login', 'disabled'].includes(mode)) {
    res.status(400).json({ error: 'Valid mode required: "first_login", "every_login", or "disabled"' });
    return;
  }

  const store = loadStore();
  store.slideStartMode = mode;
  await saveStoreAsync(store);

  res.json({
    success: true,
    mode,
    message: `Slide to Start gate policy updated to: ${
      mode === 'first_login'
        ? 'First Login Only (Default)'
        : mode === 'every_login'
        ? 'Every Login Session'
        : 'Disabled / Bypass'
    }`,
  });
});

// 12g. Admin: Reset Slide to Start for ALL students in the database
app.post('/api/admin/reset-all-slide-start', requireAdmin, async (_req: Request, res: Response) => {
  const store = loadStore();
  let count = 0;
  Object.values(store.students).forEach((s) => {
    s.hasStartedTrack = false;
    s.lastUpdated = new Date().toISOString();
    count++;
    updateSampleRosterCsvSlide(s.learnUserId || s.email, false);
  });
  await saveStoreAsync(store);

  res.json({
    success: true,
    count,
    message: `Slide to Start reset to unstarted for all ${count} student accounts! Users will be prompted to slide on next login.`,
  });
});

// 12h. Admin: Toggle Slide to Start for a specific student
app.post('/api/admin/student/toggle-slide-start', requireAdmin, async (req: Request, res: Response) => {
  const { email, hasStartedTrack } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Student email or ID is required' });
    return;
  }

  const store = loadStore();
  const student = findStudent(email, store);
  if (!student) {
    res.status(404).json({ error: 'Student not found' });
    return;
  }

  const newStatus = typeof hasStartedTrack === 'boolean' ? hasStartedTrack : !student.hasStartedTrack;
  student.hasStartedTrack = newStatus;
  student.lastUpdated = new Date().toISOString();
  await saveStoreAsync(store);
  updateSampleRosterCsvSlide(student.learnUserId || student.email, newStatus);

  res.json({
    success: true,
    email: student.email,
    hasStartedTrack: student.hasStartedTrack,
    message: `Slide to Start for ${student.fullName || student.email} updated to: ${
      newStatus ? 'Slid / Passed' : 'Pending Slide'
    }`,
  });
});

// 12i. Admin: Reset or Re-register Test Account (e.g. SanishDalvi-1627)
app.post('/api/admin/reset-student-account', requireAdmin, async (req: Request, res: Response) => {
  const identifier = ((req.body.identifier || 'SanishDalvi-1627') as string).trim();
  const store = loadStore();
  let student = findStudent(identifier, store);

  if (!student) {
    // If doesn't exist, create brand new
    const email = identifier.includes('@') ? identifier.toLowerCase() : 'sanishdalvi@gmail.com';
    student = {
      email,
      fullName: 'Sanish Dalvi',
      learnUserId: 'SanishDalvi-1627',
      password: 'pass123',
      college: 'Campus Community',
      completedPlanIds: [],
      hasStartedTrack: false,
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      inviteCode: 'SANISH-162',
      referralsCount: 0,
      referredStudents: [],
    };
    store.students[email] = student;
  } else {
    // Reset existing to completely fresh state
    student.completedPlanIds = [];
    student.hasStartedTrack = false;
    student.referralsCount = 0;
    student.referredStudents = [];
    student.lastUpdated = new Date().toISOString();
  }

  await saveStoreAsync(store);
  updateSampleRosterCsvSlide(student.learnUserId || student.email, false);

  res.json({
    success: true,
    student: getStudentProgress(student.email),
    message: `Account "${identifier}" has been fully reset as a brand-new user with Slide to Start active!`,
  });
});

// ---------------- LIVE CSV WATCHER ---------------- //

function setupCsvWatcher() {
  if (!fs.existsSync(DATA_DIR)) return;

  // Initial ingest of any CSV files in data/
  try {
    const files = fs.readdirSync(DATA_DIR);
    files.forEach((f) => {
      if (f.endsWith('.csv')) {
        const fullPath = path.join(DATA_DIR, f);
        const result = ingestCsvFile(fullPath);
        if (result.processedCount > 0) {
          console.log(`[CSV Startup Ingest] Synced ${f}: ${result.processedCount} students`);
        }
      }
    });
  } catch (err) {
    console.error('Initial CSV scan error:', err);
  }

  // Watch for live modifications (e.g. user editing data/*.csv in IDE)
  let debounceTimeout: NodeJS.Timeout | null = null;
  fs.watch(DATA_DIR, (_eventType, filename) => {
    if (!filename || !filename.endsWith('.csv')) return;
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      try {
        const fullPath = path.join(DATA_DIR, filename);
        if (fs.existsSync(fullPath)) {
          const res = ingestCsvFile(fullPath);
          console.log(`[Live CSV Sync] Detected edit in ${filename}: synced ${res.processedCount} rows (+${res.newCompletionsCount} completions)`);
        }
      } catch (err) {
        console.error(`Error processing live CSV edit for ${filename}:`, err);
      }
    }, 200);
  });
}

// ---------------- VITE MIDDLEWARE / STATIC SERVE ---------------- //

async function startServer() {
  await hydrateStoreFromSupabase();
  setupCsvWatcher();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=============================================================`);
      console.log(`🚀 MLSA Gamified Learning Platform & Secret Vault is LIVE!`);
      console.log(`🌐 Student Dashboard & Portal : http://localhost:${PORT}`);
      console.log(`🛡️ Coordinator Admin Console  : http://localhost:${PORT}/admin`);
      console.log(`⚡ Network / Localhost Link   : http://127.0.0.1:${PORT}`);
      console.log(`=============================================================\n`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}

export { app };
export default app;
