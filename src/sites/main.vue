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
          />
        </div>
        <div class="button-group">
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
        <div class="user-profile" v-if="user">
          <img :src="user.avatar" :alt="user.username" />
          <span>{{ user.username }}</span>
        </div>
        <div class="user-profile" v-else>
          <span>Wird geladen...</span>
        </div>
      </header>

      <div class="content">
        <h2>{{ getCurrentCategoryName }}</h2>
        <div v-if="loading" class="loading">Laden...</div>
        <div v-else class="scripts-grid">
          <div
              v-for="script in filteredScripts"
              :key="script.id"
              class="script-card"
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
                <button
                    class="download-btn"
                    @click="downloadScript(script.downloadUrl)"
                >
                  Download
                </button>
                <button
                    v-if="admin"
                    class="delete-btn"
                    @click="handleDelete(script.id)"
                >
                  Löschen
                </button>
              </div>
            </div>
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
  </div>
</template>

<script>
import {computed, onMounted, ref} from 'vue';
import Login from '@/sites/login.vue';
import Navbar from '@/components/Navbar.vue';
import UploadModal from '@/components/UploadModal.vue';
import AdminDashboard from '@/components/AdminDashboard.vue';
import axios from "axios";

export default {
  components: {
    Login,
    Navbar,
    UploadModal,
    AdminDashboard
  },
  setup() {
    const searchTerm = ref('');
    const user = ref(null);
    const scripts = ref([]);
    const loading = ref(true);
    const currentCategory = ref('all');
    const isUploadModalOpen = ref(false);
    const isAdminUploadModalOpen = ref(false);
    const isAdminDashboardOpen = ref(false);
    const admin = ref(false);

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
    ];

    const fetchScripts = async () => {
      try {
        loading.value = true;
        const endpoint = currentCategory.value === 'all'
            ? '/api/scripts'
            : `/api/scripts/category/${currentCategory.value}`;

        const response = await fetch(`https://hopeleaks-panel-backend.xsojeo.easypanel.host${endpoint}`, {
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
      const response = await fetch(`https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/discord/isAdmin/${user.value.discord_id}`);
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
      currentCategory.value = category;
    };

    const handleDelete = async (id) => {
      if (!confirm('Möchtest du dieses Script wirklich löschen?')) return;
      const token = getCookie("token");
      const response = await axios.post(
          `https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/scripts/delete/${id}`, {},
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
      getCurrentCategoryName
    };
  }
};
</script>

<style scoped>
@import '@/assets/app.css';
</style>