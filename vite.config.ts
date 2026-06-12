import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

import fs from 'fs'
import { execSync } from 'child_process'

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
export default defineConfig({
  define: {
    __BUILD_VERSION__: JSON.stringify(`1.0.${commitCount}`),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Cardappio',
        short_name: 'Cardappio',
        description: 'Seu planejador semanal de refeições inteligente',
        theme_color: '#10b981',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
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
})
