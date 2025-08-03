<template>
  <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">
          <i class="fa-solid fa-code"></i>
        </div>
        <h1 class="logo-text">TESTER</h1>
      </div>
      <button class="sidebar-toggle" @click="toggleSidebar">
        <i class="fa-solid fa-bars"></i>
      </button>
    </div>
    
    <nav class="nav-menu">
      <div class="nav-section">
        <h3 class="nav-section-title">Kategorien</h3>
        <a
            v-for="cat in categories"
            :key="cat.id"
            href="#"
            :class="['nav-link', { active: currentCategory === cat.id }]"
            @click.prevent="onCategoryChange(cat.id)"
        >
          <div class="nav-icon">
            <i :class="cat.icon"></i>
          </div>
          <span class="nav-text">{{ cat.name }}</span>
          <div class="nav-indicator"></div>
        </a>
      </div>
    </nav>
    
    <div class="sidebar-footer">
      <div class="footer-actions">
        <button v-if="isAdmin" class="admin-btn" @click="onOpenAdminDashboard">
          <div class="btn-icon">
            <i class="fa-solid fa-gauge"></i>
          </div>
          <span class="btn-text">Admin Dashboard</span>
        </button>
        <button class="logout-btn" @click="logout">
          <div class="btn-icon">
            <i class="fa-solid fa-right-from-bracket"></i>
          </div>
          <span class="btn-text">Logout</span>
        </button>
      </div>
      
      <div class="sidebar-info">
        <div class="info-item">
          <i class="fa-solid fa-shield-check"></i>
          <span>Sicher & Privat</span>
        </div>
        <div class="version-info">
          <span>Version 2.0.0</span>
        </div>
      </div>
    </div>
    
    <div class="sidebar-overlay" @click="closeSidebar"></div>
  </aside>
</template>

<script>
import Cookies from "js-cookie";

export default {
  props: {
    currentCategory: {
      type: String,
      required: true
    },
    onCategoryChange: {
      type: Function,
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true
    },
    onOpenAdminDashboard: {
      type: Function,
      required: true
    },
    categories: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      sidebarOpen: false
    };
  },
  methods: {
    logout() {
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      this.$router.push("/");
    },
    
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    
    closeSidebar() {
      this.sidebarOpen = false;
    }
  },
  
  mounted() {
    // Close sidebar on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.sidebarOpen) {
        this.closeSidebar();
      }
    });
    
    // Close sidebar when clicking on main content (mobile)
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1200 && this.sidebarOpen && !e.target.closest('.sidebar')) {
        this.closeSidebar();
      }
    });
  }
};
</script>

<style scoped>
/* Modern Sidebar Styles */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 280px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-open {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
  margin: 0;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.sidebar-toggle {
  display: none;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
}

.nav-menu {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  padding: 0 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  margin-bottom: 0.375rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  transform: scaleY(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  transform: translateX(4px);
}

.nav-link:hover::before {
  transform: scaleY(1);
}

.nav-link.active {
  background: rgba(14, 165, 233, 0.15);
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.nav-link.active::before {
  transform: scaleY(1);
}

.nav-link.active .nav-icon {
  color: #0ea5e9;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.nav-text {
  flex: 1;
}

.nav-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0ea5e9;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-link.active .nav-indicator {
  opacity: 1;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.admin-btn, .logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.admin-btn {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1));
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.admin-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-btn:hover {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(234, 88, 12, 0.2));
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
  color: #fb923c;
}

.admin-btn:hover::before {
  left: 100%;
}

.logout-btn {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1));
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.logout-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.logout-btn:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.2));
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.logout-btn:hover::before {
  left: 100%;
}

.btn-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  flex: 1;
}

.sidebar-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  font-weight: 500;
}

.info-item i {
  color: #22c55e;
}

.version-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.6875rem;
  font-weight: 500;
}

.sidebar-overlay {
  display: none;
}

/* Desktop - Sidebar always visible */
@media (min-width: 1201px) {
  .sidebar {
    position: fixed;
    transform: translateX(0);
  }
}

/* Tablet and Mobile - Sidebar as overlay */
@media (max-width: 1200px) {
  .sidebar-toggle {
    display: flex;
  }
  
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: -1;
  }
  
  .sidebar-open .sidebar-overlay {
    opacity: 1;
    visibility: visible;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 100vw;
    max-width: 320px;
  }
  
  .sidebar-header {
    padding: 1rem;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
    font-size: 1.125rem;
  }
  
  .logo-text {
    font-size: 1.25rem;
  }
  
  .nav-menu {
    padding: 0.75rem;
  }
  
  .nav-link {
    padding: 1rem;
    font-size: 1rem;
  }
  
  .sidebar-footer {
    padding: 1rem;
  }
  
  .admin-btn, .logout-btn {
    padding: 1rem;
    font-size: 0.9375rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100vw;
  }
  
  .nav-section-title {
    font-size: 0.6875rem;
  }
  
  .nav-link {
    padding: 0.875rem;
    font-size: 0.9375rem;
  }
  
  .admin-btn, .logout-btn {
    padding: 0.875rem;
    font-size: 0.875rem;
  }
}

/* Scrollbar Styling */
.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>