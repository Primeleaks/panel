import { ref } from 'vue';

// Create a reactive config object that can be used throughout the app
const config = ref({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appName: import.meta.env.VITE_APP_NAME || 'HopeLeaks',
  discordInvite: import.meta.env.VITE_DISCORD_INVITE || 'https://discord.gg/hopeleaks',
  environment: import.meta.env.MODE || 'development'
});

export function useConfig() {
  // Check if we're running in development mode with no configured API URL
  if (config.value.environment === 'development' && !config.value.apiBaseUrl) {
    config.value.apiBaseUrl = 'http://localhost:3000';
  }

  // Methods to interact with config
  const isProduction = () => config.value.environment === 'production';
  const isDevelopment = () => config.value.environment === 'development';

  return {
    ...config.value,
    isProduction,
    isDevelopment
  };
}
