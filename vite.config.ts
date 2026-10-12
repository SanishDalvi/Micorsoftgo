import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'

function extractCleanLearnId(raw: string): string {
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

function msLearnVerifyPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (!req.url?.startsWith('/api/student/verify-learn-id')) {
      return next()
    }

    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
      const rawId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('learnUserId') || ''
      const cleanId = extractCleanLearnId(rawId)

      res.setHeader('Content-Type', 'application/json')

      if (!cleanId || !/^[a-zA-Z0-9_.-]{3,60}$/.test(cleanId)) {
        res.statusCode = 200
        res.end(
          JSON.stringify({
            valid: false,
            exists: false,
            learnUserId: cleanId,
            error:
              'Invalid format. Microsoft Learn usernames are 3-60 characters (letters, numbers, dashes, underscores, dots). Example: "johndoe-9821".',
          })
        )
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 6500)

      const apiRes = await fetch(
        `https://learn.microsoft.com/api/profiles/${encodeURIComponent(cleanId)}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
        }
      )
      clearTimeout(timeout)

      if (apiRes.status === 200) {
        const data = (await apiRes.json()) as any
        if (data && (data.userId || data.userName)) {
          res.statusCode = 200
          res.end(
            JSON.stringify({
              valid: true,
              exists: true,
              learnUserId: data.userName || cleanId,
              displayName: data.displayName || data.userName || cleanId,
              avatarUrl: data.avatarUrl || data.avatarThumbnailUrl,
              profileUrl: `https://learn.microsoft.com/en-us/users/${encodeURIComponent(cleanId)}/`,
              message: `Verified on Microsoft Learn! Active profile found for ${data.displayName || cleanId}.`,
            })
          )
          return
        }
      }

      if (apiRes.status === 404) {
        res.statusCode = 200
        res.end(
          JSON.stringify({
            valid: false,
            exists: false,
            learnUserId: cleanId,
            error: `User ID "${cleanId}" was not found on Microsoft Learn (learn.microsoft.com). Please make sure you have signed in and created a profile at learn.microsoft.com.`,
          })
        )
        return
      }

      res.statusCode = 200
      res.end(
        JSON.stringify({
          valid: false,
          exists: false,
          learnUserId: cleanId,
          error: `Microsoft Learn verification returned status ${apiRes.status}. Profile "${cleanId}" could not be confirmed.`,
        })
      )
    } catch (err: any) {
      res.statusCode = 200
      res.end(
        JSON.stringify({
          valid: false,
          exists: false,
          error: `Could not verify against Microsoft Learn: ${err?.message || 'Network error'}`,
        })
      )
    }
  }

  return {
    name: 'ms-learn-verify-plugin',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), msLearnVerifyPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env.ADMIN_PASSCODE': JSON.stringify(process.env.ADMIN_PASSCODE || process.env.VITE_ADMIN_PASSCODE || ''),
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
  },
})
