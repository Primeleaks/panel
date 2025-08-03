<template>
  <div class="user-profile">
    <div class="profile-header">
      <div class="profile-avatar">
        <img :src="profile.avatar || '/default-avatar.png'" :alt="profile.username" />
      </div>
      <div class="profile-info">
        <h1>{{ profile.username }}</h1>
        <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-number">{{ profile.scripts_count || 0 }}</span>
            <span class="stat-label">Scripts</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ profile.followers_count || 0 }}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat">
            <span class="stat-number">{{ profile.following_count || 0 }}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat" v-if="profile.average_rating">
            <span class="stat-number">{{ parseFloat(profile.average_rating).toFixed(1) }}</span>
            <span class="stat-label">Rating</span>
          </div>
        </div>
        <div class="profile-actions" v-if="!isOwnProfile">
          <button 
            @click="toggleFollow" 
            :class="['follow-btn', { following: isFollowing }]"
            :disabled="followLoading"
          >
            {{ followLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow') }}
          </button>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- Scripts Tab -->
        <div v-if="activeTab === 'scripts'" class="scripts-grid">
          <ScriptCard 
            v-for="script in userScripts" 
            :key="script.id" 
            :script="script"
            @delete="handleScriptDelete"
          />
          <div v-if="userScripts.length === 0" class="empty-state">
            <p>No scripts found.</p>
          </div>
        </div>

        <!-- Activity Tab -->
        <div v-if="activeTab === 'activity'" class="activity-list">
          <div v-for="activity in activities" :key="activity.id" class="activity-item">
            <div class="activity-icon">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
            <div class="activity-content">
              <p>{{ formatActivity(activity) }}</p>
              <span class="activity-time">{{ formatDate(activity.created_at) }}</span>
            </div>
          </div>
          <div v-if="activities.length === 0" class="empty-state">
            <p>No recent activity.</p>
          </div>
        </div>

        <!-- Collections Tab -->
        <div v-if="activeTab === 'collections'" class="collections-grid">
          <div v-for="collection in collections" :key="collection.id" class="collection-card">
            <h3>{{ collection.name }}</h3>
            <p v-if="collection.description">{{ collection.description }}</p>
            <div class="collection-meta">
              <span>{{ collection.script_count }} scripts</span>
              <span v-if="!collection.is_public" class="private-badge">Private</span>
            </div>
          </div>
          <div v-if="collections.length === 0" class="empty-state">
            <p>No collections found.</p>
          </div>
        </div>

        <!-- Stats Tab -->
        <div v-if="activeTab === 'stats'" class="stats-overview">
          <div class="stats-grid">
            <div class="stats-card">
              <h3>Total Downloads</h3>
              <p class="stats-number">{{ stats.total_downloads || 0 }}</p>
            </div>
            <div class="stats-card">
              <h3>Total Views</h3>
              <p class="stats-number">{{ stats.total_views || 0 }}</p>
            </div>
            <div class="stats-card">
              <h3>Average Rating</h3>
              <p class="stats-number">{{ parseFloat(stats.average_rating || 0).toFixed(1) }}</p>
            </div>
            <div class="stats-card">
              <h3>Reviews Given</h3>
              <p class="stats-number">{{ stats.total_reviews_given || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ScriptCard from './ScriptCard.vue';

export default {
  name: 'UserProfile',
  components: {
    ScriptCard
  },
  setup() {
    const route = useRoute();
    const profile = ref({});
    const stats = ref({});
    const activities = ref([]);
    const collections = ref([]);
    const userScripts = ref([]);
    const activeTab = ref('scripts');
    const isFollowing = ref(false);
    const followLoading = ref(false);
    const loading = ref(true);

    const tabs = [
      { id: 'scripts', label: 'Scripts' },
      { id: 'activity', label: 'Activity' },
      { id: 'collections', label: 'Collections' },
      { id: 'stats', label: 'Statistics' }
    ];

    const currentUser = computed(() => {
      const token = getCookie('token');
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch {
        return null;
      }
    });

    const isOwnProfile = computed(() => {
      return currentUser.value?.discord_id === route.params.userId;
    });

    const getCookie = (name) => {
      const cookies = document.cookie.split('; ');
      const cookie = cookies.find(row => row.startsWith(`${name}=`));
      return cookie ? cookie.split('=')[1] : null;
    };

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`/api/profile/${route.params.userId}`);
        profile.value = response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await axios.get(`/api/profile/${route.params.userId}/stats`);
        stats.value = response.data;
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchActivity = async () => {
      try {
        const response = await axios.get(`/api/profile/${route.params.userId}/activity`);
        activities.value = response.data;
      } catch (error) {
        console.error('Error fetching activity:', error);
      }
    };

    const fetchCollections = async () => {
      try {
        const response = await axios.get(`/api/users/${route.params.userId}/collections`);
        collections.value = response.data;
      } catch (error) {
        console.error('Error fetching collections:', error);
      }
    };

    const fetchUserScripts = async () => {
      try {
        const response = await axios.get(`/api/scripts/?author=${route.params.userId}`);
        userScripts.value = response.data;
      } catch (error) {
        console.error('Error fetching user scripts:', error);
      }
    };

    const checkFollowStatus = async () => {
      if (!currentUser.value || isOwnProfile.value) return;
      
      try {
        const response = await axios.get(
          `/api/users/${route.params.userId}/following`,
          { headers: { Authorization: `Bearer ${getCookie('token')}` } }
        );
        isFollowing.value = response.data.isFollowing;
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    const toggleFollow = async () => {
      if (!currentUser.value) return;
      
      followLoading.value = true;
      try {
        if (isFollowing.value) {
          await axios.delete(
            `/api/users/${route.params.userId}/follow`,
            { headers: { Authorization: `Bearer ${getCookie('token')}` } }
          );
          isFollowing.value = false;
          profile.value.followers_count = Math.max(0, (profile.value.followers_count || 0) - 1);
        } else {
          await axios.post(
            `/api/users/${route.params.userId}/follow`,
            {},
            { headers: { Authorization: `Bearer ${getCookie('token')}` } }
          );
          isFollowing.value = true;
          profile.value.followers_count = (profile.value.followers_count || 0) + 1;
        }
      } catch (error) {
        console.error('Error toggling follow:', error);
      } finally {
        followLoading.value = false;
      }
    };

    const getActivityIcon = (type) => {
      const icons = {
        script_upload: 'fas fa-upload',
        comment: 'fas fa-comment',
        rating: 'fas fa-star'
      };
      return icons[type] || 'fas fa-circle';
    };

    const formatActivity = (activity) => {
      switch (activity.type) {
        case 'script_upload':
          return `Uploaded "${activity.title}"`;
        case 'comment':
          return `Commented: "${activity.title}"`;
        case 'rating':
          return activity.title;
        default:
          return activity.title;
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString();
    };

    const handleScriptDelete = (scriptId) => {
      userScripts.value = userScripts.value.filter(script => script.id !== scriptId);
    };

    const loadData = async () => {
      loading.value = true;
      await Promise.all([
        fetchProfile(),
        fetchStats(),
        fetchActivity(),
        fetchCollections(),
        fetchUserScripts(),
        checkFollowStatus()
      ]);
      loading.value = false;
    };

    onMounted(() => {
      loadData();
    });

    return {
      profile,
      stats,
      activities,
      collections,
      userScripts,
      activeTab,
      tabs,
      isFollowing,
      followLoading,
      loading,
      isOwnProfile,
      toggleFollow,
      getActivityIcon,
      formatActivity,
      formatDate,
      handleScriptDelete
    };
  }
};
</script>

<style scoped>
.user-profile {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  background: var(--card-bg);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.profile-avatar img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-color);
}

.profile-info h1 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 2.5rem;
}

.profile-bio {
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 1.1rem;
  line-height: 1.5;
}

.profile-stats {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.follow-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.follow-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.follow-btn.following {
  background: var(--success-color);
}

.tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 2px solid var(--border-color);
}

.tab {
  background: none;
  border: none;
  padding: 15px 20px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab:hover {
  color: var(--text-color);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.activity-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.activity-icon {
  color: var(--primary-color);
  font-size: 1.2rem;
  margin-top: 2px;
}

.activity-content p {
  margin: 0;
  color: var(--text-color);
}

.activity-time {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collection-card {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.collection-card h3 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.private-badge {
  background: var(--warning-color);
  color: var(--text-dark);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stats-card {
  background: var(--card-bg);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  text-align: center;
}

.stats-card h3 {
  margin: 0 0 10px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-number {
  font-size: 2rem;
  font-weight: bold;
  color: var(--primary-color);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-stats {
    justify-content: center;
  }

  .tabs {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
