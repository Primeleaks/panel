<template>
  <transition name="notification" appear>
    <div 
      v-if="show" 
      :class="['notification-toast', `notification-${type}`]"
      @click="close"
    >
      <div class="notification-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="notification-content">
        <h4 class="notification-title">{{ title }}</h4>
        <p class="notification-message">{{ message }}</p>
      </div>
      <button class="notification-close" @click="close">
        <i class="fa-solid fa-times"></i>
      </button>
      <div class="notification-progress" :style="{ width: progressWidth }"></div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'NotificationToast',
  props: {
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 5000
    },
    persistent: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const show = ref(true)
    const progressWidth = ref('100%')
    
    const iconClass = computed(() => {
      const icons = {
        success: 'fa-solid fa-check-circle',
        error: 'fa-solid fa-exclamation-circle',
        warning: 'fa-solid fa-exclamation-triangle',
        info: 'fa-solid fa-info-circle'
      }
      return icons[props.type]
    })
    
    const close = () => {
      show.value = false
      setTimeout(() => {
        emit('close')
      }, 300)
    }
    
    onMounted(() => {
      if (!props.persistent) {
        const startTime = Date.now()
        const timer = setInterval(() => {
          const elapsed = Date.now() - startTime
          const remaining = Math.max(0, props.duration - elapsed)
          progressWidth.value = `${(remaining / props.duration) * 100}%`
          
          if (remaining <= 0) {
            clearInterval(timer)
            close()
          }
        }, 50)
      }
    })
    
    return {
      show,
      progressWidth,
      iconClass,
      close
    }
  }
}
</script>

<style scoped>
.notification-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 350px;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.notification-toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 16px 16px 0 0;
}

.notification-success::before {
  background: linear-gradient(90deg, var(--success-color), #059669);
}

.notification-error::before {
  background: linear-gradient(90deg, var(--danger-color), #dc2626);
}

.notification-warning::before {
  background: linear-gradient(90deg, var(--warning-color), #d97706);
}

.notification-info::before {
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
}

.notification-toast {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.notification-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
}

.notification-success .notification-icon {
  color: var(--success-color);
  background: rgba(16, 185, 129, 0.2);
}

.notification-error .notification-icon {
  color: var(--danger-color);
  background: rgba(239, 68, 68, 0.2);
}

.notification-warning .notification-icon {
  color: var(--warning-color);
  background: rgba(245, 158, 11, 0.2);
}

.notification-info .notification-icon {
  color: var(--primary-color);
  background: rgba(59, 130, 246, 0.2);
}

.notification-content {
  flex: 1;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.notification-message {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.notification-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 12px;
}

.notification-close:hover {
  color: var(--text-color);
  background: rgba(255, 255, 255, 0.1);
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  transition: width 0.05s linear;
  border-radius: 0 0 16px 16px;
}

.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}
</style>
