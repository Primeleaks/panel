class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: {
                name: 'Light',
                variables: {
                    '--primary-color': '#4A90E2',
                    '--primary-hover': '#357ABD',
                    '--secondary-color': '#7ED321',
                    '--accent-color': '#F5A623',
                    '--error-color': '#D0021B',
                    '--error-hover': '#B8001A',
                    '--warning-color': '#F5A623',
                    '--success-color': '#7ED321',
                    '--info-color': '#50E3C2',
                    
                    '--bg-color': '#FFFFFF',
                    '--card-bg': '#FFFFFF',
                    '--hover-bg': '#F8F9FA',
                    '--border-color': '#E1E5E9',
                    '--input-bg': '#FFFFFF',
                    
                    '--text-color': '#2C3E50',
                    '--text-secondary': '#7F8C8D',
                    '--text-tertiary': '#BDC3C7',
                    '--text-dark': '#2C3E50',
                    '--text-light': '#FFFFFF',
                    
                    '--navbar-bg': '#FFFFFF',
                    '--navbar-border': '#E1E5E9',
                    '--sidebar-bg': '#F8F9FA',
                    
                    '--shadow-light': '0 2px 4px rgba(0, 0, 0, 0.1)',
                    '--shadow-medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
                    '--shadow-heavy': '0 8px 25px rgba(0, 0, 0, 0.15)',
                    
                    '--gradient-primary': 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    '--gradient-secondary': 'linear-gradient(135deg, #7ED321 0%, #5BA517 100%)',
                    '--gradient-accent': 'linear-gradient(135deg, #F5A623 0%, #E6941A 100%)'
                }
            },
            dark: {
                name: 'Dark',
                variables: {
                    '--primary-color': '#5DADE2',
                    '--primary-hover': '#85C1E9',
                    '--secondary-color': '#58D68D',
                    '--accent-color': '#F7DC6F',
                    '--error-color': '#EC7063',
                    '--error-hover': '#F1948A',
                    '--warning-color': '#F7DC6F',
                    '--success-color': '#58D68D',
                    '--info-color': '#76D7C4',
                    
                    '--bg-color': '#1A1A1A',
                    '--card-bg': '#2D2D2D',
                    '--hover-bg': '#3A3A3A',
                    '--border-color': '#404040',
                    '--input-bg': '#2D2D2D',
                    
                    '--text-color': '#E8E8E8',
                    '--text-secondary': '#B0B0B0',
                    '--text-tertiary': '#808080',
                    '--text-dark': '#2C3E50',
                    '--text-light': '#FFFFFF',
                    
                    '--navbar-bg': '#2D2D2D',
                    '--navbar-border': '#404040',
                    '--sidebar-bg': '#252525',
                    
                    '--shadow-light': '0 2px 4px rgba(0, 0, 0, 0.3)',
                    '--shadow-medium': '0 4px 6px rgba(0, 0, 0, 0.3)',
                    '--shadow-heavy': '0 8px 25px rgba(0, 0, 0, 0.4)',
                    
                    '--gradient-primary': 'linear-gradient(135deg, #5DADE2 0%, #85C1E9 100%)',
                    '--gradient-secondary': 'linear-gradient(135deg, #58D68D 0%, #7DCEA0 100%)',
                    '--gradient-accent': 'linear-gradient(135deg, #F7DC6F 0%, #F9E79F 100%)'
                }
            },
            auto: {
                name: 'Auto (System)',
                variables: {} // Will be populated based on system preference
            }
        };
        
        this.init();
    }

    init() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'auto';
        this.setTheme(savedTheme);
        
        // Listen for system theme changes when in auto mode
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', () => {
                if (this.currentTheme === 'auto') {
                    this.applyAutoTheme();
                }
            });
        }
        
        // Create theme toggle button
        this.createThemeToggle();
        
        console.log('ThemeManager initialized with theme:', this.currentTheme);
    }

    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.warn(`Theme "${themeName}" not found, falling back to light theme`);
            themeName = 'light';
        }

        this.currentTheme = themeName;
        localStorage.setItem('theme', themeName);
        
        if (themeName === 'auto') {
            this.applyAutoTheme();
        } else {
            this.applyTheme(themeName);
        }
        
        // Update theme toggle button
        this.updateThemeToggle();
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('theme-changed', {
            detail: { theme: themeName, actualTheme: this.getActualTheme() }
        }));
    }

    applyAutoTheme() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const autoTheme = prefersDark ? 'dark' : 'light';
        this.applyTheme(autoTheme);
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        const root = document.documentElement;
        
        // Apply CSS variables
        Object.entries(theme.variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
        
        // Update body class
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(themeName);
        
        console.log(`Applied ${themeName} theme`);
    }

    updateMetaThemeColor(themeName) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const themeColor = themeName === 'dark' ? '#2D2D2D' : '#FFFFFF';
        metaThemeColor.content = themeColor;
    }

    createThemeToggle() {
        // Check if toggle already exists
        if (document.querySelector('.theme-toggle')) return;
        
        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <button class="theme-toggle-btn" title="Change theme">
                <i class="fas fa-palette"></i>
            </button>
            <div class="theme-dropdown">
                <div class="theme-option" data-theme="light">
                    <i class="fas fa-sun"></i>
                    <span>Light</span>
                </div>
                <div class="theme-option" data-theme="dark">
                    <i class="fas fa-moon"></i>
                    <span>Dark</span>
                </div>
                <div class="theme-option" data-theme="auto">
                    <i class="fas fa-adjust"></i>
                    <span>Auto</span>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .theme-toggle {
                position: relative;
                display: inline-block;
            }
            
            .theme-toggle-btn {
                background: none;
                border: none;
                color: var(--text-color);
                cursor: pointer;
                padding: 8px;
                border-radius: 6px;
                transition: all 0.3s ease;
                font-size: 1.1rem;
            }
            
            .theme-toggle-btn:hover {
                background: var(--hover-bg);
                color: var(--primary-color);
            }
            
            .theme-dropdown {
                position: absolute;
                top: 100%;
                right: 0;
                background: var(--card-bg);
                border: 1px solid var(--border-color);
                border-radius: 8px;
                box-shadow: var(--shadow-medium);
                min-width: 120px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .theme-toggle.active .theme-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .theme-option {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 15px;
                cursor: pointer;
                color: var(--text-color);
                transition: background-color 0.3s ease;
            }
            
            .theme-option:hover {
                background: var(--hover-bg);
            }
            
            .theme-option.active {
                background: var(--primary-color);
                color: white;
            }
            
            .theme-option i {
                width: 16px;
                text-align: center;
            }
            
            .theme-option:first-child {
                border-radius: 8px 8px 0 0;
            }
            
            .theme-option:last-child {
                border-radius: 0 0 8px 8px;
            }
        `;
        document.head.appendChild(style);
        
        // Add event listeners
        const toggleBtn = toggle.querySelector('.theme-toggle-btn');
        const dropdown = toggle.querySelector('.theme-dropdown');
        const options = toggle.querySelectorAll('.theme-option');
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('active');
        });
        
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
                toggle.classList.remove('active');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            toggle.classList.remove('active');
        });
        
        // Find navbar or create a theme container
        const navbar = document.querySelector('.navbar') || document.querySelector('nav');
        if (navbar) {
            navbar.appendChild(toggle);
        } else {
            // Create a floating theme toggle
            toggle.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            `;
            document.body.appendChild(toggle);
        }
        
        this.themeToggle = toggle;
    }

    updateThemeToggle() {
        if (!this.themeToggle) return;
        
        const options = this.themeToggle.querySelectorAll('.theme-option');
        options.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }

    getActualTheme() {
        if (this.currentTheme === 'auto') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return this.currentTheme;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            key,
            name: this.themes[key].name
        }));
    }

    // Add custom theme
    addTheme(name, variables) {
        this.themes[name] = {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            variables
        };
        
        // Update theme toggle if it exists
        if (this.themeToggle) {
            this.recreateThemeToggle();
        }
    }

    recreateThemeToggle() {
        if (this.themeToggle) {
            this.themeToggle.remove();
            this.themeToggle = null;
        }
        this.createThemeToggle();
    }

    // Export current theme as CSS
    exportThemeCSS(themeName = null) {
        const theme = this.themes[themeName || this.currentTheme];
        if (!theme) return '';
        
        let css = `:root {\n`;
        Object.entries(theme.variables).forEach(([property, value]) => {
            css += `  ${property}: ${value};\n`;
        });
        css += `}\n`;
        
        return css;
    }

    // Apply theme-specific styles to components
    applyComponentTheme(component, customStyles = {}) {
        const actualTheme = this.getActualTheme();
        const styles = customStyles[actualTheme] || {};
        
        Object.entries(styles).forEach(([property, value]) => {
            component.style.setProperty(property, value);
        });
    }

    // Get theme-aware color
    getThemeColor(colorName) {
        const root = document.documentElement;
        return getComputedStyle(root).getPropertyValue(`--${colorName}`).trim();
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
});

// Create and export instance
export const themeManager = new ThemeManager();
export default themeManager;
