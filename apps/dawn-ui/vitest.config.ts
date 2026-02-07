import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./setupTests.ts'],
        alias: {
            '@eideus/universe-mapper': path.resolve(__dirname, '../../packages/eideus-universe-mapper/src'),
            '@eideus/world-bundle-binder': path.resolve(__dirname, '../../packages/eideus-world-bundle-binder/src'),
            'eideus-bestiary': path.resolve(__dirname, '../../packages/eideus-bestiary/src'),
            'eideus-xp-system': path.resolve(__dirname, '../../packages/eideus-xp-system/src'),
            'eideus-combat': path.resolve(__dirname, '../../packages/eideus-combat/src'),
            '@': path.resolve(__dirname, './src'),
        }
    },
});
