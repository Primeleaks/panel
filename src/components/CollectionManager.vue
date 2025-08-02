<template>
  <div class="collection-manager">
    <!-- Collections Header -->
    <div class="collections-header">
      <h2>My Collections</h2>
      <button @click="showCreateForm = true" class="create-btn">
        <i class="fas fa-plus"></i>
        Create Collection
      </button>
    </div>

    <!-- Create/Edit Collection Form -->
    <div v-if="showCreateForm || editingCollection" class="collection-form">
      <div class="form-overlay" @click="closeForm"></div>
      <div class="form-modal">
        <h3>{{ editingCollection ? 'Edit Collection' : 'Create New Collection' }}</h3>
        
        <form @submit.prevent="saveCollection">
          <div class="form-group">
            <label for="collection-name">Collection Name</label>
            <input 
              id="collection-name"
              v-model="formData.name" 
              type="text" 
              required
              maxlength="100"
              placeholder="Enter collection name..."
            >
          </div>

          <div class="form-group">
            <label for="collection-description">Description (Optional)</label>
            <textarea 
              id="collection-description"
              v-model="formData.description"
              rows="3"
              maxlength="500"
              placeholder="Describe your collection..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formData.is_public"
              >
              <span class="checkmark"></span>
              Make this collection public
            </label>
            <small>Public collections can be viewed by other users</small>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeForm" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="save-btn">
              {{ saving ? 'Saving...' : (editingCollection ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Collections Grid -->
    <div class="collections-grid" v-if="collections.length > 0">
      <div 
        v-for="collection in collections" 
        :key="collection.id" 
        class="collection-card"
        @click="viewCollection(collection)"
      >
        <div class="collection-header">
          <h3>{{ collection.name }}</h3>
          <div class="collection-meta">
            <span class="script-count">{{ collection.script_count || 0 }} scripts</span>
            <span v-if="!collection.is_public" class="private-badge">Private</span>
          </div>
        </div>

        <div class="collection-description" v-if="collection.description">
          <p>{{ collection.description }}</p>
        </div>

        <div class="collection-preview" v-if="collection.preview_scripts">
          <div class="preview-scripts">
            <div 
              v-for="script in collection.preview_scripts.slice(0, 3)" 
              :key="script.id"
              class="preview-script"
            >
              <span>{{ script.title }}</span>
            </div>
          </div>
        </div>

        <div class="collection-actions" @click.stop>
          <button @click="editCollection(collection)" class="edit-btn">
            <i class="fas fa-edit"></i>
          </button>
          <button @click="deleteCollection(collection.id)" class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
          <button @click="shareCollection(collection)" class="share-btn">
            <i class="fas fa-share"></i>
          </button>
        </div>

        <div class="collection-footer">
          <span class="collection-date">
            Created {{ formatDate(collection.created_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="empty-state">
      <i class="fas fa-folder-open"></i>
      <h3>No Collections Yet</h3>
      <p>Create your first collection to organize your favorite scripts</p>
      <button @click="showCreateForm = true" class="create-first-btn">
        Create Your First Collection
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading collections...</p>
    </div>

    <!-- Collection Detail Modal -->
    <div v-if="selectedCollection" class="collection-detail-modal">
      <div class="modal-overlay" @click="closeCollectionDetail"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ selectedCollection.name }}</h2>
          <button @click="closeCollectionDetail" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="collection-info">
            <p v-if="selectedCollection.description">{{ selectedCollection.description }}</p>
            <div class="collection-stats">
              <span>{{ selectedCollection.script_count || 0 }} scripts</span>
              <span>{{ selectedCollection.is_public ? 'Public' : 'Private' }}</span>
              <span>Created {{ formatDate(selectedCollection.created_at) }}</span>
            </div>
          </div>

          <div class="collection-scripts" v-if="collectionScripts.length > 0">
            <h3>Scripts in this collection</h3>
            <div class="scripts-list">
              <div 
                v-for="script in collectionScripts" 
                :key="script.id"
                class="script-item"
              >
                <div class="script-info">
                  <h4>{{ script.title }}</h4>
                  <p>{{ script.description }}</p>
                  <div class="script-meta">
                    <span>{{ script.downloads || 0 }} downloads</span>
                    <span>{{ script.rating ? parseFloat(script.rating).toFixed(1) : '0.0' }} ★</span>
                  </div>
                </div>
                <div class="script-actions">
                  <button @click="viewScript(script.id)" class="view-btn">
                    View
                  </button>
                  <button @click="removeFromCollection(script.id)" class="remove-btn">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-collection">
            <p>This collection is empty. Start adding scripts to organize them!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to Collection Modal -->
    <div v-if="showAddToCollection" class="add-to-collection-modal">
      <div class="modal-overlay" @click="showAddToCollection = false"></div>
      <div class="modal-content">
        <h3>Add to Collection</h3>
        <div class="collections-list">
          <div 
            v-for="collection in collections" 
            :key="collection.id"
            :class="['collection-option', { selected: selectedCollections.includes(collection.id) }]"
            @click="toggleCollectionSelection(collection.id)"
          >
            <span>{{ collection.name }}</span>
            <i v-if="selectedCollections.includes(collection.id)" class="fas fa-check"></i>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showAddToCollection = false" class="cancel-btn">Cancel</button>
          <button @click="addToSelectedCollections" class="add-btn">Add to Collections</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'CollectionManager',
  props: {
    scriptId: {
      type: [Number, String],
      default: null
    }
  },
  emits: ['script-added-to-collection'],
  setup(props, { emit }) {
    const router = useRouter();
    const collections = ref([]);
    const selectedCollection = ref(null);
    const collectionScripts = ref([]);
    const showCreateForm = ref(false);
    const editingCollection = ref(null);
    const showAddToCollection = ref(false);
    const selectedCollections = ref([]);
    const loading = ref(false);
    const saving = ref(false);

    const formData = ref({
      name: '',
      description: '',
      is_public: false
    });

    const getCookie = (name) => {
      const cookies = document.cookie.split('; ');
      const cookie = cookies.find(row => row.startsWith(`${name}=`));
      return cookie ? cookie.split('=')[1] : null;
    };

    const getAuthHeaders = () => {
      const token = getCookie('token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchCollections = async () => {
      try {
        loading.value = true;
        const response = await axios.get('/api/collections', {
          headers: getAuthHeaders()
        });
        collections.value = response.data;
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        loading.value = false;
      }
    };

    const fetchCollectionScripts = async (collectionId) => {
      try {
        const response = await axios.get(`/api/collections/${collectionId}/scripts`, {
          headers: getAuthHeaders()
        });
        collectionScripts.value = response.data;
      } catch (error) {
        console.error('Error fetching collection scripts:', error);
      }
    };

    const saveCollection = async () => {
      try {
        saving.value = true;
        
        if (editingCollection.value) {
          const response = await axios.put(
            `/api/collections/${editingCollection.value.id}`,
            formData.value,
            { headers: getAuthHeaders() }
          );
          
          const index = collections.value.findIndex(c => c.id === editingCollection.value.id);
          if (index !== -1) {
            collections.value[index] = response.data;
          }
        } else {
          const response = await axios.post(
            '/api/collections',
            formData.value,
            { headers: getAuthHeaders() }
          );
          
          collections.value.unshift(response.data);
        }
        
        closeForm();
      } catch (error) {
        console.error('Error saving collection:', error);
        alert('Error saving collection. Please try again.');
      } finally {
        saving.value = false;
      }
    };

    const editCollection = (collection) => {
      editingCollection.value = collection;
      formData.value = {
        name: collection.name,
        description: collection.description || '',
        is_public: collection.is_public
      };
      showCreateForm.value = true;
    };

    const deleteCollection = async (collectionId) => {
      if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
        return;
      }

      try {
        await axios.delete(`/api/collections/${collectionId}`, {
          headers: getAuthHeaders()
        });
        
        collections.value = collections.value.filter(c => c.id !== collectionId);
      } catch (error) {
        console.error('Error deleting collection:', error);
        alert('Error deleting collection. Please try again.');
      }
    };

    const viewCollection = async (collection) => {
      selectedCollection.value = collection;
      await fetchCollectionScripts(collection.id);
    };

    const closeCollectionDetail = () => {
      selectedCollection.value = null;
      collectionScripts.value = [];
    };

    const closeForm = () => {
      showCreateForm.value = false;
      editingCollection.value = null;
      formData.value = {
        name: '',
        description: '',
        is_public: false
      };
    };

    const shareCollection = async (collection) => {
      if (!collection.is_public) {
        alert('Only public collections can be shared.');
        return;
      }

      const url = `${window.location.origin}/collection/${collection.id}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: collection.name,
            text: collection.description || 'Check out this script collection!',
            url: url
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        // Fallback to copying to clipboard
        try {
          await navigator.clipboard.writeText(url);
          alert('Collection link copied to clipboard!');
        } catch (error) {
          console.error('Error copying to clipboard:', error);
          alert(`Collection URL: ${url}`);
        }
      }
    };

    const viewScript = (scriptId) => {
      router.push(`/script/${scriptId}`);
      closeCollectionDetail();
    };

    const removeFromCollection = async (scriptId) => {
      if (!confirm('Remove this script from the collection?')) return;

      try {
        await axios.delete(
          `/api/collections/${selectedCollection.value.id}/scripts/${scriptId}`,
          { headers: getAuthHeaders() }
        );
        
        collectionScripts.value = collectionScripts.value.filter(s => s.id !== scriptId);
        
        // Update the collection's script count
        const collection = collections.value.find(c => c.id === selectedCollection.value.id);
        if (collection) {
          collection.script_count = Math.max(0, (collection.script_count || 0) - 1);
        }
        
      } catch (error) {
        console.error('Error removing script from collection:', error);
        alert('Error removing script. Please try again.');
      }
    };

    const toggleCollectionSelection = (collectionId) => {
      const index = selectedCollections.value.indexOf(collectionId);
      if (index > -1) {
        selectedCollections.value.splice(index, 1);
      } else {
        selectedCollections.value.push(collectionId);
      }
    };

    const addToSelectedCollections = async () => {
      if (!props.scriptId || selectedCollections.value.length === 0) return;

      try {
        const promises = selectedCollections.value.map(collectionId =>
          axios.post(
            `/api/collections/${collectionId}/scripts`,
            { script_id: props.scriptId },
            { headers: getAuthHeaders() }
          )
        );

        await Promise.all(promises);
        
        // Update collection script counts
        selectedCollections.value.forEach(collectionId => {
          const collection = collections.value.find(c => c.id === collectionId);
          if (collection) {
            collection.script_count = (collection.script_count || 0) + 1;
          }
        });

        showAddToCollection.value = false;
        selectedCollections.value = [];
        
        emit('script-added-to-collection', {
          scriptId: props.scriptId,
          collections: selectedCollections.value
        });
        
        alert('Script added to selected collections!');
        
      } catch (error) {
        console.error('Error adding to collections:', error);
        alert('Error adding script to collections. Please try again.');
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString();
    };

    // Expose method for parent components to trigger add to collection
    const openAddToCollection = () => {
      if (collections.value.length === 0) {
        alert('You need to create at least one collection first.');
        showCreateForm.value = true;
        return;
      }
      showAddToCollection.value = true;
      selectedCollections.value = [];
    };

    onMounted(() => {
      fetchCollections();
    });

    return {
      collections,
      selectedCollection,
      collectionScripts,
      showCreateForm,
      editingCollection,
      showAddToCollection,
      selectedCollections,
      loading,
      saving,
      formData,
      fetchCollections,
      saveCollection,
      editCollection,
      deleteCollection,
      viewCollection,
      closeCollectionDetail,
      closeForm,
      shareCollection,
      viewScript,
      removeFromCollection,
      toggleCollectionSelection,
      addToSelectedCollections,
      openAddToCollection,
      formatDate
    };
  }
};
</script>

<style scoped>
.collection-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.collections-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.collections-header h2 {
  margin: 0;
  color: var(--text-color);
}

.create-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.collection-form {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.form-modal {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  position: relative;
  border: 1px solid var(--border-color);
}

.form-modal h3 {
  margin: 0 0 25px 0;
  color: var(--text-color);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: 600;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text-color);
  font-family: inherit;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
}

.cancel-btn, .save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: var(--border-color);
  color: var(--text-color);
}

.save-btn {
  background: var(--primary-color);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 25px;
}

.collection-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.collection-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.collection-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.3rem;
}

.collection-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.script-count {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.private-badge {
  background: var(--warning-color);
  color: var(--text-dark);
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.collection-description p {
  margin: 0 0 15px 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.collection-preview {
  margin-bottom: 15px;
}

.preview-scripts {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.preview-script {
  background: var(--hover-bg);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: var(--text-color);
}

.collection-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.edit-btn, .delete-btn, .share-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.edit-btn:hover {
  color: var(--primary-color);
  background: var(--hover-bg);
}

.delete-btn:hover {
  color: var(--error-color);
  background: var(--hover-bg);
}

.share-btn:hover {
  color: var(--success-color);
  background: var(--hover-bg);
}

.collection-footer {
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.empty-state, .loading-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-state i, .loading-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: var(--text-color);
}

.create-first-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.create-first-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-2px);
}

.collection-detail-modal, .add-to-collection-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  color: var(--text-color);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: var(--text-color);
  background: var(--hover-bg);
}

.modal-body {
  padding: 30px;
}

.collection-info {
  margin-bottom: 30px;
}

.collection-stats {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.scripts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.script-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--hover-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.script-info h4 {
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.script-info p {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.script-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: var(--text-tertiary);
}

.script-actions {
  display: flex;
  gap: 10px;
}

.view-btn, .remove-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.view-btn {
  background: var(--primary-color);
  color: white;
}

.remove-btn {
  background: var(--error-color);
  color: white;
}

.empty-collection {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.collections-list {
  max-height: 300px;
  overflow-y: auto;
  margin: 20px 0;
}

.collection-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--hover-bg);
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collection-option:hover {
  background: var(--border-color);
}

.collection-option.selected {
  background: var(--primary-color);
  color: white;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding: 20px 30px;
  border-top: 1px solid var(--border-color);
}

.add-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

@media (max-width: 768px) {
  .collections-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .collections-grid {
    grid-template-columns: 1fr;
  }

  .form-modal, .modal-content {
    width: 95%;
    margin: 10px;
  }

  .modal-body {
    padding: 20px;
  }

  .script-item {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .script-actions {
    justify-content: center;
  }
}
</style>
