import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      fs: {
        allow: [
          path.resolve(__dirname, '..'),
          path.resolve(__dirname, '../..'),
          path.resolve(__dirname, '../../Galaxies_Folder'),
          path.resolve(__dirname, '../../packages'),
        ],
      },
    },
    plugins: [
      react(),
      {
        name: 'serve-galaxies-folder',
        configureServer(server) {
          server.middlewares.use('/Galaxies_Folder', (req, res, next) => {
            if (!req.url) return next();
            const filePath = path.join(__dirname, '../../Galaxies_Folder', req.url);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              // Determine content type based on extension
              if (filePath.endsWith('.png')) {
                res.setHeader('Content-Type', 'image/png');
              } else if (filePath.endsWith('.json')) {
                res.setHeader('Content-Type', 'application/json');
              }
              res.end(fs.readFileSync(filePath));
            } else {
              next();
            }
          });
        }
      }
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'eideus-routers': path.resolve(__dirname, '../../packages/eideus-routers/src'),
      }
    }
  };
});
