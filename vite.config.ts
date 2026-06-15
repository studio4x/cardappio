import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import https from 'https'

// Loader for environment variables
const loadEnv = () => {
  const env: Record<string, string> = {}
  const files = ['.env', '.env.local', '.env.production']
  for (const file of files) {
    try {
      const filePath = path.resolve(__dirname, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        content.split('\n').forEach((line) => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
          if (match) {
            const key = match[1]
            let value = match[2] || ''
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1)
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1)
            }
            env[key] = value.trim()
          }
        })
      }
    } catch (e) {
      // ignore
    }
  }
  return { ...env, ...process.env }
}

const httpsGet = (url: string, headers: Record<string, string>): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => resolve(data))
      res.on('error', (err) => reject(err))
    }).on('error', (err) => reject(err))
  })
}

const downloadFile = (url: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: any[] = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', (err) => reject(err))
    }).on('error', (err) => reject(err))
  })
}

const downloadPWAAssets = async () => {
  const env = loadEnv()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[PWA Assets] Supabase environment variables not found, skipping PWA assets sync.')
    return
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/app_settings?select=value_json&setting_key=eq.visual_identity`
    const headers = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    }

    const dataJson = await httpsGet(url, headers)
    const data = JSON.parse(dataJson)
    const visualIdentity = data?.[0]?.value_json
    const faviconUrl = visualIdentity?.favicon_url

    if (faviconUrl) {
      console.log(`[PWA Assets] Syncing PWA assets from favicon URL: ${faviconUrl}`)
      const buffer = await downloadFile(faviconUrl)
      
      const publicDir = path.resolve(__dirname, 'public')
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true })
      }

      fs.writeFileSync(path.resolve(publicDir, 'favicon.ico'), buffer)
      fs.writeFileSync(path.resolve(publicDir, 'pwa-192.png'), buffer)
      fs.writeFileSync(path.resolve(publicDir, 'pwa-512.png'), buffer)
      fs.writeFileSync(path.resolve(publicDir, 'apple-touch-icon.png'), buffer)
      console.log('[PWA Assets] Successfully synchronized PWA asset files.')
    } else {
      console.log('[PWA Assets] No custom favicon_url found in app_settings.')
    }
  } catch (error) {
    console.warn('[PWA Assets] Failed to sync PWA assets from Supabase:', error)
  }
}


let commitHash = 'unknown'
let commitCount = '0'

// 1. Tenta carregar os valores do version.json como base inicial
try {
  const versionData = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'version.json'), 'utf-8'))
  commitHash = versionData.commitHash || 'unknown'
  commitCount = versionData.commitCount || '0'
} catch (err) {
  // Ignora se não conseguir ler
}

const isVercel = !!process.env.VERCEL

if (!isVercel) {
  try {
    const gitHash = execSync('git rev-parse --short HEAD').toString().trim().slice(0, 7)
    const gitCount = execSync('git rev-list --count HEAD').toString().trim()
    
    // Atualiza se houver alguma diferença
    if (gitHash !== commitHash || gitCount !== commitCount) {
      commitHash = gitHash
      commitCount = gitCount
      fs.writeFileSync(
        path.resolve(__dirname, 'version.json'),
        JSON.stringify({ commitHash, commitCount })
      )
    }
  } catch (e) {
    // Mantém os valores lidos do version.json ou padrões
  }
} else {
  // No Vercel, o hash do commit exato pode ser injetado da variável de ambiente se disponível
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    commitHash = process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  }
}

// https://vite.dev/config/
export default defineConfig(async () => {
  await downloadPWAAssets()

  return {
    define: {
      __BUILD_VERSION__: JSON.stringify(`1.0.${commitCount}`),
      __COMMIT_HASH__: JSON.stringify(commitHash),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Cardappio',
          short_name: 'Cardappio',
          description: 'Seu planejador semanal de refeições inteligente',
          lang: 'pt-BR',
          theme_color: '#f76f25',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          importScripts: ['/push-worker.js'],
          globPatterns: ['**/*.{js,css,html,svg,png,jpg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
