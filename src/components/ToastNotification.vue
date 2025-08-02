<template>
  <transition name="toast">
    <div v-if="visible" class="toast" :class="[`toast-${type}`, position]">
      <div class="toast-icon">
        <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        <svg v-else-if="type === 'warning'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      <div class="toast-content">
        <div v-if="title" class="toast-title">{{ title }}</div>
        <div class="toast-message">{{ message }}</div>
      </div>
      <button v-if="dismissible" class="toast-close" @click="close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div v-if="progressBar" class="toast-progress">
        <div class="toast-progress-bar" :style="progressStyle"></div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ToastNotification',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: value => ['info', 'success', 'warning', 'error'].includes(value)
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 5000
    },
    dismissible: {
      type: Boolean,
      default: true
    },
    position: {
      type: String,
      default: 'top-right',
      validator: value => [
        'top-right', 'top-left', 'top-center', 
        'bottom-right', 'bottom-left', 'bottom-center'
      ].includes(value)
    },
    progressBar: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      visible: true,
      timer: null,
      progress: 100
    };
  },
  computed: {
    progressStyle() {
      return {
        width: `${this.progress}%`
      };
    }
  },
  watch: {
    visible(value) {
      if (!value) {
        this.$emit('close');
      }
    }
  },
  mounted() {
    if (this.duration > 0) {
      const startTime = Date.now();
      const endTime = startTime + this.duration;
      
      this.timer = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        this.progress = (remaining / this.duration) * 100;
        
        if (remaining <= 0) {
          this.close();
        }
      }, 16);
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    close() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.visible = false;
    }
  }
}
</script>

<style scoped>
.toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background-color: var(--surface-color, #ffffff);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 300px;
  max-width: 450px;
  pointer-events: auto;
  overflow: hidden;
  transform-origin: top center;
}

.toast-content {
  flex: 1;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.toast-icon svg {
  width: 24px;
  height: 24px;
}

.toast-success {
  border-left: 4px solid var(--success-color, #36b37e);
}

.toast-success .toast-icon {
  color: var(--success-color, #36b37e);
}

.toast-error {
  border-left: 4px solid var(--error-color, #ff5630);
}

.toast-error .toast-icon {
  color: var(--error-color, #ff5630);
}

.toast-warning {
  border-left: 4px solid var(--warning-color, #ffab00);
}

.toast-warning .toast-icon {
  color: var(--warning-color, #ffab00);
}

.toast-info {
  border-left: 4px solid var(--brand-color, #4a6cf7);
}

.toast-info .toast-icon {
  color: var(--brand-color, #4a6cf7);
}

.toast-title {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
  color: var(--heading-color, #2d3748);
}

.toast-message {
  color: var(--text-secondary, #4a5568);
  font-size: 0.9rem;
  line-height: 1.5;
}

.toast-close {
  background: none;
  border: none;
  color: var(--text-muted, #718096);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary, #1a202c);
}

.toast-close svg {
  width: 16px;
  height: 16px;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
}

.toast-progress-bar {
  height: 100%;
  background-color: currentColor;
  transition: width 0.1s linear;
}

/* Toast position variants */
.top-right {
  top: 20px;
  right: 20px;
}

.top-left {
  top: 20px;
  left: 20px;
}

.top-center {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
}

.bottom-right {
  bottom: 20px;
  right: 20px;
}

.bottom-left {
  bottom: 20px;
  left: 20px;
}

.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}

/* Toast animation */
.toast-enter-active {
  animation: toast-in 0.3s ease-out forwards;
}

.toast-leave-active {
  animation: toast-out 0.3s ease-in forwards;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>
