import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const buildVersion = Date.now()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()], exclude: /node_modules/ }),
    tailwindcss(),
    {
      name: 'generate-version-json',
      buildStart() {
        const publicDir = path.resolve(__dirname, 'public')
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true })
        }
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify({ version: buildVersion }),
          'utf-8'
        )
      }
    },
  ],
  define: {
    __APP_VERSION__: buildVersion,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/firebase')) return 'vendor-firebase'
          if (id.includes('node_modules/i18next')) return 'vendor-i18n'
        },
      },
    },
  },
})

