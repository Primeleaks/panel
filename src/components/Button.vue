<template>
  <button
    :type="type"
    :class="[
      'btn', 
      `btn-${variant}`,
      `size-${size}`,
      { 
        'btn-block': block,
        'btn-icon': icon && !$slots.default,
        'btn-rounded': rounded,
        'btn-ripple': ripple,
        'btn-outlined': outlined,
        'hover-lift': hoverEffect === 'lift',
        'hover-grow': hoverEffect === 'grow',
        'hover-glow': hoverEffect === 'glow',
        'animate-pulse': loading && loadingAnimation === 'pulse',
        'disabled': disabled || loading
      }
    ]"
    :disabled="disabled || loading"
    @click="onClick"
  >
    <span v-if="loading" class="btn-loading">
      <span v-for="i in 3" :key="i" class="btn-loading-dot"></span>
    </span>
    
    <span v-if="icon && iconPosition === 'left'" class="btn-icon-left">
      <i :class="icon"></i>
    </span>
    
    <span v-if="$slots.default" class="btn-text">
      <slot></slot>
    </span>
    
    <span v-else-if="icon && !$slots.default" class="btn-icon-only">
      <i :class="icon"></i>
    </span>
    
    <span v-if="icon && iconPosition === 'right'" class="btn-icon-right">
      <i :class="icon"></i>
    </span>
    
    <span v-if="badge" :class="['btn-badge', `badge-${badgeVariant}`]">{{ badge }}</span>
  </button>
</template>

<script>
export default {
  name: 'Button',
  props: {
    variant: {
      type: String,
      default: 'primary',
      validator: value => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark', 'link', 'text'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    type: {
      type: String,
      default: 'button',
      validator: value => ['button', 'submit', 'reset'].includes(value)
    },
    icon: {
      type: String,
      default: ''
    },
    iconPosition: {
      type: String,
      default: 'left',
      validator: value => ['left', 'right'].includes(value)
    },
    block: {
      type: Boolean,
      default: false
    },
    rounded: {
      type: Boolean,
      default: false
    },
    outlined: {
      type: Boolean,
      default: false
    },
    ripple: {
      type: Boolean,
      default: true
    },
    hoverEffect: {
      type: String,
      default: '',
      validator: value => ['', 'lift', 'grow', 'glow'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingAnimation: {
      type: String,
      default: 'dots',
      validator: value => ['dots', 'pulse'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    badge: {
      type: [String, Number],
      default: ''
    },
    badgeVariant: {
      type: String,
      default: 'danger',
      validator: value => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
    }
  },
  emits: ['click'],
  methods: {
    onClick(event) {
      if (!this.disabled && !this.loading) {
        this.$emit('click', event);
        
        if (this.ripple) {
          this.createRipple(event);
        }
      }
    },
    createRipple(event) {
      const button = event.currentTarget;
      const ripple = document.createElement('span');
      
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
      ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
      ripple.classList.add('ripple');
      
      const existingRipple = button.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }
      
      button.appendChild(ripple);
      
      // Remove the ripple after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    }
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
  gap: 8px;
  cursor: pointer;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--brand-color-rgb, 74, 108, 247), 0.25);
}

/* Size variants */
.size-small {
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 4px;
}

.size-medium {
  padding: 8px 16px;
  font-size: 0.95rem;
  border-radius: 6px;
}

.size-large {
  padding: 10px 20px;
  font-size: 1.1rem;
  border-radius: 8px;
}

/* Shape variants */
.btn-rounded {
  border-radius: 9999px;
}

.btn-block {
  display: flex;
  width: 100%;
}

/* Icon button */
.btn-icon {
  padding: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.size-small.btn-icon {
  width: 32px;
  height: 32px;
}

.size-large.btn-icon {
  width: 48px;
  height: 48px;
}

.btn-icon-left {
  margin-right: 2px;
}

.btn-icon-right {
  margin-left: 2px;
}

.btn-icon-only {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* Button variants */
.btn-primary {
  background-color: var(--brand-color, #4a6cf7);
  color: #ffffff;
  border-color: var(--brand-color, #4a6cf7);
}

.btn-primary:hover:not(.disabled) {
  filter: brightness(1.1);
}

.btn-secondary {
  background-color: var(--surface-secondary, #edf2f7);
  color: var(--text-primary, #1a202c);
  border-color: var(--surface-secondary, #edf2f7);
}

.btn-secondary:hover:not(.disabled) {
  background-color: var(--surface-secondary, #edf2f7);
  filter: brightness(0.95);
}

.btn-success {
  background-color: var(--success-color, #36b37e);
  color: #ffffff;
  border-color: var(--success-color, #36b37e);
}

.btn-success:hover:not(.disabled) {
  filter: brightness(1.1);
}

.btn-danger {
  background-color: var(--error-color, #ff5630);
  color: #ffffff;
  border-color: var(--error-color, #ff5630);
}

.btn-danger:hover:not(.disabled) {
  filter: brightness(1.1);
}

.btn-warning {
  background-color: var(--warning-color, #ffab00);
  color: #ffffff;
  border-color: var(--warning-color, #ffab00);
}

.btn-warning:hover:not(.disabled) {
  filter: brightness(1.1);
}

.btn-info {
  background-color: var(--accent-color, #00b8d9);
  color: #ffffff;
  border-color: var(--accent-color, #00b8d9);
}

.btn-info:hover:not(.disabled) {
  filter: brightness(1.1);
}

.btn-light {
  background-color: var(--surface-alt-color, #f7fafc);
  color: var(--text-primary, #1a202c);
  border-color: var(--border-color, #e2e8f0);
}

.btn-light:hover:not(.disabled) {
  background-color: var(--surface-alt-color, #f7fafc);
  filter: brightness(0.98);
}

.btn-dark {
  background-color: var(--text-primary, #1a202c);
  color: #ffffff;
  border-color: var(--text-primary, #1a202c);
}

.btn-dark:hover:not(.disabled) {
  filter: brightness(1.2);
}

.btn-link {
  background-color: transparent;
  color: var(--brand-color, #4a6cf7);
  border-color: transparent;
  text-decoration: none;
  padding-left: 0;
  padding-right: 0;
}

.btn-link:hover:not(.disabled) {
  text-decoration: underline;
}

.btn-text {
  background-color: transparent;
  color: var(--text-primary, #1a202c);
  border-color: transparent;
}

.btn-text:hover:not(.disabled) {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Outlined variants */
.btn-outlined {
  background-color: transparent;
}

.btn-outlined.btn-primary {
  color: var(--brand-color, #4a6cf7);
}

.btn-outlined.btn-secondary {
  color: var(--text-secondary, #4a5568);
}

.btn-outlined.btn-success {
  color: var(--success-color, #36b37e);
}

.btn-outlined.btn-danger {
  color: var(--error-color, #ff5630);
}

.btn-outlined.btn-warning {
  color: var(--warning-color, #ffab00);
}

.btn-outlined.btn-info {
  color: var(--accent-color, #00b8d9);
}

.btn-outlined.btn-dark {
  color: var(--text-primary, #1a202c);
}

/* Disabled state */
.btn.disabled {
  opacity: 0.65;
  pointer-events: none;
}

/* Loading state */
.btn-loading {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-loading-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: btn-loading 1.4s infinite ease-in-out both;
}

.btn-loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.btn-loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes btn-loading {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Badge */
.btn-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background-color: var(--error-color, #ff5630);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-primary {
  background-color: var(--brand-color, #4a6cf7);
}

.badge-secondary {
  background-color: var(--text-secondary, #4a5568);
}

.badge-success {
  background-color: var(--success-color, #36b37e);
}

.badge-danger {
  background-color: var(--error-color, #ff5630);
}

.badge-warning {
  background-color: var(--warning-color, #ffab00);
}

.badge-info {
  background-color: var(--accent-color, #00b8d9);
}

/* Ripple effect */
.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
