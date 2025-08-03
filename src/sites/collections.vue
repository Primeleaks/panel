<template>
  <div class="collections-view">
    <div class="collections-hero">
      <div class="hero-background">
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <h1 class="animate-fadeInUp">Script Collections</h1>
        <p class="animate-fadeInUp" style="animation-delay: 0.1s">Discover, organize, and share your favorite scripts</p>
        <button v-if="isLoggedIn" @click="showCreateModal = true" class="btn btn-create animate-fadeInUp" style="animation-delay: 0.2s">
          <i class="fas fa-plus"></i> Create Collection
        </button>
      </div>
    </div>
    
    <div class="collections-header">
      <div class="header-stats">
        <div class="stat-item">
          <i class="fas fa-folder"></i>
          <span>{{ collections.length + (myCollections?.length || 0) }} Collections</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-star"></i>
          <span>{{ featuredCollections.length }} Featured</span>
        </div>
      </div>
    </div>
    
    <div v-if="featuredCollections.length" class="featured-section">
      <h2>Featured Collections</h2>
      <div class="collections-grid">
        <CollectionCard
          v-for="collection in featuredCollections"
          :key="collection.id"
          :collection="collection"
          :isAdmin="isAdmin"
          :canEdit="canEditCollection(collection)"
          @edit="editCollection"
          @feature="toggleFeature"
        />
      </div>
    </div>
    
    <div v-if="isLoggedIn" class="user-collections">
      <div class="tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'my' }]"
          @click="activeTab = 'my'">
          <i class="fas fa-folder"></i> My Collections
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'bookmarked' }]"
          @click="activeTab = 'bookmarked'">
          <i class="fas fa-bookmark"></i> Bookmarked
        </button>
      </div>
      
      <div v-show="activeTab === 'my'" class="my-collections-section">
        <div v-if="myCollections.length" class="collections-grid">
          <CollectionCard
            v-for="collection in myCollections"
            :key="collection.id"
            :collection="collection"
            :isAdmin="isAdmin"
            :canEdit="true"
            @edit="editCollection"
            @feature="toggleFeature"
          />
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>You haven't created any collections yet</p>
          <button @click="showCreateModal = true" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Your First Collection
          </button>
        </div>
      </div>
      
      <div v-show="activeTab === 'bookmarked'" class="bookmarked-collections-section">
        <div v-if="loadingBookmarks" class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading bookmarked collections...</p>
        </div>
        <div v-else-if="bookmarkedCollections.length" class="collections-grid">
          <CollectionCard
            v-for="collection in bookmarkedCollections"
            :key="collection.id"
            :collection="collection"
            :isAdmin="isAdmin"
            :canEdit="canEditCollection(collection)"
            :isBookmarked="true"
            @edit="editCollection"
            @feature="toggleFeature"
          />
        </div>
        <div v-else class="empty-state">
          <i class="fas fa-bookmark"></i>
          <p>You haven't bookmarked any collections yet</p>
        </div>
      </div>
    </div>
    
    <div class="all-collections-section">
      <div class="section-header">
        <h2>Browse Collections</h2>
        <div class="search-container">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search collections..." 
            @input="debounceSearch" 
          />
          <i class="fas fa-search search-icon"></i>
        </div>
      </div>
      
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading collections...</p>
      </div>
      
      <div v-else-if="collections.length" class="collections-grid">
        <CollectionCard
          v-for="collection in collections"
          :key="collection.id"
          :collection="collection"
          :isAdmin="isAdmin"
          :canEdit="canEditCollection(collection)"
          @edit="editCollection"
          @feature="toggleFeature"
        />
      </div>
      
      <div v-else class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p v-if="searchQuery">No collections matching "{{ searchQuery }}"</p>
        <p v-else>No collections available</p>
      </div>
    </div>
    
    <!-- Create/Edit Collection Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="cancelModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingCollection ? 'Edit Collection' : 'Create Collection' }}</h3>
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
            
            <div v-if="isAdmin && editingCollection" class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="collectionForm.isFeatured" />
                <span>Featured Collection</span>
                <span class="help-text">Featured collections appear on the home page</span>
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="cancelModal" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingCollection ? 'Update Collection' : 'Create Collection' }}
              </button>
              <button 
                v-if="editingCollection" 
                type="button" 
                @click="deleteCollection" 
                class="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CollectionCard from '@/components/CollectionCard.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useConfig } from '@/composables/useConfig';

export default {
  name: 'CollectionsView',
  components: {
    CollectionCard
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    
    const { apiBaseUrl } = useConfig();
    
    // Data
    const collections = ref([]);
    const featuredCollections = ref([]);
    const myCollections = ref([]);
    const bookmarkedCollections = ref([]);
    const loading = ref(false);
    const loadingBookmarks = ref(false);
    const searchQuery = ref('');
    const showCreateModal = ref(false);
    const editingCollection = ref(null);
    const activeTab = ref('my');
    const collectionForm = ref({
      name: '',
      description: '',
      isPrivate: false,
      isFeatured: false
    });
    
    // Computed
    const isLoggedIn = computed(() => store.getters.isAuthenticated);
    const isAdmin = computed(() => store.getters.isAdmin);
    const userId = computed(() => store.getters.userId);
    
    // Methods
    const loadCollections = async () => {
      loading.value = true;
      try {
        const query = searchQuery.value.trim();
        let url = `${apiBaseUrl}/api/collections/search`;
        
        if (query) {
          url += `?query=${encodeURIComponent(query)}`;
        } else {
          // If no search query, just get featured collections
          url = `${apiBaseUrl}/api/collections/featured?limit=20`;
        }
        
        const response = await axios.get(url);
        collections.value = response.data;
      } catch (error) {
        console.error('Error loading collections:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const loadFeaturedCollections = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/collections/featured`);
        featuredCollections.value = response.data;
      } catch (error) {
        console.error('Error loading featured collections:', error);
      }
    };
    
    const loadMyCollections = async () => {
      if (!isLoggedIn.value) return;
      
      try {
        const response = await axios.get(`${apiBaseUrl}/api/users/${userId.value}/collections`);
        myCollections.value = response.data;
      } catch (error) {
        console.error('Error loading user collections:', error);
      }
    };
    
    const loadBookmarkedCollections = async () => {
      if (!isLoggedIn.value) return;
      
      loadingBookmarks.value = true;
      
      try {
        const response = await axios.get(`${apiBaseUrl}/api/users/me/bookmarked-collections`);
        bookmarkedCollections.value = response.data;
      } catch (error) {
        console.error('Error loading bookmarked collections:', error);
      } finally {
        loadingBookmarks.value = false;
      }
    };
    
    const editCollection = (collection) => {
      editingCollection.value = collection;
      collectionForm.value = {
        name: collection.name,
        description: collection.description || '',
        isPrivate: collection.is_private,
        isFeatured: collection.is_featured
      };
      showCreateModal.value = true;
    };
    
    const saveCollection = async () => {
      try {
        if (editingCollection.value) {
          // Update existing collection
          const response = await axios.put(
            `${apiBaseUrl}/api/collections/${editingCollection.value.id}`,
            {
              name: collectionForm.value.name,
              description: collectionForm.value.description,
              isPrivate: collectionForm.value.isPrivate
            }
          );
          
          // If admin, update featured status separately
          if (isAdmin.value && editingCollection.value.is_featured !== collectionForm.value.isFeatured) {
            await axios.put(
              `${apiBaseUrl}/api/admin/collections/${editingCollection.value.id}/featured`,
              {
                isFeatured: collectionForm.value.isFeatured
              }
            );
          }
          
          // Refresh collections lists
          await Promise.all([loadCollections(), loadFeaturedCollections(), loadMyCollections()]);
        } else {
          // Create new collection
          const response = await axios.post(`${apiBaseUrl}/api/collections`, {
            name: collectionForm.value.name,
            description: collectionForm.value.description,
            isPrivate: collectionForm.value.isPrivate
          });
          
          // Navigate to the new collection
          if (response.data.collectionId) {
            router.push({ name: 'collection', params: { id: response.data.collectionId }});
          } else {
            // Just refresh the collections
            await Promise.all([loadCollections(), loadMyCollections()]);
          }
        }
        
        // Close the modal
        cancelModal();
      } catch (error) {
        console.error('Error saving collection:', error);
        alert('Failed to save collection. Please try again.');
      }
    };
    
    const deleteCollection = async () => {
      if (!editingCollection.value) return;
      
      if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
        return;
      }
      
      try {
        await axios.delete(`${apiBaseUrl}/api/collections/${editingCollection.value.id}`);
        await Promise.all([loadCollections(), loadFeaturedCollections(), loadMyCollections()]);
        cancelModal();
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Failed to delete collection. Please try again.');
      }
    };
    
    const toggleFeature = async (collection) => {
      if (!isAdmin.value) return;
      
      try {
        await axios.put(`${apiBaseUrl}/api/admin/collections/${collection.id}/featured`, {
          isFeatured: !collection.is_featured
        });
        
        // Refresh collections
        await Promise.all([loadCollections(), loadFeaturedCollections()]);
      } catch (error) {
        console.error('Error toggling feature status:', error);
        alert('Failed to update featured status. Please try again.');
      }
    };
    
    const cancelModal = () => {
      showCreateModal.value = false;
      editingCollection.value = null;
      collectionForm.value = {
        name: '',
        description: '',
        isPrivate: false,
        isFeatured: false
      };
    };
    
    const canEditCollection = (collection) => {
      return isAdmin.value || collection.user_id === userId.value;
    };
    
    // Debounce search
    let debounceTimeout;
    const debounceSearch = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        loadCollections();
      }, 300);
    };
    
    onMounted(() => {
      loadCollections();
      loadFeaturedCollections();
      if (isLoggedIn.value) {
        loadMyCollections();
        loadBookmarkedCollections();
      }
    });
    
    // Watch for tab changes to load data
    watch(activeTab, (newTab) => {
      if (newTab === 'bookmarked' && isLoggedIn.value && bookmarkedCollections.value.length === 0) {
        loadBookmarkedCollections();
      }
    });
    
    return {
      collections,
      featuredCollections,
      myCollections,
      bookmarkedCollections,
      loading,
      loadingBookmarks,
      searchQuery,
      showCreateModal,
      editingCollection,
      collectionForm,
      activeTab,
      isLoggedIn,
      isAdmin,
      loadCollections,
      loadFeaturedCollections,
      loadMyCollections,
      loadBookmarkedCollections,
      editCollection,
      saveCollection,
      deleteCollection,
      toggleFeature,
      cancelModal,
      canEditCollection,
      debounceSearch
    };
  }
};
</script>

<style scoped>
.collections-view {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* Hero section with parallax effect */
.collections-hero {
  position: relative;
  height: 300px;
  overflow: hidden;
  border-radius: 0 0 20px 20px;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/images/collections-hero-bg.jpg');
  background-size: cover;
  background-position: center;
  transform: translateZ(0);
  will-change: transform;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(var(--brand-color-rgb), 0.8) 0%, rgba(var(--accent-color-rgb), 0.8) 100%);
}

.hero-content {
  position: relative;
  height: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
  text-align: center;
  z-index: 2;
}

.hero-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.hero-content p {
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 32px;
  opacity: 0.9;
}

/* Header stats below hero */
.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 20px 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.header-stats {
  display: flex;
  gap: 24px;
}

.header-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-weight: 500;
}

.header-stats .stat-item i {
  color: var(--brand-color);
  font-size: 1.2rem;
}

h1, h2 {
  color: var(--text-primary);
  margin-bottom: 16px;
}

.btn-create {
  background: linear-gradient(135deg, var(--accent-color), var(--brand-color));
  color: white;
  border: none;
  border-radius: 30px;
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  animation: subtle-pulse 2s infinite;
}

.btn-create::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.7s ease;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--accent-color-rgb), 0.5);
}

.btn-create:hover::before {
  left: 100%;
}

.btn-create i {
  font-size: 1rem;
  transition: transform 0.3s ease;
}

.btn-create:hover i {
  transform: rotate(90deg);
}

@keyframes subtle-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.featured-section, 
.user-collections,
.all-collections-section {
  margin-bottom: 40px;
}

/* Tabs for user collections */
.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.tab-btn {
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  z-index: 1;
}

.tab-btn:hover {
  color: var(--brand-color);
}

.tab-btn i {
  transition: transform 0.3s ease;
}

.tab-btn:hover i {
  transform: scale(1.2);
}

.tab-btn.active {
  color: var(--brand-color);
  font-weight: 500;
}

.tab-btn::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background-color: var(--brand-color);
  transition: width 0.3s ease;
}

.tab-btn:hover::before {
  width: 30%;
}

.tab-btn.active::before {
  width: 100%;
}

.my-collections-section, 
.bookmarked-collections-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-container {
  position: relative;
  max-width: 300px;
  width: 100%;
  transition: all 0.3s ease;
}

.search-container:focus-within {
  max-width: 350px;
}

.search-container input {
  width: 100%;
  padding: 12px 20px;
  padding-left: 42px;
  border-radius: 30px;
  border: 2px solid transparent;
  background-color: var(--surface-alt-color);
  color: var(--text-primary);
  font-size: 0.95rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.search-container input:focus {
  border-color: var(--brand-color);
  outline: none;
  box-shadow: 0 4px 15px rgba(var(--brand-color-rgb), 0.15);
}

.search-container input::placeholder {
  color: var(--text-muted);
  opacity: 0.7;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  transition: all 0.3s ease;
  font-size: 1.1rem;
}

.search-container:focus-within .search-icon {
  color: var(--brand-color);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  animation: fadeIn 0.5s ease-out;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: var(--text-muted);
  animation: fadeIn 0.5s ease-out;
  background: radial-gradient(circle, var(--surface-alt-color) 0%, transparent 70%);
  border-radius: 12px;
  position: relative;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: var(--brand-color);
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 5px 15px rgba(var(--brand-color-rgb), 0.2));
}

.empty-state p {
  font-size: 1.1rem;
  max-width: 300px;
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

.empty-state .btn {
  transform: translateY(0);
  transition: all 0.3s ease;
}

.empty-state .btn:hover {
  transform: translateY(-3px);
}

@keyframes float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0); }
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  animation: fadeIn 0.3s ease-out;
}

.spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
}

.spinner:before,
.spinner:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid transparent;
}

.spinner:before {
  border-top-color: var(--accent-color);
  border-right-color: var(--accent-color);
  animation: spin 1s cubic-bezier(0.76, 0.35, 0.2, 0.7) infinite;
}

.spinner:after {
  border-top-color: var(--brand-color);
  border-left-color: var(--brand-color);
  animation: spin 0.75s cubic-bezier(0.76, 0.35, 0.2, 0.7) infinite reverse;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal {
  background: var(--surface-color);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  animation: modalAppear 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.1);
  transform-origin: center;
}

@keyframes modalAppear {
  from { 
    opacity: 0; 
    transform: scale(0.8); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
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
  margin-bottom: 24px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 10px;
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 0;
}

.checkbox-label input[type="checkbox"] {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-label input[type="checkbox"]:checked {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}

.checkbox-label input[type="checkbox"]:checked::before {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
}

.checkbox-label input[type="checkbox"]:focus {
  box-shadow: 0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
  outline: none;
}

.help-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-left: 8px;
  transition: all 0.3s ease;
}

input[type="text"], textarea {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

input[type="text"]:focus, textarea:focus {
  border-color: var(--brand-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--brand-color-rgb), 0.15), 
              inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 32px;
}

.btn {
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn:focus {
  outline: none;
}

.btn:focus:not(:active)::after {
  animation: ripple 0.8s ease-out;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-color), var(--brand-color));
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(var(--accent-color-rgb), 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(var(--accent-color-rgb), 0.5);
}

.btn-secondary {
  background-color: var(--surface-alt-color);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--border-color);
}

.btn-danger {
  background: linear-gradient(135deg, var(--error-color), #ff3860);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(255, 56, 96, 0.3);
}

.btn-danger:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(255, 56, 96, 0.5);
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.7;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

@media (max-width: 768px) {
  .collections-view {
    padding: 15px;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .tabs {
    overflow-x: auto;
    padding-bottom: 5px;
    margin-bottom: 15px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
  }
  
  .tabs::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }
  
  .tab-btn {
    padding: 10px 16px;
    white-space: nowrap;
  }
  
  .modal {
    width: 95%;
    border-radius: 12px;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
    padding: 14px 20px;
  }
  
  /* Better touch targets on mobile */
  .checkbox-label {
    padding: 12px 0;
  }
  
  .checkbox-label input[type="checkbox"] {
    width: 24px;
    height: 24px;
  }
  
  /* Smooth scrolling for entire app on mobile */
  html, body {
    scroll-behavior: smooth;
  }
}

/* Tablet breakpoint */
@media (min-width: 769px) and (max-width: 1024px) {
  .collections-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

/* Landscape orientation on mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .form-actions {
    flex-direction: row;
  }
}
</style>
