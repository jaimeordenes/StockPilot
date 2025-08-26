import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: [
      'server/**/*.{test,spec}.ts',
      'client/src/**/*.{test,spec}.ts'
    ],
    globals: true,
    environment: 'node', // server tests por defecto; los de UI pueden sobreescribir si es necesario
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    }
  }
});
