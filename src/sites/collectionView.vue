<template>
  <div class="collection-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading collection...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-circle error-icon"></i>
      <h3>{{ error }}</h3>
      <router-link to="/collections" class="btn btn-primary">Back to Collections</router-link>
    </div>
    
    <template v-else>
      <div class="collection-header" :class="{ 'is-featured': collection.is_featured }">
        <div class="header-content">
          <div class="badges">
            <span v-if="collection.is_featured" class="badge badge-featured">Featured</span>
            <span v-if="collection.is_private" class="badge badge-private">Private</span>
          </div>
          
          <h1>{{ collection.name }}</h1>
          
          <div class="collection-meta">
            <div class="creator">
              <img v-if="collection.creator_avatar" :src="collection.creator_avatar" class="avatar" />
              <span>Created by {{ collection.creator_name || 'Anonymous' }}</span>
            </div>
            
            <div class="date">
              <i class="far fa-calendar-alt"></i>
              <span>{{ formatDate(collection.created_at) }}</span>
            </div>
            
            <div class="script-count">
              <i class="fas fa-code"></i>
              <span>{{ collection.items?.length || 0 }} scripts</span>
            </div>
          </div>
          
          <p class="description">{{ collection.description || 'No description provided' }}</p>
        </div>
        
        <div class="collection-actions">
          <button v-if="isLoggedIn" @click="toggleBookmark" class="btn" :class="{ 'btn-bookmarked': collection.isBookmarked, 'btn-bookmark': !collection.isBookmarked }">
            <i :class="collection.isBookmarked ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
            {{ collection.isBookmarked ? 'Bookmarked' : 'Bookmark' }}
          </button>
          
          <button v-if="isLoggedIn" @click="showShareModal = true" class="btn btn-share">
            <i class="fas fa-share-alt"></i> Share
          </button>
          
          <button v-if="canEdit" @click="showEditModal = true" class="btn btn-edit">
            <i class="fas fa-pencil-alt"></i> Edit Collection
          </button>
          
          <button v-if="isAdmin && !collection.is_featured" @click="toggleFeature" class="btn btn-feature">
            <i class="fas fa-star"></i> Feature Collection
          </button>
          
          <button v-if="isAdmin && collection.is_featured" @click="toggleFeature" class="btn btn-unfeature">
            <i class="far fa-star"></i> Unfeature Collection
          </button>
        </div>
      </div>

      <!-- Analytics Section -->
      <div class="collection-analytics">
        <h3>Analytics</h3>
        <div class="analytics-stats">
          <div class="stat-item">
            <i class="fas fa-eye"></i>
            <span>{{ collection.views || 0 }} views</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-bookmark"></i>
            <span>{{ collection.bookmarks || 0 }} bookmarks</span>
          </div>
          <div class="stat-item">
            <i class="fas fa-share-alt"></i>
            <span>{{ collection.shares || 0 }} shares</span>
          </div>
        </div>
      </div>
      
      <div v-if="collection.items && collection.items.length > 0" class="scripts-container">
        <div class="scripts-header">
          <h2>Scripts in this Collection</h2>
          <div class="scripts-actions">
            <div class="search-container">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search scripts..." 
              />
              <i class="fas fa-search search-icon"></i>
            </div>
            
            <div class="sort-container">
              <label>Sort by:</label>
              <select v-model="sortBy">
                <option value="date">Date Added (Newest)</option>
                <option value="date-asc">Date Added (Oldest)</option>
                <option value="name">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="downloads">Most Downloads</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="scripts-grid">
          <ScriptCard 
            v-for="script in filteredScripts" 
            :key="script.id" 
            :script="script" 
            :showRemove="canEdit"
            @remove="removeFromCollection(script.id)"
          />
        </div>
      </div>
      
      <div v-else class="empty-collection">
        <i class="fas fa-folder-open"></i>
        <h3>This collection is empty</h3>
        <p>No scripts have been added to this collection yet.</p>
        
        <div v-if="canEdit" class="empty-actions">
          <router-link to="/scripts" class="btn btn-primary">
            Browse Scripts to Add
          </router-link>
        </div>
      </div>
    </template>
    
    <!-- Edit Collection Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="cancelModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Edit Collection</h3>
          <button @click="cancelModal" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveCollection">
            <div class="form-group">
              <label for="name">Collection Name</label>
              <input 
                type="text" 
                id="name" 
                v-model="collectionForm.name" 
                required 
                maxlength="100" 
              />
            </div>
            
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="collectionForm.description" 
                rows="4" 
                maxlength="500"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectionForm.isPrivate" />
                <span>Private Collection</span>
                <span class="help-text">Private collections are only visible to you</span>
              </label>
            </div>
            
            <div v-if="isAdmin" class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectionForm.isFeatured" />
                <span>Featured Collection</span>
                <span class="help-text">Featured collections appear on the home page</span>
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="cancelModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Collection</button>
              <button type="button" @click="confirmDelete" class="btn btn-danger">Delete</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal delete-modal">
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
          <button @click="showDeleteModal = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <p>Are you sure you want to delete this collection? This action cannot be undone.</p>
          
          <div class="form-actions">
            <button @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
            <button @click="deleteCollection" class="btn btn-danger">Yes, Delete Collection</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Share Collection Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="showShareModal = false">
      <div class="modal share-modal">
        <div class="modal-header">
          <h3>Share Collection</h3>
          <button @click="showShareModal = false" class="close-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="share-options">
            <div class="share-link-container">
              <label for="shareLink">Collection Link:</label>
              <div class="copy-link">
                <input 
                  type="text" 
                  id="shareLink" 
                  readonly 
                  :value="shareLink" 
                  ref="shareLinkInput"
                />
                <button @click="copyShareLink" class="btn btn-copy">
                  <i class="fas fa-copy"></i>
                  {{ linkCopied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <div class="generate-token">
              <p>Create a special share link that works even if the collection is private:</p>
              <button @click="generateShareToken" class="btn btn-primary" :disabled="generatingToken">
                <i class="fas fa-key"></i>
                {{ shareToken ? 'Regenerate Share Token' : 'Generate Share Token' }}
              </button>
              
              <div v-if="shareToken" class="share-token-container">
                <label for="tokenLink">Token Link:</label>
                <div class="copy-link">
                  <input 
                    type="text" 
                    id="tokenLink" 
                    readonly 
                    :value="tokenShareLink" 
                    ref="tokenLinkInput"
                  />
                  <button @click="copyTokenLink" class="btn btn-copy">
                    <i class="fas fa-copy"></i>
                    {{ tokenLinkCopied ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
                <p class="token-expiry">This token will expire in 30 days.</p>
              </div>
            </div>

            <div class="social-share">
              <h4>Share on Social Media:</h4>
              <div class="social-buttons">
                <a :href="'https://twitter.com/intent/tweet?url=' + encodeURIComponent(shareLink) + '&text=' + encodeURIComponent('Check out this script collection: ' + collection.name)" 
                   target="_blank" 
                   class="btn btn-social btn-twitter">
                  <i class="fab fa-twitter"></i> Twitter
                </a>
                <a :href="'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareLink)" 
                   target="_blank" 
                   class="btn btn-social btn-facebook">
                  <i class="fab fa-facebook"></i> Facebook
                </a>
                <a :href="'https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=0'" 
                   target="_blank" 
                   class="btn btn-social btn-discord">
                  <i class="fab fa-discord"></i> Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import ScriptCard from '@/components/ScriptCard.vue';
import { useConfig } from '@/composables/useConfig';

export default {
  name: 'CollectionView',
  components: {
    ScriptCard
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const { apiBaseUrl } = useConfig();
    
    // Data
    const collection = ref({});
    const loading = ref(true);
    const error = ref(null);
    const searchQuery = ref('');
    const sortBy = ref('date');
    const showEditModal = ref(false);
    const showDeleteModal = ref(false);
    const showShareModal = ref(false);
    const shareToken = ref('');
    const generatingToken = ref(false);
    const linkCopied = ref(false);
    const tokenLinkCopied = ref(false);
    const shareLinkInput = ref(null);
    const tokenLinkInput = ref(null);
    const collectionForm = ref({
      name: '',
      description: '',
      isPrivate: false,
      isFeatured: false
    });
    
    // Computed properties
    const isLoggedIn = computed(() => store.getters.isAuthenticated);
    const isAdmin = computed(() => store.getters.isAdmin);
    const userId = computed(() => store.getters.userId);
    
    const canEdit = computed(() => {
      return isAdmin.value || (collection.value?.user_id === userId.value);
    });

    // Share links
    const shareLink = computed(() => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/collections/${collection.value.id}`;
    });

    const tokenShareLink = computed(() => {
      if (!shareToken.value) return '';
      const baseUrl = window.location.origin;
      return `${baseUrl}/collections/${collection.value.id}?token=${shareToken.value}`;
    });
    
    const filteredScripts = computed(() => {
      if (!collection.value?.items) return [];
      
      let scripts = [...collection.value.items];
      const query = searchQuery.value.toLowerCase().trim();
      
      if (query) {
        scripts = scripts.filter(script => {
          return script.title.toLowerCase().includes(query) || 
                 (script.description && script.description.toLowerCase().includes(query)) ||
                 (script.category && script.category.toLowerCase().includes(query));
        });
      }
      
      // Sort scripts
      switch (sortBy.value) {
        case 'date':
          scripts.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
          break;
        case 'date-asc':
          scripts.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
          break;
        case 'name':
          scripts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'name-desc':
          scripts.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case 'downloads':
          scripts.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
          break;
        case 'rating':
          scripts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
      }
      
      return scripts;
    });
    
    // Methods
    const loadCollection = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await axios.get(`/api/collections/${route.params.id}`);
        collection.value = response.data;
        
        // Populate form data if collection loaded
        collectionForm.value = {
          name: collection.value.name,
          description: collection.value.description || '',
          isPrivate: collection.value.is_private,
          isFeatured: collection.value.is_featured
        };
      } catch (err) {
        console.error('Error loading collection:', err);
        if (err.response?.status === 404) {
          error.value = 'Collection not found';
        } else if (err.response?.status === 403) {
          error.value = 'You do not have permission to view this collection';
        } else {
          error.value = 'Failed to load collection';
        }
      } finally {
        loading.value = false;
      }
    };
    
    const saveCollection = async () => {
      try {
        await axios.put(`/api/collections/${collection.value.id}`, {
          name: collectionForm.value.name,
          description: collectionForm.value.description,
          isPrivate: collectionForm.value.isPrivate
        });
        
        // If admin, update featured status separately
        if (isAdmin.value && collection.value.is_featured !== collectionForm.value.isFeatured) {
          await axios.put(`/api/admin/collections/${collection.value.id}/featured`, {
            isFeatured: collectionForm.value.isFeatured
          });
        }
        
        // Refresh collection data
        await loadCollection();
        
        // Close modal
        showEditModal.value = false;
      } catch (error) {
        console.error('Error updating collection:', error);
        alert('Failed to update collection. Please try again.');
      }
    };
    
    const toggleFeature = async () => {
      if (!isAdmin.value) return;
      
      try {
        await axios.put(`/api/admin/collections/${collection.value.id}/featured`, {
          isFeatured: !collection.value.is_featured
        });
        
        // Refresh collection data
        await loadCollection();
      } catch (error) {
        console.error('Error toggling feature status:', error);
        alert('Failed to update featured status. Please try again.');
      }
    };
    
    const confirmDelete = () => {
      showDeleteModal.value = true;
    };
    
    const deleteCollection = async () => {
      try {
        await axios.delete(`/api/collections/${collection.value.id}`);
        router.push('/collections');
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
        showDeleteModal.value = false;
      }
    };
    
    const removeFromCollection = async (scriptId) => {
      try {
        await axios.delete(`/api/collections/${collection.value.id}/scripts/${scriptId}`);
        await loadCollection();
      } catch (error) {
        console.error('Error removing script from collection:', error);
        alert('Failed to remove script from collection. Please try again.');
      }
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    };
    
    const cancelModal = () => {
      showEditModal.value = false;
      
      // Reset form data to current collection values
      collectionForm.value = {
        name: collection.value.name,
        description: collection.value.description || '',
        isPrivate: collection.value.is_private,
        isFeatured: collection.value.is_featured
      };
    };
    
    // Watch for route changes to reload collection
    watch(() => route.params.id, (newId, oldId) => {
      if (newId !== oldId) {
        loadCollection();
      }
    });
    
    // Bookmark functionality
    const toggleBookmark = async () => {
      if (!isLoggedIn.value) {
        router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
        return;
      }

      try {
        const action = collection.value.isBookmarked ? 'remove' : 'add';
        await axios.post(`${apiBaseUrl}/api/collections/${collection.value.id}/bookmark`, { action });
        
        // Update the local state
        collection.value.isBookmarked = !collection.value.isBookmarked;
        
        // Update bookmark count
        if (collection.value.isBookmarked) {
          collection.value.bookmarks = (collection.value.bookmarks || 0) + 1;
        } else {
          collection.value.bookmarks = Math.max((collection.value.bookmarks || 1) - 1, 0);
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        alert('Failed to update bookmark. Please try again.');
      }
    };

    // Share functionality
    const generateShareToken = async () => {
      if (!isLoggedIn.value) {
        router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
        return;
      }
      
      generatingToken.value = true;
      
      try {
        const response = await axios.post(`${apiBaseUrl}/api/collections/${collection.value.id}/share-token`);
        shareToken.value = response.data.token;
        
        // Update share count
        collection.value.shares = (collection.value.shares || 0) + 1;
      } catch (error) {
        console.error('Error generating share token:', error);
        alert('Failed to generate share token. Please try again.');
      } finally {
        generatingToken.value = false;
      }
    };

    const copyShareLink = () => {
      shareLinkInput.value.select();
      document.execCommand('copy');
      linkCopied.value = true;
      
      setTimeout(() => {
        linkCopied.value = false;
      }, 2000);
    };

    const copyTokenLink = () => {
      if (!tokenLinkInput.value) return;
      
      tokenLinkInput.value.select();
      document.execCommand('copy');
      tokenLinkCopied.value = true;
      
      setTimeout(() => {
        tokenLinkCopied.value = false;
      }, 2000);
    };

    onMounted(() => {
      loadCollection();
      
      // Check if token is in URL and log analytics for view
      const token = route.query.token;
      if (token) {
        // You might want to verify the token is valid here
        axios.post(`${apiBaseUrl}/api/collections/${route.params.id}/view`, { token })
          .catch(err => console.error('Error logging view:', err));
      } else {
        // Regular view tracking
        axios.post(`${apiBaseUrl}/api/collections/${route.params.id}/view`)
          .catch(err => console.error('Error logging view:', err));
      }
    });
    
    return {
      collection,
      loading,
      error,
      searchQuery,
      sortBy,
      showEditModal,
      showDeleteModal,
      showShareModal,
      collectionForm,
      isLoggedIn,
      isAdmin,
      canEdit,
      filteredScripts,
      shareLink,
      tokenShareLink,
      shareToken,
      generatingToken,
      linkCopied,
      tokenLinkCopied,
      shareLinkInput,
      tokenLinkInput,
      loadCollection,
      saveCollection,
      toggleFeature,
      confirmDelete,
      deleteCollection,
      removeFromCollection,
      formatDate,
      cancelModal,
      toggleBookmark,
      generateShareToken,
      copyShareLink,
      copyTokenLink
    };
  }
};
</script>

<style scoped>
.collection-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid var(--surface-alt-color);
  border-top-color: var(--accent-color);
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  color: var(--error-color);
  margin-bottom: 16px;
}

.collection-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  background-color: var(--surface-alt-color);
  border-radius: 8px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.collection-header.is-featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: var(--accent-color);
}

.header-content {
  flex: 1;
  min-width: 280px;
}

h1 {
  margin: 8px 0 16px;
  color: var(--text-primary);
}

.collection-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.creator, .date, .script-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.badges {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.badge-featured {
  background: var(--accent-color);
  color: white;
}

.badge-private {
  background: var(--text-muted);
  color: var(--surface-color);
}

.description {
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.collection-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  border: none;
  transition: background-color 0.2s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-edit {
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-feature {
  background-color: var(--success-color);
  color: white;
}

.btn-unfeature {
  background-color: var(--warning-color);
  color: white;
}

.btn-primary {
  background-color: var(--accent-color);
  color: white;
}

.btn-secondary {
  background-color: var(--surface-alt-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-danger {
  background-color: var(--error-color);
  color: white;
}

.scripts-container {
  margin-top: 30px;
}

.scripts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.scripts-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  width: 250px;
}

.search-container input {
  width: 100%;
  padding: 8px 16px;
  padding-left: 36px;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.sort-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-container select {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
}

.scripts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.empty-collection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-collection i {
  font-size: 4rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-collection h3 {
  margin-bottom: 8px;
}

.empty-collection p {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.empty-actions {
  margin-top: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--surface-color);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.delete-modal {
  max-width: 400px;
}

.share-modal {
  max-width: 550px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-left: 8px;
}

input[type="text"], textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 24px;
}

/* Collection Analytics */
.collection-analytics {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.collection-analytics h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.analytics-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item i {
  font-size: 1.2rem;
  color: var(--brand-color);
}

/* Share functionality */
.share-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-link-container, .generate-token {
  margin-bottom: 16px;
}

.copy-link {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.copy-link input {
  flex-grow: 1;
  background-color: var(--input-bg-dark);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px 12px;
}

.btn-copy {
  white-space: nowrap;
  background-color: var(--surface-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.token-expiry {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 8px;
}

.social-share h4 {
  margin-top: 0;
  margin-bottom: 12px;
}

.social-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-social {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.9rem;
}

.btn-twitter {
  background-color: #1DA1F2;
  color: white;
}

.btn-facebook {
  background-color: #4267B2;
  color: white;
}

.btn-discord {
  background-color: #5865F2;
  color: white;
}

/* Bookmark button */
.btn-bookmark, .btn-bookmarked {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-bookmark {
  background-color: var(--surface-secondary);
  color: var(--text-secondary);
}

.btn-bookmarked {
  background-color: var(--brand-color);
  color: white;
}

.btn-share {
  background-color: var(--surface-secondary);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 768px) {
  .scripts-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .scripts-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .search-container {
    width: 100%;
  }
  
  .sort-container {
    width: 100%;
  }
  
  .sort-container select {
    flex-grow: 1;
  }
}
</style>
