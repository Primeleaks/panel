<template>
  <div class="app">
    <Navbar
        :currentCategory="currentCategory"
        @categoryChange="handleCategoryChange"
        :isAdmin="admin"
        @logout="handleLogout"
        @openAdminDashboard="openAdminDashboard"
        :categories="categories"
    />

    <main class="main-content">
      <header class="top-bar">
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <i class="fa-solid fa-bars"></i>
        </button>
        
        <div class="search-container">
<<<<<<< Updated upstream
          <input
              type="text"
              placeholder="Suche nach Scripts, Tags, Autoren..."
              v-model="searchTerm"
              @focus="showAdvancedSearch = true"
          />
          <button 
            class="search-filter-btn" 
            @click="showAdvancedSearch = !showAdvancedSearch"
            :class="{ active: showAdvancedSearch }"
          >
            <i class="fas fa-filter"></i>
          </button>
=======
          <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                type="text"
                placeholder="Suche nach Scripts, Tags, Autoren..."
                v-model="searchTerm"
                class="search-input"
            />
            <button v-if="searchTerm" @click="searchTerm = ''" class="clear-search">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
>>>>>>> Stashed changes
        </div>
        
        <div class="button-group">
          <button
              class="notifications-btn"
              @click="toggleNotifications"
              :class="{ 'has-notifications': unreadNotificationsCount > 0 }"
          >
            <i class="fas fa-bell"></i>
            <span v-if="unreadNotificationsCount > 0" class="notification-badge">
              {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
            </span>
          </button>
          <button
              class="upload-btn"
              @click="isUploadModalOpen = true"
          >
            <i class="fa-solid fa-upload"></i>
            <span>Upload</span>
          </button>
          <button
              v-if="admin"
              class="admin-upload-btn"
              @click="isAdminUploadModalOpen = true"
          >
            <i class="fa-solid fa-user-shield"></i>
            <span>Admin Upload</span>
          </button>
        </div>
<<<<<<< Updated upstream
        <div class="user-profile" v-if="user" @click="navigateToProfile">
          <img :src="user.avatar" :alt="user.username" />
          <span>{{ user.username }}</span>
          <i class="fas fa-chevron-down"></i>
=======
        
        <div class="user-profile" v-if="user">
          <div class="user-avatar">
            <img :src="user.avatar" :alt="user.username" />
            <div class="status-indicator"></div>
          </div>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <span class="user-role" v-if="admin">Administrator</span>
            <span class="user-role" v-else>Benutzer</span>
          </div>
>>>>>>> Stashed changes
        </div>
        <div class="user-profile loading" v-else>
          <div class="skeleton-avatar"></div>
          <div class="skeleton-text"></div>
        </div>
      </header>
      
      <SearchFilters
        v-if="showAdvancedSearch"
        :categories="categories"
        :initialFilters="{ category: currentCategory }"
        :isAuthenticated="!!user"
        @filter-change="handleFilterChange"
        @filter-applied="handleFilterApplied"
      />

<<<<<<< Updated upstream
      <div class="main-content-container">
        <div class="content">
          <h2>{{ getCurrentCategoryName }}</h2>
          <div v-if="loading" class="loading">Laden...</div>
          <div v-else class="scripts-grid">
            <div
                v-for="script in filteredScripts"
                :key="script.id"
                class="script-card"
                @click="viewScriptDetails(script.id)"
            >
              <div class="script-image-container">
                <img
                    :src="script.image"
                    :alt="script.title"
                    class="script-image"
                    @error="handleImageError"
                />
              </div>
              <div class="script-info">
                <h3>{{ script.title }}</h3>
                <p>{{ script.description }}</p>
                <div class="script-meta">
                  <span>{{ formatDate(script.date, script.author) }}</span>
                  <div class="script-rating">
                    <i v-for="star in 5" :key="star" 
                       :class="['star-icon', star <= (script.avgRating || 0) ? 'filled' : '']">
                       ★
                    </i>
                    <span>({{ script.ratingsCount || 0 }})</span>
                  </div>
                  <button
                      class="download-btn"
                      @click.stop="downloadScript(script.downloadUrl)"
                  >
                    Download
                  </button>
                  <button
                      v-if="admin"
                      class="delete-btn"
                      @click.stop="handleDelete(script.id)"
                  >
                    Löschen
                  </button>
                </div>
=======
      <div class="content">
        <div class="page-header">
          <h1 class="page-title">{{ getCurrentCategoryName }}</h1>
          <p class="page-subtitle">Entdecke die besten Scripts für deine Projekte</p>
          
          <div class="stats-bar" v-if="!loading">
            <div class="stat-item">
              <i class="fa-solid fa-file-code"></i>
              <span>{{ filteredScripts.length }} Scripts</span>
            </div>
            <div class="stat-item">
              <i class="fa-solid fa-download"></i>
              <span>{{ totalDownloads }} Downloads</span>
            </div>
            <div class="stat-item">
              <i class="fa-solid fa-users"></i>
              <span>{{ uniqueAuthors }} Autoren</span>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="loading-grid">
            <div v-for="i in 6" :key="i" class="script-skeleton">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-description"></div>
                <div class="skeleton-meta"></div>
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        </div>
        
<<<<<<< Updated upstream
        <div class="sidebar">
          <ActivityFeed 
            v-if="user"
            :userId="user.discord_id"
            @navigate="handleFeedNavigation"
          />

          <div v-if="selectedScript" class="script-details-panel">
            <h3>{{ selectedScript.title }}</h3>
            <RatingAnalytics 
              :scriptId="selectedScript.id"
            />
          </div>
=======
        <div v-else-if="filteredScripts.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3>Keine Scripts gefunden</h3>
          <p>Versuche es mit anderen Suchbegriffen oder wähle eine andere Kategorie.</p>
          <button class="btn-secondary" @click="searchTerm = ''">
            <i class="fa-solid fa-refresh"></i>
            Suche zurücksetzen
          </button>
        </div>
        
        <div v-else class="scripts-grid">
          <ScriptCard
              v-for="(script, index) in filteredScripts"
              :key="`script-${script.id}`"
              :script="script"
              :index="index"
              :isAdmin="admin"
              @download="downloadScript"
              @delete="handleDelete"
              class="script-item"
          />
>>>>>>> Stashed changes
        </div>
      </div>
    </main>

    <UploadModal
        :isOpen="isUploadModalOpen"
        @close="isUploadModalOpen = false"
        :isAdmin="false"
        :categories="categories"
        :user="user"
        @uploadSuccess="handleUploadSuccess"
    />

    <UploadModal
        v-if="admin"
        :isOpen="isAdminUploadModalOpen"
        @close="isAdminUploadModalOpen = false"
        :isAdmin="true"
        :categories="categories"
        :user="user"
        @uploadSuccess="handleUploadSuccess"
    />

    <AdminDashboard
        v-if="admin"
        :isOpen="isAdminDashboardOpen"
        :user="user"
        @close="isAdminDashboardOpen = false"
    />

<<<<<<< Updated upstream
    <NotificationPanel
        v-if="user"
        :isOpen="isNotificationPanelOpen"
        :userId="user.discord_id"
        @close="isNotificationPanelOpen = false"
        @count-update="updateNotificationCount"
        @navigate="handleNotificationNavigation"
    />
=======
    <!-- Floating Action Button -->
    <button class="fab" @click="scrollToTop" title="Nach oben scrollen">
      <i class="fa-solid fa-arrow-up"></i>
    </button>
>>>>>>> Stashed changes
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue';
import Login from '@/sites/login.vue';
import Navbar from '@/components/Navbar.vue';
import ScriptCard from '@/components/ScriptCard.vue';
import UploadModal from '@/components/UploadModal.vue';
import AdminDashboard from '@/components/AdminDashboard.vue';
import SearchFilters from '@/components/SearchFilters.vue';
import RatingAnalytics from '@/components/RatingAnalytics.vue';
import ActivityFeed from '@/components/ActivityFeed.vue';
import NotificationPanel from '@/components/NotificationPanel.vue';
import axios from "axios";
import { useRouter } from 'vue-router';

export default {
  components: {
    Login,
    Navbar,
    ScriptCard,
    UploadModal,
    AdminDashboard,
    SearchFilters,
    RatingAnalytics,
    ActivityFeed,
    NotificationPanel
  },
  setup() {
    const router = useRouter();
    const searchTerm = ref('');
    const user = ref(null);
    const scripts = ref([]);
    const loading = ref(true);
    const currentCategory = ref('all');
    const isUploadModalOpen = ref(false);
    const isAdminUploadModalOpen = ref(false);
    const isAdminDashboardOpen = ref(false);
    const admin = ref(false);
    const showAdvancedSearch = ref(false);
    const selectedScript = ref(null);
    const unreadNotificationsCount = ref(0);
    const isNotificationPanelOpen = ref(false);

    const categories = [
      { id: 'all', name: 'Alle Scripts', icon: 'fa-solid fa-layer-group' },
      { id: 'user', name: 'User Leaks', icon: 'fa-solid fa-user-secret' },
      { id: 'full', name: 'Full server', icon: 'fa-solid fa-server' },
      { id: 'scripts', name: 'Scripts', icon: 'fa-solid fa-file-code' },
      { id: 'crimelife', name: 'Crimelife', icon: 'fa-solid fa-skull' },
      { id: 'hud', name: 'Hud', icon: 'fa-solid fa-desktop' },
      { id: 'loading', name: 'Loadingscreen', icon: 'fa-solid fa-spinner' },
      { id: 'anticheat', name: 'Anticheat', icon: 'fa-solid fa-shield-halved' },
      { id: 'design', name: 'Design', icon: 'fa-solid fa-paint-brush' },
      { id: 'dumps', name: 'Dumps', icon: 'fa-solid fa-database' },
      { id: 'bots', name: 'Bots', icon: 'fa-solid fa-robot' },
      { id: 'tools', name: 'Tools', icon: 'fa-solid fa-wrench' },
      { id: 'collections', name: 'Collections', icon: 'fa-solid fa-folder' },
    ];

    const fetchScripts = async () => {
      try {
        loading.value = true;
        const endpoint = currentCategory.value === 'all'
            ? '/api/scripts'
            : `/api/scripts/category/${currentCategory.value}`;

        const response = await fetch(`http://localhost:3001${endpoint}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch scripts');
        }
        const responseData = await response.json();
        scripts.value = responseData;
      } catch (error) {
        console.error('Failed to fetch scripts:', error);
      } finally {
        loading.value = false;
      }
    };

    const getCookie = (cookieName) => {
      const cookies = document.cookie.split("; ");
      const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
      return cookie ? cookie.split("=")[1] : null;

    }

    const fetchUser = async () => {
      const token = getCookie("token")
      if (!token) {
        console.error('Kein Token im Local Storage gefunden');
        return null;
      }

      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      user.value = payload;
    }

    const isAdmin = async () => {
      const response = await fetch(`http://localhost:3001/api/discord/isAdmin/${user.value.discord_id}`);
      admin.value = await response.json();
    };

    const openAdminDashboard = () => {
      isAdminDashboardOpen.value = true;
    };

    const handleUploadSuccess = async () => {
      currentCategory.value = 'all';
      await fetchScripts();
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      user.value = null;
    };

    const handleCategoryChange = (category) => {
      if (category === 'collections') {
        router.push('/collections');
      } else {
        currentCategory.value = category;
      }
    };

    const handleDelete = async (id) => {
      if (!confirm('Möchtest du dieses Script wirklich löschen?')) return;
      const token = getCookie("token");
      const response = await axios.post(
          `http://localhost:3001/api/scripts/delete/${id}`, {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
      scripts.value = scripts.value.filter(script => script.id !== id);
    }

    const downloadScript = (url) => {
      window.location.href = url;
    };

    const handleImageError = (event) => {
      event.target.src = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/testerbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
    };

    const formatDate = (dateString, author) => {
      const date = new Date(dateString);
      date.setHours(date.getHours() + 1);
      return `${author} • ${date.toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
    };
    
    const viewScriptDetails = (scriptId) => {
      const script = scripts.value.find(s => s.id === scriptId);
      if (script) {
        selectedScript.value = script;
      }
    };
    
    const toggleNotifications = () => {
      isNotificationPanelOpen.value = !isNotificationPanelOpen.value;
      if (isNotificationPanelOpen.value) {
        unreadNotificationsCount.value = 0; // Mark as read when opening
      }
    };
    
    const updateNotificationCount = (count) => {
      unreadNotificationsCount.value = count;
    };
    
    const handleNotificationNavigation = (target) => {
      if (target.type === 'script') {
        viewScriptDetails(target.id);
      } else if (target.type === 'user') {
        navigateToProfile(target.id);
      } else if (target.type === 'settings') {
        // Navigate to settings page (to be implemented)
      }
    };
    
    const handleFilterChange = (filters) => {
      // Update local filters based on advanced search component
      console.log('Filter changed:', filters);
      // This would update local state or trigger search
    };
    
    const handleFilterApplied = () => {
      // Hide the filters panel when search is applied
      showAdvancedSearch.value = false;
    };
    
    const handleFeedNavigation = (target) => {
      // Handle navigation from activity feed
      if (target.type === 'script') {
        viewScriptDetails(target.id);
      } else if (target.type === 'user') {
        navigateToProfile(target.id);
      }
    };
    
    const navigateToProfile = (userId) => {
      // Navigate to user profile (to be implemented with router)
      console.log('Navigate to profile:', userId);
    };

    const filteredScripts = computed(() => {
      return scripts.value.filter(script => {
        const searchLower = searchTerm.value.toLowerCase();
        return (
          script.title.toLowerCase().includes(searchLower) ||
          script.description.toLowerCase().includes(searchLower) ||
          script.author.toLowerCase().includes(searchLower)
        );
      });
    });

    const getCurrentCategoryName = computed(() => {
      const category = categories.find(cat => cat.id === currentCategory.value);
      return category ? category.name : 'Unbekannte Kategorie';
    });
    
    const totalDownloads = computed(() => {
      return filteredScripts.value.reduce((total, script) => total + (script.downloads || 0), 0);
    });
    
    const uniqueAuthors = computed(() => {
      const authors = new Set(filteredScripts.value.map(script => script.author));
      return authors.size;
    });

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleMobileMenu = () => {
      // This will be handled by the Navbar component
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('sidebar-open');
      }
    };

    onMounted(async () => {
      await fetchUser();
      await isAdmin();
      await fetchScripts();
      
      // Handle old localStorage fallback
      const token = localStorage.getItem('token');
      if (token && !user.value) {
        user.value = {
          username: localStorage.getItem('username'),
          avatar: localStorage.getItem('avatar') || '/default-avatar.png'
        };
      }
    });

    return {
      searchTerm,
      user,
      scripts,
      loading,
      currentCategory,
      isUploadModalOpen,
      isAdminUploadModalOpen,
      isAdminDashboardOpen,
      admin,
      categories,
      filteredScripts,
      getCurrentCategoryName,
      totalDownloads,
      uniqueAuthors,
      handleCategoryChange,
      handleLogout,
      openAdminDashboard,
      handleUploadSuccess,
      handleDelete,
      downloadScript,
      handleImageError,
      formatDate,
<<<<<<< Updated upstream
      handleDelete,
      filteredScripts,
      admin,
      categories,
      getCurrentCategoryName,
      showAdvancedSearch,
      selectedScript,
      viewScriptDetails,
      toggleNotifications,
      handleFilterChange,
      handleFilterApplied,
      handleFeedNavigation,
      navigateToProfile,
      unreadNotificationsCount,
      isNotificationPanelOpen,
      updateNotificationCount,
      handleNotificationNavigation
=======
      scrollToTop,
      toggleMobileMenu
>>>>>>> Stashed changes
    };
  }
};
</script>

<style scoped>
<<<<<<< Updated upstream
@import '@/assets/app.css';

.main-content-container {
  display: flex;
  width: 100%;
  gap: 20px;
=======
/* Modern Dashboard Styles */
.app {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  margin-left: 280px;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-menu-btn {
  display: none;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.search-container {
  flex: 1;
  max-width: 500px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  z-index: 1;
}

.search-input {
  width: 100%;
  height: 48px;
  padding: 0 3rem 0 2.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.search-input:focus {
  border-color: #0ea5e9;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: color 0.3s ease;
}

.clear-search:hover {
  color: rgba(255, 255, 255, 0.8);
}

.button-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.upload-btn, .admin-upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.upload-btn {
  background: #0ea5e9;
  color: white;
}

.upload-btn:hover {
  background: #0284c7;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
}

.admin-upload-btn {
  background: #f97316;
  color: white;
}

.admin-upload-btn:hover {
  background: #ea580c;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 200px;
}

.user-profile:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(1.02);
}

.user-avatar {
  position: relative;
}

.user-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #0ea5e9;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #22c55e;
  border: 2px solid #0f172a;
  border-radius: 50%;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.username {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.user-role {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.user-profile.loading {
  pointer-events: none;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  width: 80px;
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
>>>>>>> Stashed changes
}

.content {
  flex: 1;
<<<<<<< Updated upstream
  min-width: 0; /* Important for flex items to prevent overflow */
}

.sidebar {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.script-details-panel {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.script-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.script-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.script-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-icon {
  color: #ddd;
  font-size: 14px;
}

.star-icon.filled {
  color: #ffcc00;
}

.search-filter-btn {
  background: var(--button-secondary-bg);
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.search-filter-btn.active {
  background: var(--primary-color);
  color: white;
}

.notifications-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  color: var(--text-color);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-btn.has-notifications {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .main-content-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    min-width: 100%;
=======
  padding: 2rem;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.page-title {
  font-size: 3rem;
  font-weight: 900;
  color: white;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 600;
}

.stat-item i {
  color: #0ea5e9;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.script-skeleton {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  animation: pulse 2s ease-in-out infinite;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-title {
  height: 24px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-description {
  height: 60px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-meta {
  height: 20px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  min-height: 400px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
  max-width: 400px;
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover::before {
  left: 100%;
}

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.script-item {
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(var(--index, 0) * 0.1s);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  cursor: pointer;
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  position: relative;
  overflow: hidden;
}

.fab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
}

.fab:hover {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 35px rgba(14, 165, 233, 0.6);
}

.fab:hover::before {
  left: 100%;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .main-content {
    margin-left: 0;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .scripts-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .search-container {
    order: 1;
    max-width: none;
    width: 100%;
  }
  
  .button-group {
    order: 2;
    width: 100%;
    justify-content: space-between;
  }
  
  .user-profile {
    order: 0;
    align-self: flex-end;
    min-width: auto;
  }
  
  .content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .stats-bar {
    gap: 1rem;
  }
  
  .stat-item {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
  
  .scripts-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .upload-btn,
  .admin-upload-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    margin-bottom: 1.5rem;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .stats-bar {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .stat-item {
    width: 100%;
    justify-content: center;
  }
  
  .user-info {
    display: none;
  }
  
  .fab {
    bottom: 1rem;
    right: 1rem;
    width: 48px;
    height: 48px;
    font-size: 1.125rem;
>>>>>>> Stashed changes
  }
}
</style>