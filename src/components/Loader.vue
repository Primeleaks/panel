<template>
  <div class="loader" :class="[`loader-${type}`, `size-${size}`, { 'with-overlay': overlay }]">
    <div v-if="type === 'spinner'" class="spinner">
      <div v-for="i in 12" :key="i" class="spinner-line" :style="{ transform: `rotate(${(i-1)*30}deg)`, animationDelay: `${(i-1)*0.1}s` }"></div>
    </div>
    
    <div v-else-if="type === 'dots'" class="dots">
      <div v-for="i in 3" :key="i" class="dot"></div>
    </div>
    
    <div v-else-if="type === 'pulse'" class="pulse">
      <div class="pulse-circle"></div>
      <div class="pulse-circle"></div>
      <div class="pulse-circle"></div>
    </div>
    
    <div v-else-if="type === 'bar'" class="bar">
      <div class="bar-progress"></div>
    </div>

    <div v-if="showText" class="loader-text" :class="{ 'with-shadow': textShadow }">
      {{ text || 'Loading...' }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Loader',
  props: {
    type: {
      type: String,
      default: 'spinner',
      validator: value => ['spinner', 'dots', 'pulse', 'bar'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: value => ['small', 'medium', 'large'].includes(value)
    },
    overlay: {
      type: Boolean,
      default: false
    },
    showText: {
      type: Boolean,
      default: false
    },
    text: {
      type: String,
      default: ''
    },
    textShadow: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.loader {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.with-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(var(--surface-color-rgb, 255, 255, 255), 0.7);
  backdrop-filter: blur(3px);
  z-index: 100;
}

/* Size variants */
.size-small {
  --loader-size: 20px;
  --dot-size: 6px;
}

.size-medium {
  --loader-size: 40px;
  --dot-size: 10px;
}

.size-large {
  --loader-size: 60px;
  --dot-size: 12px;
}

/* Spinner loader */
.spinner {
  width: var(--loader-size);
  height: var(--loader-size);
  position: relative;
}

.spinner-line {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
}

.spinner-line::after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: calc(50% - 1px);
  width: 2px;
  height: 25%;
  border-radius: 50%;
  background-color: var(--brand-color, #4a6cf7);
  opacity: 0;
  animation: spinner-line 1.2s linear infinite;
}

@keyframes spinner-line {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

/* Dots loader */
.dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dot {
  width: var(--dot-size);
  height: var(--dot-size);
  border-radius: 50%;
  background-color: var(--brand-color, #4a6cf7);
  opacity: 0.6;
  animation: dots-pulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) {
  animation-delay: 0s;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dots-pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Pulse loader */
.pulse {
  position: relative;
  width: var(--loader-size);
  height: var(--loader-size);
}

.pulse-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: var(--brand-color, #4a6cf7);
  opacity: 0.6;
  animation: pulse-wave 2s ease-out infinite;
}

.pulse-circle:nth-child(2) {
  animation-delay: 0.5s;
}

.pulse-circle:nth-child(3) {
  animation-delay: 1s;
}

@keyframes pulse-wave {
  0% {
    transform: scale(0.1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Bar loader */
.bar {
  width: 100%;
  max-width: 200px;
  height: 4px;
  background-color: rgba(var(--brand-color-rgb, 74, 108, 247), 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.bar-progress {
  height: 100%;
  width: 30%;
  background-color: var(--brand-color, #4a6cf7);
  border-radius: 2px;
  animation: bar-loading 1.5s infinite ease-in-out;
}

@keyframes bar-loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(300%);
  }
}

/* Loader text */
.loader-text {
  margin-top: 12px;
  font-size: 0.9rem;
  color: var(--text-secondary, #4a5568);
  font-weight: 500;
}

.with-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
