import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// Files from the project root that should be accessible through the Vite dev server
const ROOT_FILES = ['login.html', 'signup.html', 'auth.js', 'auth.css', 'patient.html', 'styles.css', 'app.js', 'doctor-launch.html', 'meiosis-setup.html'];


export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-root-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const urlPath = (req.url ?? '/').split('?')[0].replace(/^\//, '');
          
          if (urlPath === 'health') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', service: 'doctor-portal' }));
            return;
          }

          if (ROOT_FILES.includes(urlPath)) {
            const filePath = path.resolve(__dirname, '..', urlPath);
            if (fs.existsSync(filePath)) {
              const ext = path.extname(urlPath);
              const contentType =
                ext === '.html' ? 'text/html; charset=utf-8' :
                ext === '.js'   ? 'application/javascript; charset=utf-8' :
                ext === '.css'  ? 'text/css; charset=utf-8' : 'text/plain';
              res.setHeader('Content-Type', contentType);
              res.end(fs.readFileSync(filePath));
              return;
            }
          }
          next();
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      // Include the icon in the build output
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MEIOSIS Doctor Dashboard',
        short_name: 'MEIOSIS',
        description: 'Unified EMR and patient management for doctors',
        theme_color: '#010e1c',
        background_color: '#010e1c',
        display: 'standalone',
        orientation: 'landscape-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Precache all built assets (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Don't precache large lazy chunks — fetch them fresh but cache after first load
        globIgnores: ['**/chunk-*.js'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Backend API — Network first; fall back to cache so the UI still
            // loads when offline (reads stale data rather than blank screen).
            // Matches both relative (/api/) and absolute URLs (http(s)://...../api/)
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Lazy-loaded JS chunks — stale-while-revalidate so navigation
            // feels instant while the SW refreshes the chunk in the background.
            urlPattern: /\/assets\/chunk-.*\.js$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'lazy-chunks',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        // When offline, serve index.html for any unmatched navigation request
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/health/],
      },
      devOptions: {
        // Keep service workers out of local dev to avoid stale lazy chunks.
        enabled: false,
        type: 'module',
      },
    }),
  ],

  optimizeDeps: {
    // Pre-bundle these so Vite doesn't discover them lazily mid-load
    // (lazy discovery causes a full page reload).
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'lucide-react',
    ],
    exclude: ['jspdf', 'html2canvas'],
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      }
    },
    // Pre-transform only the critical render-path files so they're cached
    // before the browser requests them.  Warming up all 1600+ modules slows
    // the dev server startup; warming up just the entry chain keeps it fast.
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
        './src/pages/Dashboard.tsx',
        './src/components/Sidebar.tsx',
        './src/components/Topbar.tsx',
        './src/components/Queue/QueuePanel.tsx',
        './src/components/Queue/QueueCard.tsx',
        './src/components/Queue/QueueToolbar.tsx',
        './src/hooks/useQueue.ts',
        './src/hooks/usePatients.ts',
        './src/hooks/useDoctorAnalytics.ts',
        './src/hooks/useEmrShareNotifications.ts',
      ],
    },
  },

  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks so they can be cached
        // independently of app code across deployments.
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-icons':     ['lucide-react'],
        },
      },
    },
  },
});
