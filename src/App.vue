<template>
  <div id="app">
    <!-- Global Loading Overlay -->
    <Loader v-if="isLoading" type="spinner" size="large" :overlay="true" :showText="true" text="Loading..." />
    
    <!-- Main Application Content -->
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    
    <!-- Theme Manager Toggle -->
    <button 
      class="theme-toggle-btn animate-float hover-grow"
      @click="showThemeManager = !showThemeManager"
      title="Theme Settings"
    >
      <i class="fas fa-palette"></i>
    </button>
    
    <!-- Theme Manager Panel -->
    <Modal
      v-model:visible="showThemeManager"
      title="Theme Settings"
      size="small"
      :blur="true"
    >
      <ThemeManager />
    </Modal>
    
    <!-- PWA Install Prompt Component -->
    <transition name="slide-up">
      <div v-if="showPWAPrompt" class="pwa-install-prompt animate-fadeInUp">
        <div class="pwa-prompt-content">
          <i class="fas fa-download animate-pulse"></i>
          <div class="pwa-prompt-text">
            <h4>Install Script Panel</h4>
            <p>Get the full app experience with offline access</p>
          </div>
          <div class="pwa-prompt-actions">
            <button @click="installPWA" class="btn btn-primary btn-ripple btn-sm">Install</button>
            <button @click="dismissPWAPrompt" class="btn btn-secondary btn-ripple btn-sm">Later</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, provide } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import ThemeManager from '@/components/ThemeManager.vue';
import Modal from '@/components/Modal.vue';
import Loader from '@/components/Loader.vue';
import toastService from '@/services/ToastService';
import { useConfig } from '@/composables/useConfig';

export default {
  name: 'App',
  components: {
    ThemeManager,
    Modal,
    Loader
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const config = useConfig();
    const isLoading = ref(false);
    const showPWAPrompt = ref(false);
    const showThemeManager = ref(false);
    let deferredPrompt = null;
    
    // Make config available to all components
    provide('config', config);

    // Global Loading State
    const setLoading = (loading) => {
      isLoading.value = loading;
    };

    // Toast Notification System using our service
    const showToast = (message, type = 'info', options = {}) => {
      const duration = options.duration || 5000;
      const title = options.title || '';
      
      switch (type) {
        case 'success':
          return toastService.success({ message, title, duration });
        case 'error':
          return toastService.error({ message, title, duration });
        case 'warning':
          return toastService.warning({ message, title, duration });
        default:
          return toastService.info({ message, title, duration });
      }
    };

    // PWA Installation
    const handlePWAPrompt = () => {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Don't show if already dismissed in this session
        if (!sessionStorage.getItem('pwa-dismissed')) {
          showPWAPrompt.value = true;
        }
      });
    };

    const installPWA = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          showToast('App installed successfully!', 'success');
        }
        
        deferredPrompt = null;
        showPWAPrompt.value = false;
      }
    };

    const dismissPWAPrompt = () => {
      showPWAPrompt.value = false;
      sessionStorage.setItem('pwa-dismissed', 'true');
    };

    // Global Error Handler
    const handleGlobalError = (error, instance, info) => {
      console.error('Global error:', error, info);
      showToast('An unexpected error occurred. Please try again.', 'error');
    };

    // Network Status
    const handleOnline = () => {
      showToast('Connection restored', 'success', 3000);
    };

    const handleOffline = () => {
      showToast('You are offline. Some features may be limited.', 'warning', 0);
    };

    // Keyboard Shortcuts
    const handleKeyboardShortcuts = (event) => {
      // Global keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            // Focus search (emit event for components to listen to)
            window.dispatchEvent(new CustomEvent('focus-search'));
            break;
          case '/':
            event.preventDefault();
            // Toggle help (future feature)
            break;
        }
      }
    };

    // Lifecycle
    onMounted(() => {
      handlePWAPrompt();
      
      // Add global event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      document.addEventListener('keydown', handleKeyboardShortcuts);
      
      // Set up global error handler
      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', (event) => {
        handleGlobalError(event.reason, null, 'unhandledrejection');
      });
    });

    // Provide global functions to child components
    provide('showToast', showToast);
    provide('setLoading', setLoading);

    return {
      isLoading,
      toasts,
      showPWAPrompt,
      showThemeManager,
      removeToast,
      getToastIcon,
      installPWA,
      dismissPWAPrompt
    };
  }
};
</script>

<style scoped>
/* Loading Overlay */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-content p {
  margin-top: 1rem;
  font-size: 1.1rem;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 400px;
  min-width: 300px;
  cursor: pointer;
  pointer-events: all;
  transform: translateX(100%);
  animation: slideIn 0.3s ease-out forwards;
}

.toast:hover {
  transform: translateX(0) scale(1.02);
}

.toast-success {
  border-left: 4px solid var(--success-color);
}

.toast-error {
  border-left: 4px solid var(--danger-color);
}

.toast-warning {
  border-left: 4px solid var(--warning-color);
}

.toast-info {
  border-left: 4px solid var(--info-color);
}

.toast i {
  font-size: 1.2rem;
}

.toast-success i { color: var(--success-color); }
.toast-error i { color: var(--danger-color); }
.toast-warning i { color: var(--warning-color); }
.toast-info i { color: var(--info-color); }

.toast span {
  flex: 1;
  font-weight: 500;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* PWA Install Prompt */
.pwa-install-prompt {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-toast);
  animation: slideUp 0.3s ease-out;
}

.pwa-prompt-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.pwa-prompt-content i {
  font-size: 2rem;
  color: var(--primary-color);
}

.pwa-prompt-text {
  flex: 1;
}

.pwa-prompt-text h4 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.pwa-prompt-text p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.pwa-prompt-actions {
  display: flex;
  gap: 8px;
}

/* Page Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Theme Manager */
.theme-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 900;
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.1);
  background-color: var(--primary-color-dark);
}

.theme-manager-wrapper {
  position: fixed;
  top: 0;
  right: 0;
  width: 350px;
  height: 100%;
  background-color: var(--card-bg);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 950;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.theme-manager-wrapper.is-visible {
  transform: translateX(0);
}

.theme-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
}

.theme-manager-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast {
    min-width: unset;
    max-width: 100%;
  }
  
  .pwa-install-prompt {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
  
  .pwa-prompt-content {
    padding: 16px;
  }
  
  .pwa-prompt-actions {
    flex-direction: column;
  }
  
  .theme-manager-wrapper {
    width: 100%;
  }
  
  .theme-toggle-btn {
    bottom: 80px;
    right: 20px;
    width: 45px;
    height: 45px;
    font-size: 18px;
  }
}
</style>