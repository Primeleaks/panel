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
        <div class="search-container">
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
            <i class="fa-solid fa-upload" style="margin-right: 6px;"></i>
            Upload
          </button>
          <button
              v-if="admin"
              class="admin-upload-btn"
              @click="isAdminUploadModalOpen = true"
          >
            <i class="fa-solid fa-user-shield" style="margin-right: 6px;"></i>
            Admin Upload
          </button>
        </div>
        <div class="user-profile" v-if="user" @click="navigateToProfile">
          <img :src="user.avatar" :alt="user.username" />
          <span>{{ user.username }}</span>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-profile" v-else>
          <span>Wird geladen...</span>
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
              </div>
            </div>
          </div>
        </div>
        
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

    <NotificationPanel
        v-if="user"
        :isOpen="isNotificationPanelOpen"
        :userId="user.discord_id"
        @close="isNotificationPanelOpen = false"
        @count-update="updateNotificationCount"
        @navigate="handleNotificationNavigation"
    />
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue';
import Login from '@/sites/login.vue';
import Navbar from '@/components/Navbar.vue';
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
      event.target.src = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/hopeleaksbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
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
      // Filtere zuerst die Scripts wie bisher
      const filtered = scripts.value.filter(script => {
        // Kategorie-Filter
        if (currentCategory.value !== 'all' && script.category !== currentCategory.value) {
          return false; // Script gehört nicht zur aktuellen Kategorie
        }

        // Suchbegriff-Filter
        const title = script.title?.toLowerCase() || "";
        const description = script.description?.toLowerCase() || "";
        const author = script.author?.toLowerCase() || "";
        return (
            title.includes(searchTerm.value.toLowerCase()) ||
            description.includes(searchTerm.value.toLowerCase()) ||
            author.includes(searchTerm.value.toLowerCase())
        );
      });

      // Sortiere die gefilterten Ergebnisse nach Datum (neueste zuerst)
      return [...filtered].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Absteigend sortieren (neueste zuerst)
      });
    });

    const getCurrentCategoryName = computed(() => {
      const current = categories.find(category => category.id === currentCategory.value);
      return current ? current.name : 'Kategorie unbekannt';
    });


    onMounted(() => {
      fetchUser()
      isAdmin();
      const token = localStorage.getItem('token');
      if (token) {
        user.value = {
          username: localStorage.getItem('username'),
          avatar: localStorage.getItem('avatar') || '/default-avatar.png'
        };
      }
      fetchScripts();
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
      fetchUser,
      isAdmin,
      fetchScripts,
      handleUploadSuccess,
      handleLogout,
      handleCategoryChange,
      openAdminDashboard,
      downloadScript,
      handleImageError,
      formatDate,
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
    };
  }
};
</script>

<style scoped>
@import '@/assets/app.css';

.main-content-container {
  display: flex;
  width: 100%;
  gap: 20px;
}

.content {
  flex: 1;
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
  }
}
</style>