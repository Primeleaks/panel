<template>
  <div class="user-profile-page">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>
    
    <template v-else-if="error">
      <div class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error Loading Profile</h3>
        <p>{{ error }}</p>
        <button @click="fetchProfile" class="retry-btn">Retry</button>
      </div>
    </template>
    
    <template v-else>
      <div class="profile-header">
        <div class="profile-cover" :style="{ backgroundImage: `url(${profile.coverImage || defaultCoverImage})` }">
          <div class="profile-avatar-container">
            <img :src="profile.avatar || defaultAvatar" :alt="profile.username" class="profile-avatar" />
            <div v-if="isCurrentUser" class="avatar-edit" @click="openAvatarEdit">
              <i class="fas fa-camera"></i>
            </div>
          </div>
        </div>
        
        <div class="profile-info">
          <div class="profile-name-container">
            <h1 class="profile-name">{{ profile.username }}</h1>
            <span v-if="profile.verified" class="verified-badge" title="Verified User">
              <i class="fas fa-check-circle"></i>
            </span>
            <span v-if="profile.role === 'admin'" class="admin-badge" title="Administrator">
              <i class="fas fa-shield-alt"></i>
            </span>
          </div>
          
          <div class="profile-status" :class="{ 'editable': isCurrentUser }" @click="isCurrentUser && editStatus()">
            {{ profile.status || 'No status set' }}
            <i v-if="isCurrentUser" class="fas fa-edit"></i>
          </div>
          
          <div class="profile-actions">
            <button 
              v-if="!isCurrentUser" 
              class="follow-btn" 
              :class="{ 'following': isFollowing }"
              @click="toggleFollow"
            >
              <i :class="isFollowing ? 'fas fa-user-check' : 'fas fa-user-plus'"></i>
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
            
            <button v-if="isCurrentUser" class="edit-profile-btn" @click="openProfileEdit">
              <i class="fas fa-cog"></i>
              Edit Profile
            </button>
          </div>
        </div>
      </div>
      
      <div class="profile-content">
        <div class="profile-sidebar">
          <div class="profile-section">
            <h3>About</h3>
            <div 
              class="profile-bio" 
              :class="{ 'editable': isCurrentUser }"
              @click="isCurrentUser && editBio()"
            >
              {{ profile.bio || 'No bio added yet.' }}
              <i v-if="isCurrentUser" class="fas fa-edit"></i>
            </div>
          </div>
          
          <div class="profile-section">
            <h3>Statistics</h3>
            <div class="profile-stats">
              <div class="stat-item">
                <div class="stat-value">{{ profile.scriptCount }}</div>
                <div class="stat-label">Scripts</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ profile.followersCount }}</div>
                <div class="stat-label">Followers</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ profile.followingCount }}</div>
                <div class="stat-label">Following</div>
              </div>
            </div>
          </div>
          
          <div class="profile-section">
            <h3>Social Links</h3>
            <div class="social-links">
              <a v-if="profile.discordId" :href="`https://discord.com/users/${profile.discordId}`" target="_blank" class="social-link discord">
                <i class="fab fa-discord"></i> Discord
              </a>
              <a v-if="profile.githubUsername" :href="`https://github.com/${profile.githubUsername}`" target="_blank" class="social-link github">
                <i class="fab fa-github"></i> GitHub
              </a>
              <a v-if="profile.twitterUsername" :href="`https://twitter.com/${profile.twitterUsername}`" target="_blank" class="social-link twitter">
                <i class="fab fa-twitter"></i> Twitter
              </a>
              
              <div v-if="isCurrentUser && !hasAnySocialLinks" class="add-social-links" @click="openProfileEdit">
                <i class="fas fa-plus-circle"></i> Add social links
              </div>
            </div>
          </div>
        </div>
        
        <div class="profile-main">
          <div class="profile-tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab.id" 
              :class="['tab-button', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              <i :class="tab.icon"></i> {{ tab.label }}
            </button>
          </div>
          
          <div class="tab-content">
            <!-- Scripts Tab -->
            <div v-if="activeTab === 'scripts'" class="scripts-tab">
              <div v-if="userScripts.length === 0" class="empty-state">
                <i class="fas fa-file-code"></i>
                <p>{{ isCurrentUser ? 'You haven\'t uploaded any scripts yet.' : 'This user hasn\'t uploaded any scripts yet.' }}</p>
                <button v-if="isCurrentUser" class="action-btn" @click="openUploadModal">Upload a Script</button>
              </div>
              
              <div v-else class="scripts-grid">
                <div v-for="script in userScripts" :key="script.id" class="script-card" @click="viewScript(script.id)">
                  <div class="script-image-container">
                    <img :src="script.image || defaultScriptImage" :alt="script.title" class="script-image" @error="handleImageError" />
                  </div>
                  <div class="script-info">
                    <h3>{{ script.title }}</h3>
                    <p>{{ script.description }}</p>
                    <div class="script-meta">
                      <span>{{ formatDate(script.date) }}</span>
                      <div class="script-stats">
                        <span><i class="fas fa-download"></i> {{ script.downloads }}</span>
                        <span><i class="fas fa-star"></i> {{ script.avgRating || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Collections Tab -->
            <div v-if="activeTab === 'collections'" class="collections-tab">
              <div v-if="userCollections.length === 0" class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>{{ isCurrentUser ? 'You haven\'t created any collections yet.' : 'This user hasn\'t created any public collections yet.' }}</p>
                <button v-if="isCurrentUser" class="action-btn" @click="createCollection">Create Collection</button>
              </div>
              
              <div v-else class="collections-grid">
                <div v-for="collection in userCollections" :key="collection.id" class="collection-card" @click="viewCollection(collection.id)">
                  <div class="collection-preview">
                    <div v-if="collection.scriptCount > 0" class="script-thumbnails">
                      <img v-for="thumbnail in collection.thumbnails" :key="thumbnail" :src="thumbnail" alt="" />
                    </div>
                    <div v-else class="empty-collection">
                      <i class="fas fa-folder"></i>
                    </div>
                  </div>
                  <div class="collection-info">
                    <h3>{{ collection.name }}</h3>
                    <p>{{ collection.description }}</p>
                    <div class="collection-meta">
                      <span><i class="fas fa-file-code"></i> {{ collection.scriptCount }} scripts</span>
                      <span v-if="collection.isPrivate"><i class="fas fa-lock"></i> Private</span>
                      <span v-else><i class="fas fa-globe"></i> Public</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Activity Tab -->
            <div v-if="activeTab === 'activity'" class="activity-tab">
              <ActivityFeed 
                :userId="userId"
                :showFilters="false"
                @navigate="handleFeedNavigation"
              />
            </div>
            
            <!-- Reviews Tab -->
            <div v-if="activeTab === 'reviews'" class="reviews-tab">
              <div v-if="userReviews.length === 0" class="empty-state">
                <i class="fas fa-star"></i>
                <p>{{ isCurrentUser ? 'You haven\'t reviewed any scripts yet.' : 'This user hasn\'t reviewed any scripts yet.' }}</p>
              </div>
              
              <div v-else class="reviews-list">
                <div v-for="review in userReviews" :key="review.id" class="review-card">
                  <div class="review-script">
                    <img :src="review.scriptImage || defaultScriptImage" :alt="review.scriptTitle" class="script-image" @error="handleImageError" />
                    <div class="script-info">
                      <h4>{{ review.scriptTitle }}</h4>
                      <div class="script-author">by {{ review.scriptAuthor }}</div>
                    </div>
                  </div>
                  
                  <div class="review-content">
                    <div class="review-rating">
                      <i v-for="star in 5" :key="star" :class="['star-icon', star <= review.rating ? 'filled' : '']">★</i>
                      <span class="review-date">{{ formatDate(review.date) }}</span>
                    </div>
                    <p class="review-text">{{ review.review }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <!-- Edit Status Modal -->
    <div v-if="isStatusEditOpen" class="modal status-edit-modal">
      <div class="modal-content">
        <h3>Update Status</h3>
        <input v-model="editedStatus" placeholder="What's on your mind?" maxlength="100" />
        <div class="modal-actions">
          <button @click="isStatusEditOpen = false" class="cancel-btn">Cancel</button>
          <button @click="saveStatus" class="save-btn">Save</button>
        </div>
      </div>
    </div>
    
    <!-- Edit Bio Modal -->
    <div v-if="isBioEditOpen" class="modal bio-edit-modal">
      <div class="modal-content">
        <h3>Edit Bio</h3>
        <textarea v-model="editedBio" placeholder="Tell others about yourself..." maxlength="500"></textarea>
        <div class="modal-actions">
          <button @click="isBioEditOpen = false" class="cancel-btn">Cancel</button>
          <button @click="saveBio" class="save-btn">Save</button>
        </div>
      </div>
    </div>
    
    <!-- Profile Edit Modal -->
    <div v-if="isProfileEditOpen" class="modal" @click="closeProfileEditModal">
      <div class="modal-content" @click.stop>
        <h3>Profile bearbeiten</h3>
        <div class="edit-form">
          <div class="form-group">
            <label>Avatar URL:</label>
            <input 
              v-model="editedProfile.avatar" 
              type="url" 
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <div class="form-group">
            <label>Status:</label>
            <input 
              v-model="editedProfile.status" 
              type="text" 
              placeholder="Your status..."
              maxlength="100"
            />
          </div>
          <div class="form-group">
            <label>Bio:</label>
            <textarea 
              v-model="editedProfile.bio"
              placeholder="Tell us about yourself..."
              rows="4"
              maxlength="500"
            ></textarea>
          </div>
          <div class="form-group">
            <label>Location:</label>
            <input 
              v-model="editedProfile.location" 
              type="text" 
              placeholder="Your location..."
              maxlength="50"
            />
          </div>
          <div class="form-group">
            <label>Website:</label>
            <input 
              v-model="editedProfile.website" 
              type="url" 
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div class="form-group">
            <label>Discord Username:</label>
            <input 
              v-model="editedProfile.discordUsername" 
              type="text" 
              placeholder="username#1234"
            />
          </div>
          <div class="form-group">
            <label>GitHub Username:</label>
            <input 
              v-model="editedProfile.githubUsername" 
              type="text" 
              placeholder="yourusername"
            />
          </div>
          <div class="form-group">
            <label>Twitter Handle:</label>
            <input 
              v-model="editedProfile.twitterHandle" 
              type="text" 
              placeholder="@yourusername"
            />
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="editedProfile.showEmail" 
                type="checkbox"
              />
              <span class="checkmark"></span>
              E-Mail öffentlich anzeigen
            </label>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="editedProfile.allowFollowers" 
                type="checkbox"
              />
              <span class="checkmark"></span>
              Follower erlauben
            </label>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeProfileEditModal" class="cancel-btn">Abbrechen</button>
          <button @click="saveProfile" class="save-btn" :disabled="savingProfile">
            {{ savingProfile ? 'Speichert...' : 'Speichern' }}
          </button>
          <button @click="openThemeCustomization" class="customize-btn">
            <i class="fas fa-palette"></i>
            Customize Theme
          </button>
        </div>
      </div>
    </div>
    
    <!-- Theme Customization Modal -->
    <div v-if="isThemeCustomizationOpen" class="modal" @click="closeThemeCustomization">
      <div class="modal-content theme-modal" @click.stop>
        <div class="modal-header">
          <h3>Theme Customization</h3>
          <button @click="closeThemeCustomization" class="close-btn">&times;</button>
        </div>
        <ThemeManager />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import ActivityFeed from '@/components/ActivityFeed.vue';
import ThemeManager from '@/components/ThemeManager.vue';

export default {
  components: {
    ActivityFeed,
    ThemeManager
  },
  
  props: {
    userId: {
      type: String,
      required: true
    }
  },
  
  setup(props, { emit }) {
    const route = useRoute();
    const loading = ref(true);
    const error = ref(null);
    const profile = ref({});
    const userScripts = ref([]);
    const userCollections = ref([]);
    const userReviews = ref([]);
    const activeTab = ref('scripts');
    const isFollowing = ref(false);
    const isStatusEditOpen = ref(false);
    const isBioEditOpen = ref(false);
    const editedStatus = ref('');
    const editedBio = ref('');
    
    // Profile editing
    const isProfileEditOpen = ref(false);
    const isThemeCustomizationOpen = ref(false);
    const savingProfile = ref(false);
    const editedProfile = ref({
      avatar: '',
      status: '',
      bio: '',
      location: '',
      website: '',
      discordUsername: '',
      githubUsername: '',
      twitterHandle: '',
      showEmail: false,
      allowFollowers: true
    });
    
    const tabs = [
      { id: 'scripts', label: 'Scripts', icon: 'fas fa-file-code' },
      { id: 'collections', label: 'Collections', icon: 'fas fa-folder' },
      { id: 'activity', label: 'Activity', icon: 'fas fa-history' },
      { id: 'reviews', label: 'Reviews', icon: 'fas fa-star' }
    ];
    
    const defaultAvatar = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/hopeleaksbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
    const defaultCoverImage = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/hopeleaksbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
    const defaultScriptImage = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/hopeleaksbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
    
    const currentUser = ref(null);
    
    // Check if viewing own profile
    const isCurrentUser = computed(() => {
      return currentUser.value && currentUser.value.discord_id === props.userId;
    });
    
    const hasAnySocialLinks = computed(() => {
      return profile.value.discordId || profile.value.githubUsername || profile.value.twitterUsername;
    });
    
    const getCookie = (cookieName) => {
      const cookies = document.cookie.split("; ");
      const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
      return cookie ? cookie.split("=")[1] : null;
    };
    
    const fetchCurrentUser = async () => {
      const token = getCookie("token");
      if (!token) return;
      
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        currentUser.value = payload;
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    
    const fetchProfile = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        // Get token
        const token = getCookie("token");
        
        // Make API request to get user profile
        const response = await axios.get(`http://localhost:3001/api/users/${props.userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        profile.value = response.data;
        
        // Check if following
        if (currentUser.value) {
          const followingResponse = await axios.get(`http://localhost:3001/api/users/is-following/${props.userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          isFollowing.value = followingResponse.data.following;
        }
        
        // Fetch user's scripts
        fetchUserScripts();
        
        // Fetch user's collections
        fetchUserCollections();
        
        // Fetch user's reviews
        fetchUserReviews();
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        error.value = 'Failed to load user profile. Please try again later.';
      } finally {
        loading.value = false;
      }
    };
    
    const fetchUserScripts = async () => {
      try {
        // Make API request to get user's scripts
        const response = await axios.get(`http://localhost:3001/api/scripts/user/${props.userId}`);
        userScripts.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user scripts:', error);
      }
    };
    
    const fetchUserCollections = async () => {
      try {
        const token = getCookie("token");
        const isOwnProfile = currentUser.value && currentUser.value.discord_id === props.userId;
        
        // Make API request to get user's collections (include private collections for own profile)
        const url = `http://localhost:3001/api/collections/user/${props.userId}${isOwnProfile ? '?includePrivate=true' : ''}`;
        const response = await axios.get(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        userCollections.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user collections:', error);
      }
    };
    
    const fetchUserReviews = async () => {
      try {
        // Make API request to get user's reviews
        const response = await axios.get(`http://localhost:3001/api/ratings/user/${props.userId}`);
        userReviews.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user reviews:', error);
      }
    };
    
    const toggleFollow = async () => {
      if (!currentUser.value) {
        // Redirect to login
        return;
      }
      
      try {
        const token = getCookie("token");
        const url = `http://localhost:3001/api/users/${isFollowing.value ? 'unfollow' : 'follow'}/${props.userId}`;
        
        await axios.post(url, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        isFollowing.value = !isFollowing.value;
        
        // Update follower count
        if (isFollowing.value) {
          profile.value.followersCount++;
        } else {
          profile.value.followersCount--;
        }
      } catch (error) {
        console.error(`Failed to ${isFollowing.value ? 'unfollow' : 'follow'} user:`, error);
      }
    };
    
    const handleFeedNavigation = (target) => {
      if (target.type === 'script') {
        viewScript(target.id);
      } else if (target.type === 'user') {
        if (target.id !== props.userId) {
          // Navigate to different user profile
          window.location.href = `/profile/${target.id}`;
        }
      } else if (target.type === 'collection') {
        viewCollection(target.id);
      }
    };
    
    const viewScript = (scriptId) => {
      // Navigate to script detail page (to be implemented with router)
      console.log('Navigate to script:', scriptId);
    };
    
    const viewCollection = (collectionId) => {
      // Navigate to collection detail page (to be implemented with router)
      console.log('Navigate to collection:', collectionId);
    };
    
    const openAvatarEdit = () => {
      // Open avatar edit dialog (to be implemented)
      console.log('Open avatar edit');
    };
    
    const openProfileEdit = () => {
      // Populate edit form with current profile data
      editedProfile.value = {
        avatar: profile.value.avatar || '',
        status: profile.value.status || '',
        bio: profile.value.bio || '',
        location: profile.value.location || '',
        website: profile.value.website || '',
        discordUsername: profile.value.discordUsername || '',
        githubUsername: profile.value.githubUsername || '',
        twitterHandle: profile.value.twitterHandle || '',
        showEmail: profile.value.showEmail || false,
        allowFollowers: profile.value.allowFollowers !== false
      };
      isProfileEditOpen.value = true;
    };
    
    const closeProfileEditModal = () => {
      isProfileEditOpen.value = false;
    };
    
    const openThemeCustomization = () => {
      isThemeCustomizationOpen.value = true;
    };
    
    const closeThemeCustomization = () => {
      isThemeCustomizationOpen.value = false;
    };
    
    const saveProfile = async () => {
      try {
        savingProfile.value = true;
        const token = getCookie("token");
        
        await axios.put(`http://localhost:3001/api/profile`, editedProfile.value, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local profile data
        Object.assign(profile.value, editedProfile.value);
        
        isProfileEditOpen.value = false;
        // You could add a success toast here
        
      } catch (error) {
        console.error('Error updating profile:', error);
        // You could add an error toast here
      } finally {
        savingProfile.value = false;
      }
    };
    
    const editStatus = () => {
      editedStatus.value = profile.value.status || '';
      isStatusEditOpen.value = true;
    };
    
    const saveStatus = async () => {
      try {
        const token = getCookie("token");
        await axios.put(`http://localhost:3001/api/users/status`, {
          status: editedStatus.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        profile.value.status = editedStatus.value;
        isStatusEditOpen.value = false;
      } catch (error) {
        console.error('Failed to update status:', error);
      }
    };
    
    const editBio = () => {
      editedBio.value = profile.value.bio || '';
      isBioEditOpen.value = true;
    };
    
    const saveBio = async () => {
      try {
        const token = getCookie("token");
        await axios.put(`http://localhost:3001/api/users/bio`, {
          bio: editedBio.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        profile.value.bio = editedBio.value;
        isBioEditOpen.value = false;
      } catch (error) {
        console.error('Failed to update bio:', error);
      }
    };
    
    const createCollection = () => {
      // Open create collection modal (to be implemented)
      console.log('Create collection');
    };
    
    const openUploadModal = () => {
      // Open upload modal (to be implemented)
      console.log('Open upload modal');
    };
    
    const handleImageError = (event) => {
      event.target.src = defaultScriptImage;
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };
    
    onMounted(() => {
      fetchCurrentUser().then(() => {
        fetchProfile();
      });
    });
    
    return {
      loading,
      error,
      profile,
      userScripts,
      userCollections,
      userReviews,
      activeTab,
      tabs,
      isFollowing,
      isCurrentUser,
      hasAnySocialLinks,
      isStatusEditOpen,
      isBioEditOpen,
      editedStatus,
      editedBio,
      defaultAvatar,
      defaultCoverImage,
      defaultScriptImage,
      isProfileEditOpen,
      isThemeCustomizationOpen,
      editedProfile,
      savingProfile,
      fetchProfile,
      toggleFollow,
      handleFeedNavigation,
      viewScript,
      viewCollection,
      openAvatarEdit,
      openProfileEdit,
      closeProfileEditModal,
      openThemeCustomization,
      closeThemeCustomization,
      saveProfile,
      editStatus,
      saveStatus,
      editBio,
      saveBio,
      createCollection,
      openUploadModal,
      handleImageError,
      formatDate
    };
  }
};
</script>

<style scoped>
.user-profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text-color);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

.error-container i {
  font-size: 48px;
  color: #f44336;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.profile-header {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.profile-cover {
  height: 200px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.profile-avatar-container {
  position: absolute;
  bottom: -50px;
  left: 30px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 5px solid var(--card-bg);
  object-fit: cover;
  background-color: var(--card-bg);
}

.avatar-edit {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.avatar-edit:hover {
  background-color: var(--primary-color-dark);
}

.profile-info {
  padding: 60px 30px 20px 30px;
}

.profile-name-container {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.profile-name {
  margin: 0;
  font-size: 24px;
}

.verified-badge,
.admin-badge {
  margin-left: 8px;
  font-size: 18px;
}

.verified-badge {
  color: #1da1f2;
}

.admin-badge {
  color: #ff5722;
}

.profile-status {
  margin-bottom: 16px;
  color: var(--secondary-text);
  font-style: italic;
}

.profile-status.editable {
  cursor: pointer;
}

.profile-status.editable:hover {
  text-decoration: underline;
}

.profile-status i {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.profile-status.editable:hover i {
  opacity: 1;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.follow-btn,
.edit-profile-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.follow-btn {
  background-color: var(--primary-color);
  color: white;
}

.follow-btn.following {
  background-color: var(--button-secondary-bg);
  color: var(--text-color);
}

.follow-btn:hover {
  background-color: var(--primary-color-dark);
}

.follow-btn.following:hover {
  background-color: #f44336;
  color: white;
}

.follow-btn.following:hover:before {
  content: "Unfollow";
}

.follow-btn.following:hover span {
  display: none;
}

.edit-profile-btn {
  background-color: var(--button-secondary-bg);
  color: var(--text-color);
}

.edit-profile-btn:hover {
  background-color: var(--hover-bg);
}

.profile-content {
  display: flex;
  gap: 24px;
}

.profile-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.profile-section {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 18px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.profile-bio {
  white-space: pre-wrap;
  line-height: 1.5;
}

.profile-bio.editable {
  cursor: pointer;
}

.profile-bio.editable:hover {
  background-color: var(--hover-bg);
  border-radius: 4px;
}

.profile-bio i {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.profile-bio.editable:hover i {
  opacity: 1;
}

.profile-stats {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--primary-color);
}

.stat-label {
  font-size: 14px;
  color: var(--secondary-text);
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.2s;
}

.social-link:hover {
  background-color: var(--hover-bg);
}

.discord {
  color: #7289da;
}

.github {
  color: #24292e;
}

.twitter {
  color: #1da1f2;
}

.add-social-links {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
}

.add-social-links:hover {
  background-color: var(--hover-bg);
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.profile-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
}

.tab-button {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--secondary-text);
  font-weight: 500;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-button:hover {
  color: var(--text-color);
}

.tab-button.active {
  color: var(--primary-color);
}

.tab-button.active:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
  background-color: var(--card-bg);
  border-radius: 8px;
  color: var(--secondary-text);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.action-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.script-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.script-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.script-image-container {
  height: 150px;
  overflow: hidden;
}

.script-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.script-info {
  padding: 16px;
}

.script-info h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
}

.script-info p {
  margin: 0 0 12px;
  color: var(--secondary-text);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.script-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--secondary-text);
}

.script-stats {
  display: flex;
  gap: 10px;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collection-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.collection-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.collection-preview {
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--card-bg-secondary);
}

.script-thumbnails {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  width: 100%;
  height: 100%;
}

.script-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-collection {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.empty-collection i {
  font-size: 48px;
  opacity: 0.3;
}

.collection-info {
  padding: 16px;
}

.collection-info h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
}

.collection-info p {
  margin: 0 0 12px;
  color: var(--secondary-text);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.collection-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--secondary-text);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.review-script {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  flex-shrink: 0;
}

.review-script .script-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.review-script .script-info {
  width: 100%;
  text-align: center;
  padding: 0;
}

.review-script h4 {
  margin: 0 0 4px;
  font-size: 14px;
}

.script-author {
  font-size: 12px;
  color: var(--secondary-text);
}

.review-content {
  flex: 1;
}

.review-rating {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.star-icon {
  color: #ddd;
  font-size: 16px;
}

.star-icon.filled {
  color: #ffcc00;
}

.review-date {
  margin-left: auto;
  font-size: 12px;
  color: var(--secondary-text);
}

.review-text {
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 24px;
  width: 500px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg);
  color: var(--text-color);
  margin-bottom: 20px;
  font-size: 16px;
}

.modal-content textarea {
  height: 150px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: var(--button-secondary-bg);
  border: none;
  color: var(--text-color);
}

.save-btn {
  background-color: var(--primary-color);
  border: none;
  color: white;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
  }
  
  .review-card {
    flex-direction: column;
  }
  
  .review-script {
    width: 100%;
    flex-direction: row;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .review-script .script-image {
    width: 60px;
    height: 60px;
    margin-bottom: 0;
  }
  
  .review-script .script-info {
    text-align: left;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
