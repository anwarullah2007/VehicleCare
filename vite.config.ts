import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const TEST_ENVIRONMENT_VARIABLES = [
  'TEST_USER_A_EMAIL',
  'TEST_USER_A_PASSWORD',
  'TEST_USER_B_EMAIL',
  'TEST_USER_B_PASSWORD',
];

export default defineConfig(({ mode }) => {
  if (mode === 'test') {
    const testEnvironment = loadEnv(mode, process.cwd(), '');
    for (const name of TEST_ENVIRONMENT_VARIABLES) {
      const value = testEnvironment[name];
      if (value) {
        process.env[name] = value;
      }
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
