import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/dm-calc-ipad/',

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Dm Calc',
        short_name: 'Dm Calc',
        description: 'Personal practical calculator',

        theme_color: '#08131f',
        background_color: '#08131f',

        display: 'standalone',
        orientation: 'portrait',

        start_url: '/dm-calc-ipad/',

        icons: [
          {
            src: '/dm-calc-ipad/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/dm-calc-ipad/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})