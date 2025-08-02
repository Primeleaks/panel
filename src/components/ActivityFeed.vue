<template>
  <div class="activity-feed">
    <div class="activity-header">
      <h3>Activity Feed</h3>
      <div class="feed-filters">
        <button 
          v-for="filter in feedFilters" 
          :key="filter.id" 
          :class="['filter-btn', { active: currentFilter === filter.id }]"
          @click="setFilter(filter.id)"
        >
          {{ filter.name }}
        </button>
      </div>
    </div>

    <div class="activity-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading activities...</p>
      </div>
      
      <div v-else-if="activities.length === 0" class="empty-state">
        <i class="fas fa-stream"></i>
        <p v-if="currentFilter === 'all'">No recent activity found</p>
        <p v-else-if="currentFilter === 'following'">No activity from users you follow</p>
        <p v-else>No {{ currentFilter }} activity found</p>
        
        <button v-if="currentFilter === 'following' && !followingAnyUsers" 
                @click="navigateToUsers" 
                class="action-btn">
          Find users to follow
        </button>
      </div>
      
      <div v-else class="activity-list">
        <div v-for="(activity, index) in activities" 
             :key="activity.id" 
             class="activity-item">
          <div class="activity-time">
            <time :datetime="activity.created_at" :title="formatDateFull(activity.created_at)">
              {{ formatTimeAgo(activity.created_at) }}
            </time>
          </div>
          
          <div class="activity-avatar">
            <img 
              :src="activity.user_avatar || '/default-avatar.png'" 
              :alt="activity.username" 
              @click="navigateToProfile(activity.user_id)" 
            />
            <div class="activity-icon" :class="getActivityIconClass(activity.type)">
              <i :class="getActivityIcon(activity.type)"></i>
            </div>
          </div>
          
          <div class="activity-details">
            <div class="activity-header">
              <span class="activity-user" @click="navigateToProfile(activity.user_id)">
                {{ activity.username }}
              </span>
              <span class="activity-action">{{ getActivityAction(activity) }}</span>
            </div>
            
            <div class="activity-target" @click="navigateToTarget(activity)">
              <div v-if="activity.script_id" class="script-preview">
                <img 
                  v-if="activity.script_image" 
                  :src="activity.script_image" 
                  :alt="activity.script_title" 
                  class="script-image"
                  @error="handleImageError"
                />
                <div class="script-info">
                  <h4>{{ activity.script_title }}</h4>
                  <p v-if="activity.script_description" class="script-description">
                    {{ truncateText(activity.script_description, 100) }}
                  </p>
                </div>
              </div>
              
              <div v-if="activity.comment" class="comment-preview">
                <blockquote>{{ truncateText(activity.comment, 150) }}</blockquote>
              </div>
              
              <div v-if="activity.collection_id" class="collection-preview">
                <div class="collection-icon">
                  <i class="fas fa-folder"></i>
                </div>
                <div class="collection-info">
                  <h4>{{ activity.collection_name }}</h4>
                  <p v-if="activity.collection_description" class="collection-description">
                    {{ truncateText(activity.collection_description, 100) }}
                  </p>
                </div>
              </div>
              
              <div v-if="activity.type === 'follow'" class="follow-preview">
                <div class="follow-message">
                  started following 
                  <span class="target-user" @click.stop="navigateToProfile(activity.target_user_id)">
                    {{ activity.target_username }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="activity-meta">
              <div class="activity-stats">
                <span v-if="activity.likes_count" class="meta-stat">
                  <i class="fas fa-heart"></i> {{ activity.likes_count }}
                </span>
                <span v-if="activity.comments_count" class="meta-stat">
                  <i class="fas fa-comment"></i> {{ activity.comments_count }}
                </span>
                <span v-if="activity.rating" class="meta-stat">
                  <i class="fas fa-star"></i> {{ activity.rating }}
                </span>
              </div>
              
              <div class="activity-actions">
                <button @click="likeActivity(activity)" class="action-btn">
                  <i :class="['fas', 'fa-heart', { active: activity.liked_by_user }]"></i>
                </button>
                <button @click="navigateToComments(activity)" class="action-btn">
                  <i class="fas fa-comment"></i>
                </button>
                <button @click="shareActivity(activity)" class="action-btn">
                  <i class="fas fa-share"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="hasMoreActivities" class="load-more">
          <button @click="loadMoreActivities" class="load-more-btn" :disabled="loadingMore">
            <span v-if="loadingMore">
              <i class="fas fa-spinner fa-spin"></i> Loading...
            </span>
            <span v-else>Load More</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  props: {
    userId: {
      type: String,
      default: null // If null, shows general feed or follows based on currentFilter
    },
    initialFilter: {
      type: String,
      default: 'all'
    },
    limit: {
      type: Number,
      default: 10
    }
  },
  
  setup(props) {
    const router = useRouter();
    const activities = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const page = ref(1);
    const hasMoreActivities = ref(true);
    const currentFilter = ref(props.initialFilter);
    const followingAnyUsers = ref(true); // Will be checked on mount
    
    const feedFilters = [
      { id: 'all', name: 'All Activity' },
      { id: 'following', name: 'Following' },
      { id: 'scripts', name: 'Scripts' },
      { id: 'comments', name: 'Comments' },
      { id: 'ratings', name: 'Ratings' },
      { id: 'collections', name: 'Collections' }
    ];
    
    // Methods
    const fetchActivities = async (resetPage = true) => {
      try {
        if (resetPage) {
          page.value = 1;
          loading.value = true;
          activities.value = [];
        } else {
          loadingMore.value = true;
        }
        
        const endpoint = props.userId 
          ? `/api/users/${props.userId}/activities` 
          : '/api/activities';
        
        const params = {
          filter: currentFilter.value,
          page: page.value,
          limit: props.limit
        };
        
        const response = await axios.get(endpoint, { params });
        
        // Ensure that response.data.activities exists before using it
        const responseActivities = response.data?.activities || [];

        if (resetPage) {
          activities.value = responseActivities;
        } else {
          activities.value = [...activities.value, ...responseActivities];
        }
        
        hasMoreActivities.value = responseActivities.length === props.limit;

        // Check if user follows anyone (only for following filter)
        if (currentFilter.value === 'following' && activities.value.length === 0) {
          const followingCheck = await axios.get('/api/user/following/count');
          followingAnyUsers.value = followingCheck.data.count > 0;
        }
        
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };
    
    const loadMoreActivities = () => {
      if (loadingMore.value || !hasMoreActivities.value) return;
      
      page.value++;
      fetchActivities(false);
    };
    
    const setFilter = (filter) => {
      if (currentFilter.value === filter) return;
      
      currentFilter.value = filter;
      fetchActivities();
    };
    
    const getActivityIcon = (type) => {
      const icons = {
        'script_upload': 'fa-file-code',
        'script_update': 'fa-sync-alt',
        'script_favorite': 'fa-bookmark',
        'comment': 'fa-comment',
        'rating': 'fa-star',
        'collection_create': 'fa-folder-plus',
        'collection_update': 'fa-folder',
        'collection_add': 'fa-file-import',
        'follow': 'fa-user-plus'
      };
      
      return `fas ${icons[type] || 'fa-bell'}`;
    };
    
    const getActivityIconClass = (type) => {
      const classes = {
        'script_upload': 'icon-script',
        'script_update': 'icon-update',
        'script_favorite': 'icon-favorite',
        'comment': 'icon-comment',
        'rating': 'icon-rating',
        'collection_create': 'icon-collection',
        'collection_update': 'icon-collection',
        'collection_add': 'icon-collection',
        'follow': 'icon-follow'
      };
      
      return classes[type] || '';
    };
    
    const getActivityAction = (activity) => {
      const actions = {
        'script_upload': 'uploaded a new script',
        'script_update': 'updated their script',
        'script_favorite': 'favorited a script',
        'comment': 'commented on',
        'rating': 'rated',
        'collection_create': 'created a new collection',
        'collection_update': 'updated a collection',
        'collection_add': 'added a script to',
        'follow': 'started following'
      };
      
      return actions[activity.type] || 'performed an action';
    };
    
    const navigateToProfile = (userId) => {
      if (!userId) return;
      router.push(`/profile/${userId}`);
    };
    
    const navigateToTarget = (activity) => {
      if (activity.script_id) {
        router.push(`/script/${activity.script_id}`);
      } else if (activity.collection_id) {
        router.push(`/collection/${activity.collection_id}`);
      } else if (activity.type === 'follow' && activity.target_user_id) {
        router.push(`/profile/${activity.target_user_id}`);
      }
    };
    
    const navigateToComments = (activity) => {
      if (activity.script_id) {
        router.push(`/script/${activity.script_id}?showComments=true`);
      }
    };
    
    const navigateToUsers = () => {
      router.push('/users/popular');
    };
    
    const likeActivity = async (activity) => {
      try {
        if (activity.liked_by_user) {
          await axios.delete(`/api/activities/${activity.id}/like`);
          activity.liked_by_user = false;
          activity.likes_count = Math.max(0, (activity.likes_count || 1) - 1);
        } else {
          await axios.post(`/api/activities/${activity.id}/like`);
          activity.liked_by_user = true;
          activity.likes_count = (activity.likes_count || 0) + 1;
        }
      } catch (error) {
        console.error('Error toggling activity like:', error);
      }
    };
    
    const shareActivity = (activity) => {
      // Construct share URL based on activity type
      let shareUrl = window.location.origin;
      
      if (activity.script_id) {
        shareUrl += `/script/${activity.script_id}`;
      } else if (activity.collection_id) {
        shareUrl += `/collection/${activity.collection_id}`;
      } else if (activity.type === 'follow' && activity.target_user_id) {
        shareUrl += `/profile/${activity.target_user_id}`;
      } else {
        shareUrl += `/profile/${activity.user_id}`;
      }
      
      // Use Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: `Check out this activity from ${activity.username}`,
          text: getActivityAction(activity),
          url: shareUrl
        }).catch(error => console.warn('Error sharing:', error));
      } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareUrl)
          .then(() => alert('Link copied to clipboard!'))
          .catch(() => {
            // Manual fallback
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Link copied to clipboard!');
          });
      }
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength 
        ? text.substring(0, maxLength) + '...' 
        : text;
    };
    
    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffSecs < 60) {
        return 'just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return formatDate(dateString);
      }
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };
    
    const formatDateFull = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, { 
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const handleImageError = (event) => {
      event.target.src = '/default-script-image.png';
    };
    
    // Watch for changes in filter or userId
    watch(() => props.userId, () => {
      fetchActivities();
    });
    
    watch(() => props.initialFilter, (newFilter) => {
      currentFilter.value = newFilter;
      fetchActivities();
    });
    
    // Initialize
    onMounted(() => {
      fetchActivities();
    });
    
    return {
      activities,
      loading,
      loadingMore,
      currentFilter,
      feedFilters,
      hasMoreActivities,
      followingAnyUsers,
      setFilter,
      loadMoreActivities,
      getActivityIcon,
      getActivityIconClass,
      getActivityAction,
      navigateToProfile,
      navigateToTarget,
      navigateToComments,
      navigateToUsers,
      likeActivity,
      shareActivity,
      truncateText,
      formatTimeAgo,
      formatDate,
      formatDateFull,
      handleImageError
    };
  }
};
</script>

<style scoped>
.activity-feed {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.activity-header {
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.activity-header h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: var(--text-color);
}

.feed-filters {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.filter-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background-color: var(--card-bg-alt);
  color: var(--text-color);
}

.filter-btn.active {
  background-color: rgba(var(--primary-color-rgb), 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.activity-content {
  min-height: 300px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(var(--primary-color-rgb), 0.3);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
  text-align: center;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin-bottom: 1.5rem;
}

.action-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background-color: var(--primary-color-dark);
}

.activity-list {
  padding: 1rem;
}

.activity-item {
  position: relative;
  display: flex;
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-time {
  position: absolute;
  top: 1.5rem;
  right: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.activity-avatar {
  position: relative;
  margin-right: 1rem;
}

.activity-avatar img {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid var(--card-bg);
}

.activity-icon {
  position: absolute;
  bottom: -0.25rem;
  right: -0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.activity-icon.icon-script {
  background-color: #4CAF50;
}

.activity-icon.icon-update {
  background-color: #2196F3;
}

.activity-icon.icon-comment {
  background-color: #FF9800;
}

.activity-icon.icon-rating {
  background-color: #FFC107;
}

.activity-icon.icon-favorite {
  background-color: #F44336;
}

.activity-icon.icon-collection {
  background-color: #9C27B0;
}

.activity-icon.icon-follow {
  background-color: #00BCD4;
}

.activity-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-header {
  border-bottom: none;
  padding: 0;
}

.activity-user {
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
}

.activity-user:hover {
  text-decoration: underline;
}

.activity-action {
  color: var(--text-secondary);
  margin-left: 0.25rem;
}

.activity-target {
  cursor: pointer;
  transition: all 0.2s ease;
}

.script-preview, .collection-preview {
  display: flex;
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  height: 100px;
}

.script-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.script-info, .collection-info {
  flex: 1;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
}

.script-info h4, .collection-info h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.script-description, .collection-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.collection-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  background-color: rgba(156, 39, 176, 0.1);
  color: #9C27B0;
  font-size: 2rem;
}

.comment-preview {
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 0.75rem;
}

.comment-preview blockquote {
  margin: 0;
  font-style: italic;
  color: var(--text-color);
  border-left: 3px solid var(--border-color);
  padding-left: 0.75rem;
}

.follow-preview {
  background-color: var(--card-bg-alt);
  border-radius: var(--border-radius-sm);
  padding: 0.75rem;
}

.follow-message {
  color: var(--text-secondary);
}

.target-user {
  font-weight: 600;
  color: var(--text-color);
}

.target-user:hover {
  text-decoration: underline;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.activity-stats {
  display: flex;
  gap: 1rem;
}

.meta-stat {
  color: var(--text-secondary);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.activity-actions {
  display: flex;
  gap: 1rem;
}

.activity-actions .action-btn {
  background: none;
  color: var(--text-secondary);
  padding: 0.375rem;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.activity-actions .action-btn:hover {
  background-color: var(--card-bg-alt);
  color: var(--text-color);
}

.activity-actions .action-btn i.active {
  color: #F44336;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0 0.5rem;
}

.load-more-btn {
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-color);
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background-color: var(--card-bg-alt);
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .activity-time {
    position: static;
    display: block;
    margin-bottom: 0.5rem;
  }
  
  .script-preview, .collection-preview {
    flex-direction: column;
    height: auto;
  }
  
  .script-image {
    width: 100%;
    height: 150px;
  }
  
  .collection-icon {
    width: 100%;
    padding: 1.5rem 0;
  }
  
  .activity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .feed-filters {
    padding-bottom: 0.5rem;
    margin: 0 -0.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>
