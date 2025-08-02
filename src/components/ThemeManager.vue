<template>
  <div class="theme-manager">
    <div class="theme-toggle">
      <button 
        class="theme-btn" 
        :class="{ active: currentTheme === 'light' }"
        @click="setTheme('light')"
      >
        <i class="fas fa-sun"></i>
        <span>Light</span>
      </button>
      
      <button 
        class="theme-btn" 
        :class="{ active: currentTheme === 'dark' }"
        @click="setTheme('dark')"
      >
        <i class="fas fa-moon"></i>
        <span>Dark</span>
      </button>
      
      <button 
        class="theme-btn" 
        :class="{ active: currentTheme === 'system' }"
        @click="setTheme('system')"
      >
        <i class="fas fa-laptop"></i>
        <span>System</span>
      </button>
    </div>
    
    <div class="theme-options" v-if="showAdvancedOptions">
      <h3>Theme Settings</h3>
      
      <div class="option-group">
        <label>Accent Color</label>
        <div class="color-options">
          <button 
            v-for="(color, key) in accentColors" 
            :key="key"
            class="color-option" 
            :style="{ backgroundColor: color }"
            :class="{ active: currentAccent === key }"
            @click="setAccentColor(key)"
          ></button>
          
          <button class="color-option custom" @click="showColorPicker = true">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      
      <div class="option-group">
        <label for="fontSize">Font Size</label>
        <div class="slider-container">
          <input 
            type="range" 
            id="fontSize" 
            min="12" 
            max="20" 
            v-model="fontSize" 
            @change="applyFontSize"
          />
          <div class="slider-value">{{ fontSize }}px</div>
        </div>
      </div>
      
      <div class="option-group checkboxes">
        <div class="checkbox-option">
          <input type="checkbox" id="highContrast" v-model="highContrast" @change="applyHighContrast" />
          <label for="highContrast">High Contrast Mode</label>
        </div>
        
        <div class="checkbox-option">
          <input type="checkbox" id="reducedMotion" v-model="reducedMotion" @change="applyReducedMotion" />
          <label for="reducedMotion">Reduced Motion</label>
        </div>
        
        <div class="checkbox-option">
          <input type="checkbox" id="roundedCorners" v-model="roundedCorners" @change="applyRoundedCorners" />
          <label for="roundedCorners">Rounded Corners</label>
        </div>
      </div>
    </div>
    
    <div class="theme-actions" v-if="showAdvancedOptions">
      <button class="reset-btn" @click="resetTheme">Reset to Defaults</button>
      <button class="save-btn" @click="saveTheme">Save Settings</button>
    </div>
    
    <button class="advanced-toggle" @click="showAdvancedOptions = !showAdvancedOptions">
      {{ showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options' }}
    </button>
    
    <div v-if="showColorPicker" class="color-picker-modal">
      <div class="color-picker-content">
        <h3>Choose Custom Color</h3>
        <div class="color-picker">
          <input type="color" v-model="customColor" />
          <div class="color-preview" :style="{ backgroundColor: customColor }"></div>
        </div>
        <div class="color-actions">
          <button class="cancel-btn" @click="showColorPicker = false">Cancel</button>
          <button class="apply-btn" @click="applyCustomColor">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';

export default {
  setup() {
    const currentTheme = ref('system');
    const currentAccent = ref('default');
    const showAdvancedOptions = ref(false);
    const showColorPicker = ref(false);
    const customColor = ref('#FF5722');
    const fontSize = ref(16);
    const highContrast = ref(false);
    const reducedMotion = ref(false);
    const roundedCorners = ref(true);
    
    const accentColors = {
      default: '#4361ee',
      red: '#e63946',
      green: '#2a9d8f',
      purple: '#7209b7',
      orange: '#f77f00',
      teal: '#4ecdc4',
      pink: '#ff4d6d'
    };
    
    const applyTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      currentTheme.value = theme;
    };
    
    const detectSystemTheme = () => {
      if (currentTheme.value !== 'system') return;
      
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    };
    
    const setTheme = (theme) => {
      if (theme === 'system') {
        detectSystemTheme();
      } else {
        applyTheme(theme);
      }
      currentTheme.value = theme;
    };
    
    const setAccentColor = (color) => {
      document.documentElement.style.setProperty('--primary-color', accentColors[color]);
      document.documentElement.style.setProperty('--primary-color-dark', adjustColor(accentColors[color], -20));
      document.documentElement.style.setProperty('--primary-color-light', adjustColor(accentColors[color], 20));
      
      localStorage.setItem('accent-color', color);
      currentAccent.value = color;
    };
    
    const applyCustomColor = () => {
      document.documentElement.style.setProperty('--primary-color', customColor.value);
      document.documentElement.style.setProperty('--primary-color-dark', adjustColor(customColor.value, -20));
      document.documentElement.style.setProperty('--primary-color-light', adjustColor(customColor.value, 20));
      
      localStorage.setItem('custom-accent-color', customColor.value);
      localStorage.setItem('accent-color', 'custom');
      currentAccent.value = 'custom';
      showColorPicker.value = false;
    };
    
    const applyFontSize = () => {
      document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`);
      localStorage.setItem('font-size', fontSize.value);
    };
    
    const applyHighContrast = () => {
      if (highContrast.value) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      localStorage.setItem('high-contrast', highContrast.value);
    };
    
    const applyReducedMotion = () => {
      if (reducedMotion.value) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
      localStorage.setItem('reduced-motion', reducedMotion.value);
    };
    
    const applyRoundedCorners = () => {
      if (roundedCorners.value) {
        document.documentElement.classList.add('rounded-corners');
      } else {
        document.documentElement.classList.remove('rounded-corners');
      }
      localStorage.setItem('rounded-corners', roundedCorners.value);
    };
    
    const loadThemeSettings = () => {
      // Load theme
      const savedTheme = localStorage.getItem('theme') || 'system';
      currentTheme.value = savedTheme;
      setTheme(savedTheme);
      
      // Load accent color
      const savedAccent = localStorage.getItem('accent-color') || 'default';
      currentAccent.value = savedAccent;
      
      if (savedAccent === 'custom') {
        const savedCustomColor = localStorage.getItem('custom-accent-color') || '#FF5722';
        customColor.value = savedCustomColor;
        document.documentElement.style.setProperty('--primary-color', savedCustomColor);
        document.documentElement.style.setProperty('--primary-color-dark', adjustColor(savedCustomColor, -20));
        document.documentElement.style.setProperty('--primary-color-light', adjustColor(savedCustomColor, 20));
      } else {
        setAccentColor(savedAccent);
      }
      
      // Load font size
      const savedFontSize = localStorage.getItem('font-size') || 16;
      fontSize.value = parseInt(savedFontSize);
      document.documentElement.style.setProperty('--base-font-size', `${fontSize.value}px`);
      
      // Load high contrast
      const savedHighContrast = localStorage.getItem('high-contrast') === 'true';
      highContrast.value = savedHighContrast;
      if (savedHighContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      
      // Load reduced motion
      const savedReducedMotion = localStorage.getItem('reduced-motion') === 'true';
      reducedMotion.value = savedReducedMotion;
      if (savedReducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      }
      
      // Load rounded corners
      const savedRoundedCorners = localStorage.getItem('rounded-corners') !== 'false';
      roundedCorners.value = savedRoundedCorners;
      if (!savedRoundedCorners) {
        document.documentElement.classList.remove('rounded-corners');
      } else {
        document.documentElement.classList.add('rounded-corners');
      }
    };
    
    const resetTheme = () => {
      // Reset all theme settings to defaults
      localStorage.removeItem('theme');
      localStorage.removeItem('accent-color');
      localStorage.removeItem('custom-accent-color');
      localStorage.removeItem('font-size');
      localStorage.removeItem('high-contrast');
      localStorage.removeItem('reduced-motion');
      localStorage.removeItem('rounded-corners');
      
      currentTheme.value = 'system';
      currentAccent.value = 'default';
      fontSize.value = 16;
      highContrast.value = false;
      reducedMotion.value = false;
      roundedCorners.value = true;
      
      detectSystemTheme();
      setAccentColor('default');
      applyFontSize();
      applyHighContrast();
      applyReducedMotion();
      applyRoundedCorners();
    };
    
    const saveTheme = () => {
      // All settings are already saved in local storage
      showAdvancedOptions.value = false;
    };
    
    // Helper function to adjust color brightness
    const adjustColor = (color, amount) => {
      // Remove '#' if present
      color = color.replace(/^#/, '');
      
      // Parse the color components
      let r = parseInt(color.substring(0, 2), 16);
      let g = parseInt(color.substring(2, 4), 16);
      let b = parseInt(color.substring(4, 6), 16);
      
      // Adjust each component
      r = Math.min(255, Math.max(0, r + amount));
      g = Math.min(255, Math.max(0, g + amount));
      b = Math.min(255, Math.max(0, b + amount));
      
      // Convert back to hex
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    // Watch for system theme changes
    onMounted(() => {
      loadThemeSettings();
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', detectSystemTheme);
    });
    
    return {
      currentTheme,
      currentAccent,
      showAdvancedOptions,
      showColorPicker,
      customColor,
      fontSize,
      highContrast,
      reducedMotion,
      roundedCorners,
      accentColors,
      setTheme,
      setAccentColor,
      applyCustomColor,
      applyFontSize,
      applyHighContrast,
      applyReducedMotion,
      applyRoundedCorners,
      resetTheme,
      saveTheme
    };
  }
};
</script>

<style scoped>
.theme-manager {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.theme-toggle {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 20px;
}

.theme-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--card-bg-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn i {
  font-size: 20px;
  margin-bottom: 8px;
}

.theme-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.theme-options {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
  margin-top: 20px;
}

.theme-options h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
}

.option-group {
  margin-bottom: 20px;
}

.option-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.color-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-option {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: white;
  box-shadow: 0 0 0 2px var(--primary-color);
}

.color-option.custom {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

input[type="range"] {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-color);
  outline: none;
  border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider-value {
  font-size: 14px;
  min-width: 40px;
  text-align: right;
}

.checkboxes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}

.reset-btn,
.save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.reset-btn {
  background: var(--button-secondary-bg);
  border: none;
  color: var(--text-color);
}

.save-btn {
  background: var(--primary-color);
  border: none;
  color: white;
}

.advanced-toggle {
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 14px;
  margin-top: 16px;
}

.color-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.color-picker-content {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.color-picker-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
}

.color-picker {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.color-picker input {
  width: 100%;
  height: 40px;
  border: none;
  padding: 0;
  background: none;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.color-actions {
  display: flex;
  justify-content: space-between;
}

.cancel-btn,
.apply-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: var(--button-secondary-bg);
  border: none;
  color: var(--text-color);
}

.apply-btn {
  background: var(--primary-color);
  border: none;
  color: white;
}

@media (max-width: 500px) {
  .theme-toggle {
    flex-direction: column;
  }
  
  .theme-btn {
    flex-direction: row;
    justify-content: flex-start;
  }
  
  .theme-btn i {
    margin-bottom: 0;
    margin-right: 8px;
  }
}
</style>
