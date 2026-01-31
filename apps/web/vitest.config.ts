import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/__tests__/**',
        'src/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Point to source TypeScript files directly to avoid ESM/CJS issues
      '@aiplaces/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@aiplaces/shared/constants': path.resolve(__dirname, '../../packages/shared/src/constants/index.ts'),
      '@aiplaces/shared/types': path.resolve(__dirname, '../../packages/shared/src/types/index.ts'),
    },
  },
});
