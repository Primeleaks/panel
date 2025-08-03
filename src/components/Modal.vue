<template>
  <transition name="modal">
    <div v-if="visible" class="modal-backdrop" @click.self="onBackdropClick">
      <div ref="modalContent" class="modal-content" :class="[size, { 'with-blur': blur }]">
        <div class="modal-header">
          <h3 class="modal-title">
            <slot name="title">{{ title }}</slot>
          </h3>
          <button v-if="showClose" class="modal-close" @click="close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <slot></slot>
        </div>
        
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
        
        <div v-else-if="showDefaultFooter" class="modal-footer">
          <button class="btn btn-secondary" @click="close">{{ cancelText }}</button>
          <button class="btn btn-primary" @click="confirm">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    title: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    showClose: {
      type: Boolean,
      default: true
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },
    closeOnEsc: {
      type: Boolean,
      default: true
    },
    showDefaultFooter: {
      type: Boolean,
      default: false
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large', 'full'].includes(value)
    },
    blur: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'close', 'confirm'],
  data() {
    return {
      scrollPosition: 0
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.disableBodyScroll();
        this.$nextTick(() => {
          this.focusFirstInput();
          if (this.closeOnEsc) {
            document.addEventListener('keydown', this.handleEscKey);
          }
        });
      } else {
        this.enableBodyScroll();
        if (this.closeOnEsc) {
          document.removeEventListener('keydown', this.handleEscKey);
        }
      }
    }
  },
  mounted() {
    if (this.visible) {
      this.disableBodyScroll();
      if (this.closeOnEsc) {
        document.addEventListener('keydown', this.handleEscKey);
      }
    }
  },
  beforeUnmount() {
    this.enableBodyScroll();
    if (this.closeOnEsc) {
      document.removeEventListener('keydown', this.handleEscKey);
    }
  },
  methods: {
    close() {
      this.$emit('update:visible', false);
      this.$emit('close');
    },
    confirm() {
      this.$emit('confirm');
      this.close();
    },
    onBackdropClick() {
      if (this.closeOnBackdrop) {
        this.close();
      }
    },
    handleEscKey(e) {
      if (e.key === 'Escape') {
        this.close();
      }
    },
    disableBodyScroll() {
      this.scrollPosition = window.pageYOffset;
      document.body.classList.add('modal-open');
      document.body.style.top = `-${this.scrollPosition}px`;
    },
    enableBodyScroll() {
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, this.scrollPosition);
    },
    focusFirstInput() {
      const input = this.$refs.modalContent.querySelector('input, textarea, select, button:not(.modal-close)');
      if (input) {
        input.focus();
      }
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background-color: var(--surface-color, #ffffff);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.with-blur {
  backdrop-filter: blur(10px);
  background-color: rgba(var(--surface-color-rgb, 255, 255, 255), 0.9);
}

.modal-content.small {
  width: 400px;
}

.modal-content.medium {
  width: 600px;
}

.modal-content.large {
  width: 800px;
}

.modal-content.full {
  width: calc(100vw - 40px);
  height: calc(100vh - 40px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  position: relative;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--heading-color, #2d3748);
}

.modal-close {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-muted, #718096);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-primary, #1a202c);
}

.modal-close svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1 1 auto;
}

.modal-footer {
  padding: 16px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: var(--brand-color, #4a6cf7);
  color: white;
}

.btn-primary:hover {
  background-color: var(--brand-color, #4a6cf7);
  filter: brightness(1.1);
}

.btn-secondary {
  background-color: transparent;
  border: 1px solid var(--border-color, #e2e8f0);
  color: var(--text-secondary, #4a5568);
}

.btn-secondary:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

/* Modal transitions */
.modal-enter-active {
  animation: modal-fade-in 0.3s ease-out;
}

.modal-leave-active {
  animation: modal-fade-out 0.2s ease-in;
}

.modal-enter-active .modal-content {
  animation: modal-zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active .modal-content {
  animation: modal-zoom-out 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes modal-zoom-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes modal-zoom-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Add this to the document body when modal is open */
:global(.modal-open) {
  overflow: hidden;
  position: fixed;
  width: 100%;
}

@media (max-width: 768px) {
  .modal-content.small,
  .modal-content.medium,
  .modal-content.large {
    width: calc(100vw - 40px);
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .modal-footer {
    padding: 12px 16px;
  }
}
</style>
