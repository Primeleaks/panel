<template>
  <div class="search-filters">
    <div class="filters-header">
      <h3>Advanced Search</h3>
      <div class="filter-actions">
        <button 
          @click="applyFilters" 
          class="apply-btn"
          :disabled="loading"
        >
          <i class="fas fa-search"></i> Search
        </button>
        <button 
          @click="resetFilters" 
          class="reset-btn"
          :disabled="loading"
        >
          <i class="fas fa-undo"></i> Reset
        </button>
      </div>
    </div>

    <div class="filters-content">
      <div class="filter-group">
        <label for="searchQuery">Keyword Search</label>
        <div class="search-input-container">
          <input 
            id="searchQuery" 
            type="text" 
            v-model="filters.query" 
            placeholder="Search scripts..." 
            @keyup.enter="applyFilters"
          />
          <i v-if="filters.query" @click="filters.query = ''" class="fas fa-times clear-input"></i>
        </div>
      </div>
      
      <div class="filter-group">
        <label for="category">Category</label>
        <select id="category" v-model="filters.category">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label for="author">Author</label>
        <div class="search-input-container">
          <input 
            id="author" 
            type="text" 
            v-model="filters.author" 
            placeholder="Search by author..." 
          />
          <i v-if="filters.author" @click="filters.author = ''" class="fas fa-times clear-input"></i>
        </div>
      </div>
      
      <div class="filter-row">
        <div class="filter-group half">
          <label for="dateFrom">Date From</label>
          <input id="dateFrom" type="date" v-model="filters.dateFrom" />
        </div>
        
        <div class="filter-group half">
          <label for="dateTo">Date To</label>
          <input id="dateTo" type="date" v-model="filters.dateTo" />
        </div>
      </div>
      
      <div class="filter-group">
        <label for="tags">Tags</label>
        <div class="tags-input">
          <div class="selected-tags">
            <span v-for="(tag, index) in selectedTags" :key="index" class="tag">
              {{ tag }}
              <i @click="removeTag(tag)" class="fas fa-times"></i>
            </span>
          </div>
          <input 
            id="tagInput" 
            type="text" 
            v-model="tagInput" 
            placeholder="Add tags..." 
            @keydown.enter="addTag"
          />
        </div>
        <div class="popular-tags" v-if="popularTags.length > 0">
          <span>Popular:</span>
          <span 
            v-for="tag in popularTags" 
            :key="tag" 
            class="popular-tag"
            @click="addTag(tag)"
          >{{ tag }}</span>
        </div>
      </div>
      
      <div class="filter-group">
        <label for="sortBy">Sort By</label>
        <select id="sortBy" v-model="filters.sortBy">
          <option value="date">Date (Newest First)</option>
          <option value="date_asc">Date (Oldest First)</option>
          <option value="popularity">Popularity</option>
          <option value="rating">Rating</option>
          <option value="downloads">Downloads</option>
          <option value="name">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>
      
      <div class="filter-group filters-checkboxes">
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.onlyVerified" />
          <span>Only Verified Scripts</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.hasComments" />
          <span>Has Comments</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="filters.hasReviews" />
          <span>Has Reviews</span>
        </label>
      </div>

      <div class="filter-group rating-filter">
        <label>Minimum Rating</label>
        <div class="rating-filter-stars">
          <span v-for="star in 5" :key="star" 
                @click="setMinRating(star)"
                :class="{ active: filters.minRating >= star }">
            <i class="fas fa-star"></i>
          </span>
          <span class="rating-filter-clear" @click="filters.minRating = 0" v-if="filters.minRating > 0">
            Clear
          </span>
        </div>
      </div>
    </div>
    
    <div class="search-history" v-if="searchHistory.length > 0">
      <h4>Recent Searches</h4>
      <div class="history-items">
        <div 
          v-for="(search, index) in searchHistory" 
          :key="index" 
          class="history-item"
          @click="loadFromHistory(search)"
        >
          <span class="history-query">{{ search.query || 'All Scripts' }}</span>
          <span v-if="search.category" class="history-tag">Category: {{ getCategoryName(search.category) }}</span>
          <span v-if="search.author" class="history-tag">By: {{ search.author }}</span>
          <span v-if="search.tags && search.tags.length" class="history-tag">Tags: {{ search.tags.join(', ') }}</span>
        </div>
      </div>
    </div>
    
    <div class="save-search" v-if="isAuthenticated">
      <button @click="saveCurrentSearch" class="save-search-btn" :disabled="!hasActiveFilters">
        <i class="far fa-bookmark"></i> Save Search
      </button>
      
      <div v-if="savedSearches.length > 0" class="saved-searches">
        <h4>Saved Searches</h4>
        <div class="saved-search-items">
          <div 
            v-for="(search, index) in savedSearches" 
            :key="index" 
            class="saved-search-item"
          >
            <div class="saved-search-info" @click="loadFromSaved(search)">
              <span class="saved-search-name">{{ search.name }}</span>
              <span class="saved-search-query">{{ search.query || 'All Scripts' }}</span>
            </div>
            <button @click="deleteSavedSearch(search.id)" class="delete-saved-btn">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import axios from 'axios';

export default {
  props: {
    categories: {
      type: Array,
      default: () => []
    },
    initialFilters: {
      type: Object,
      default: () => ({})
    },
    isAuthenticated: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['filter-change', 'filter-applied'],
  
  setup(props, { emit }) {
    // Filter states
    const filters = reactive({
      query: '',
      category: '',
      author: '',
      dateFrom: '',
      dateTo: '',
      tags: [],
      sortBy: 'date',
      onlyVerified: false,
      hasComments: false,
      hasReviews: false,
      minRating: 0,
      ...props.initialFilters
    });
    
    const selectedTags = computed(() => filters.tags || []);
    const tagInput = ref('');
    const loading = ref(false);
    const searchHistory = ref([]);
    const savedSearches = ref([]);
    const popularTags = ref([]);
    
    // Computed
    const hasActiveFilters = computed(() => {
      return filters.query || 
             filters.category || 
             filters.author || 
             filters.dateFrom || 
             filters.dateTo || 
             (filters.tags && filters.tags.length > 0) ||
             filters.sortBy !== 'date' ||
             filters.onlyVerified || 
             filters.hasComments || 
             filters.hasReviews ||
             filters.minRating > 0;
    });
    
    // Methods
    const applyFilters = () => {
      loading.value = true;
      
      // Create a copy of the filters to emit
      const appliedFilters = { ...filters };
      
      // Add the search to history
      if (hasActiveFilters.value) {
        addToSearchHistory(appliedFilters);
      }
      
      emit('filter-applied', appliedFilters);
      
      // Simulate loading state for better UX
      setTimeout(() => {
        loading.value = false;
      }, 500);
    };
    
    const resetFilters = () => {
      Object.assign(filters, {
        query: '',
        category: '',
        author: '',
        dateFrom: '',
        dateTo: '',
        tags: [],
        sortBy: 'date',
        onlyVerified: false,
        hasComments: false,
        hasReviews: false,
        minRating: 0
      });
      
      emit('filter-change', filters);
    };
    
    const addTag = (tag) => {
      if (typeof tag === 'object' && tag.key === 'Enter') {
        tag = tagInput.value.trim();
      }
      
      if (!tag || (Array.isArray(filters.tags) && filters.tags.includes(tag))) {
        return;
      }
      
      if (!Array.isArray(filters.tags)) {
        filters.tags = [];
      }
      
      filters.tags.push(tag);
      tagInput.value = '';
      
      emit('filter-change', filters);
    };
    
    const removeTag = (tag) => {
      if (Array.isArray(filters.tags)) {
        filters.tags = filters.tags.filter(t => t !== tag);
        emit('filter-change', filters);
      }
    };
    
    const setMinRating = (rating) => {
      filters.minRating = rating;
      emit('filter-change', filters);
    };
    
    const getCategoryName = (categoryId) => {
      const category = props.categories.find(c => c.id === categoryId);
      return category ? category.name : categoryId;
    };
    
    // Search history
    const addToSearchHistory = (searchFilters) => {
      // Limit history to last 5 searches
      if (searchHistory.value.length >= 5) {
        searchHistory.value.pop();
      }
      
      // Add to the beginning
      searchHistory.value.unshift({
        query: searchFilters.query,
        category: searchFilters.category,
        author: searchFilters.author,
        tags: searchFilters.tags,
        timestamp: new Date().toISOString()
      });
      
      // Save to local storage
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
    };
    
    const loadFromHistory = (historyItem) => {
      Object.assign(filters, {
        query: historyItem.query || '',
        category: historyItem.category || '',
        author: historyItem.author || '',
        tags: historyItem.tags || [],
      });
      
      applyFilters();
    };
    
    // Saved searches (if authenticated)
    const fetchSavedSearches = async () => {
      if (!props.isAuthenticated) return;
      
      try {
        const response = await axios.get('/api/user/saved-searches');
        savedSearches.value = response.data.savedSearches || [];
      } catch (error) {
        console.error('Error fetching saved searches:', error);
      }
    };
    
    const saveCurrentSearch = async () => {
      if (!props.isAuthenticated || !hasActiveFilters.value) return;
      
      // Prompt for a name
      const searchName = prompt('Name this search:', filters.query || 'My Search');
      if (!searchName) return;
      
      try {
        const response = await axios.post('/api/user/saved-searches', {
          name: searchName,
          filters: { ...filters }
        });
        
        if (response.data.savedSearch) {
          savedSearches.value.unshift(response.data.savedSearch);
        }
      } catch (error) {
        console.error('Error saving search:', error);
        alert('Failed to save search. Please try again.');
      }
    };
    
    const loadFromSaved = (savedSearch) => {
      Object.assign(filters, savedSearch.filters);
      applyFilters();
    };
    
    const deleteSavedSearch = async (searchId) => {
      if (!confirm('Are you sure you want to delete this saved search?')) return;
      
      try {
        await axios.delete(`/api/user/saved-searches/${searchId}`);
        savedSearches.value = savedSearches.value.filter(search => search.id !== searchId);
      } catch (error) {
        console.error('Error deleting saved search:', error);
        alert('Failed to delete saved search. Please try again.');
      }
    };
    
    // Popular tags
    const fetchPopularTags = async () => {
      try {
        const response = await axios.get('/api/scripts/popular-tags');
        popularTags.value = response.data.tags || [];
      } catch (error) {
        console.error('Error fetching popular tags:', error);
      }
    };
    
    // Watch for changes in filters
    watch(filters, (newFilters) => {
      emit('filter-change', newFilters);
    }, { deep: true });
    
    onMounted(() => {
      // Load search history from localStorage
      const storedHistory = localStorage.getItem('searchHistory');
      if (storedHistory) {
        try {
          searchHistory.value = JSON.parse(storedHistory);
        } catch (e) {
          searchHistory.value = [];
        }
      }
      
      // Fetch saved searches if authenticated
      if (props.isAuthenticated) {
        fetchSavedSearches();
      }
      
      // Fetch popular tags
      fetchPopularTags();
    });
    
    return {
      filters,
      selectedTags,
      tagInput,
      loading,
      searchHistory,
      savedSearches,
      popularTags,
      hasActiveFilters,
      applyFilters,
      resetFilters,
      addTag,
      removeTag,
      setMinRating,
      getCategoryName,
      loadFromHistory,
      saveCurrentSearch,
      loadFromSaved,
      deleteSavedSearch
    };
  }
};
</script>

<style scoped>
.search-filters {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.filters-header h3 {
  font-size: 1.25rem;
  margin: 0;
  color: var(--text-color);
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

.apply-btn, .reset-btn {
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.apply-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.apply-btn:hover:not(:disabled) {
  background-color: var(--primary-color-dark);
}

.reset-btn {
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.reset-btn:hover:not(:disabled) {
  background-color: var(--card-bg-alt);
}

.apply-btn:disabled, .reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-row {
  display: flex;
  gap: 1rem;
}

.filter-group.half {
  flex: 1;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
}

.search-input-container {
  position: relative;
}

input[type="text"], input[type="date"], select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-color);
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

input[type="text"]:focus, input[type="date"]:focus, select:focus {
  border-color: var(--primary-color);
  outline: none;
}

.clear-input {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  cursor: pointer;
}

.clear-input:hover {
  color: var(--text-color);
}

.tags-input {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background-color: var(--input-bg);
  padding: 0.5rem;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tag {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tag i {
  cursor: pointer;
  opacity: 0.7;
}

.tag i:hover {
  opacity: 1;
}

.tags-input input {
  border: none;
  padding: 0.375rem 0.5rem;
  background: transparent;
}

.tags-input input:focus {
  outline: none;
}

.popular-tags {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.popular-tag {
  background-color: var(--card-bg-alt);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.popular-tag:hover {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  color: var(--primary-color);
}

.filters-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--text-color);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary-color);
}

.rating-filter-stars {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-filter-stars span {
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.rating-filter-stars span.active {
  color: var(--star-color, #FFB400);
}

.rating-filter-stars span:hover {
  color: var(--star-color, #FFB400);
}

.rating-filter-clear {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.rating-filter-clear:hover {
  text-decoration: underline;
}

.search-history {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.search-history h4, .saved-searches h4 {
  font-size: 1rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.history-item:hover {
  background-color: rgba(var(--primary-color-rgb), 0.05);
}

.history-query {
  font-weight: 500;
  color: var(--text-color);
}

.history-tag {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background-color: var(--card-bg);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
}

.save-search {
  margin-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.save-search-btn {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-sm);
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.save-search-btn:hover:not(:disabled) {
  background-color: rgba(var(--primary-color-rgb), 0.05);
}

.save-search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.saved-searches {
  margin-top: 1.5rem;
}

.saved-search-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.saved-search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 0.75rem 1rem;
}

.saved-search-info {
  flex: 1;
  cursor: pointer;
}

.saved-search-name {
  font-weight: 500;
  color: var(--text-color);
  display: block;
  margin-bottom: 0.25rem;
}

.saved-search-query {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.delete-saved-btn {
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  padding: 0.5rem;
  opacity: 0.7;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.delete-saved-btn:hover {
  opacity: 1;
  background-color: rgba(var(--danger-color-rgb), 0.1);
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .apply-btn, .reset-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
