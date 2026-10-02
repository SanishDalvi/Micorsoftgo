/**
 * ImageKit Media Helper & CDN URL Generator
 * 
 * Configurable via:
 * - VITE_IMAGEKIT_URL_ENDPOINT / IMAGEKIT_URL_ENDPOINT (e.g., https://ik.imagekit.io/your_imagekit_id)
 * - Or direct full ImageKit URLs in store.json / Admin panel
 */

// Default or configured ImageKit CDN endpoint
export const IMAGEKIT_ENDPOINT =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IMAGEKIT_URL_ENDPOINT) ||
  (typeof process !== 'undefined' && (process.env?.VITE_IMAGEKIT_URL_ENDPOINT || process.env?.IMAGEKIT_URL_ENDPOINT)) ||
  'https://ik.imagekit.io/mlsa_community';

export interface ImageKitTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'png' | 'jpg';
  cropMode?: 'pad_resize' | 'force' | 'maintain_ratio';
  blur?: number;
}

/**
 * Builds an optimized ImageKit URL with transformation query parameters
 */
export function buildImageKitUrl(
  pathOrUrl: string,
  options: ImageKitTransformOptions = {}
): string {
  if (!pathOrUrl) return '';

  // If already a full URL that's not ImageKit, return as-is
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    if (!pathOrUrl.includes('ik.imagekit.io')) {
      return pathOrUrl;
    }
  }

  // Construct transformations
  const transforms: string[] = [];
  if (options.width) transforms.push(`w-${options.width}`);
  if (options.height) transforms.push(`h-${options.height}`);
  if (options.quality) transforms.push(`q-${options.quality}`);
  if (options.format) transforms.push(`f-${options.format}`);
  if (options.cropMode) transforms.push(`cm-${options.cropMode}`);
  if (options.blur) transforms.push(`bl-${options.blur}`);

  const transformParam = transforms.length > 0 ? `?tr=${transforms.join(',')}` : '';

  // If already an ImageKit URL, append transform
  if (pathOrUrl.startsWith('http')) {
    const separator = pathOrUrl.includes('?') ? '&' : '?';
    const cleanTransform = transformParam.replace(/^\?/, '');
    return cleanTransform ? `${pathOrUrl}${separator}${cleanTransform}` : pathOrUrl;
  }

  // If a relative path (e.g. "guide/step1-ms-learn-login.png"), join with IMAGEKIT_ENDPOINT
  const cleanBase = IMAGEKIT_ENDPOINT.replace(/\/+$/, '');
  const cleanPath = pathOrUrl.replace(/^\/+/, '');

  return `${cleanBase}/${cleanPath}${transformParam}`;
}

/**
 * Guide screenshot placeholder definitions for easy ImageKit linking
 */
export const GUIDE_IMAGEKIT_PRESETS = {
  step1_login: {
    path: 'guide/step1-ms-learn-profile.png',
    title: 'Microsoft Learn Profile & User ID Header',
    description: 'Screenshot showing Profile menu dropdown and username in the URL bar',
  },
  step2_link: {
    path: 'guide/step2-platform-link.png',
    title: 'Student Sign In / Profile Modal on Campus Platform',
    description: 'Screenshot showing Learn User ID input field and verification status',
  },
  step3_launch: {
    path: 'guide/step3-module-launch.png',
    title: 'Microsoft Learn Study Plan & Interactive Units',
    description: 'Screenshot showing "Start" button, module syllabus, and interactive units',
  },
  step4_completed: {
    path: 'guide/step4-module-completed-check.png',
    title: '100% Completed Plan, Green Checkmarks & Trophy',
    description: 'Screenshot showing all modules green, completion banner, and badge',
  },
  step5_vault: {
    path: 'guide/step5-vault-unlocked.png',
    title: 'Secret Vault Enclave Decrypted',
    description: 'Screenshot showing unlocked GitHub repo access token and tutorial video',
  },
};
