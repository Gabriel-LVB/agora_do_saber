import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/')
          if (
            normalizedId.endsWith('/src/hooks/useSharedLibrarySync.js')
            || normalizedId.endsWith('/src/services/sharedLibraryContent.js')
          ) return 'shared-library-sync'
          if (
            normalizedId.endsWith('/src/hooks/useCourseDerivedState.js')
            || normalizedId.endsWith('/src/hooks/useGeminiRuntime.js')
          ) return 'app-runtime-hooks'
          if ([
            '/src/lib/firestoreData.js',
            '/src/lib/interaction.js',
            '/src/lib/questionTypes.js',
            '/src/lib/safeStorage.js',
            '/src/services/reviewScheduler.js',
          ].some(suffix => normalizedId.endsWith(suffix))) return 'app-data-core'
          if (!id.includes('node_modules')) return;
          if (id.includes('/firebase/')) return 'firebase';
          if (id.includes('/react') || id.includes('/scheduler/')) return 'react-vendor';
          if (id.includes('/ts-fsrs/')) return 'fsrs-vendor';
          if (id.includes('/fflate/')) return 'fflate-vendor';
          if (id.includes('/sql.js/')) return 'sql-vendor';
          return 'vendor';
        }
      }
    }
  }
})
