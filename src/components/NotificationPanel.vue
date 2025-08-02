<template>
  <div class="notification-panel" :class="{ open: isOpen }">
    <div class="notification-header">
      <h3>Notifications</h3>
      <div class="notification-actions">
        <button @click="markAllAsRead" class="mark-read-btn" v-if="unreadCount > 0">
          Mark all read
        </button>
        <button @click="close" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <div class="notification-content">
      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        Loading notifications...
      </div>

      <div v-else-if="notifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No notifications yet</p>
      </div>

      <div v-else class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-item', { unread: !notification.is_read }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <p class="notification-title">{{ notification.title }}</p>
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ formatDate(notification.created_at) }}</span>
          </div>
          <div class="notification-actions">
            <button 
              @click.stop="markAsRead(notification.id)" 
              v-if="!notification.is_read"
              class="mark-read-btn"
            >
              <i class="fas fa-check"></i>
            </button>
            <button 
              @click.stop="deleteNotification(notification.id)" 
              class="delete-btn"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="notification-footer" v-if="notifications.length > 0">
      <button @click="loadMore" v-if="hasMore" class="load-more-btn">
        Load more
      </button>
      <button @click="clearAll" class="clear-all-btn">
        Clear all
      </button>
    </div>
  </div>
  
  <!-- Overlay -->
  <div v-if="isOpen" class="notification-overlay" @click="close"></div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'NotificationPanel',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'unread-count'],
  setup(props, { emit }) {
    const router = useRouter();
    const notifications = ref([]);
    const loading = ref(false);
    const hasMore = ref(true);
    const page = ref(1);
    const limit = 10;

    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.is_read).length;
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

    const fetchNotifications = async (reset = false) => {
      try {
        loading.value = true;
        const currentPage = reset ? 1 : page.value;
        
        const response = await axios.get(`/api/notifications`, {
          params: { page: currentPage, limit },
          headers: getAuthHeaders()
        });

        if (reset) {
          notifications.value = response.data.notifications;
          page.value = 1;
        } else {
          notifications.value.push(...response.data.notifications);
        }
        
        hasMore.value = response.data.notifications.length === limit;
        if (!reset) page.value++;
        
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        loading.value = false;
      }
    };

    const markAsRead = async (notificationId) => {
      try {
        await axios.patch(
          `/api/notifications/${notificationId}/read`,
          {},
          { headers: getAuthHeaders() }
        );
        
        const notification = notifications.value.find(n => n.id === notificationId);
        if (notification) {
          notification.is_read = true;
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };

    const markAllAsRead = async () => {
      try {
        await axios.patch(
          '/api/notifications/read-all',
          {},
          { headers: getAuthHeaders() }
        );
        
        notifications.value.forEach(notification => {
          notification.is_read = true;
        });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    };

    const deleteNotification = async (notificationId) => {
      try {
        await axios.delete(
          `/api/notifications/${notificationId}`,
          { headers: getAuthHeaders() }
        );
        
        notifications.value = notifications.value.filter(n => n.id !== notificationId);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    };

    const clearAll = async () => {
      try {
        await axios.delete(
          '/api/notifications',
          { headers: getAuthHeaders() }
        );
        
        notifications.value = [];
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    };

    const loadMore = () => {
      if (!loading.value && hasMore.value) {
        fetchNotifications();
      }
    };

    const handleNotificationClick = async (notification) => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      // Handle navigation based on notification type
      if (notification.data) {
        try {
          const data = JSON.parse(notification.data);
          
          switch (notification.type) {
            case 'new_comment':
            case 'new_rating':
              if (data.script_id) {
                router.push(`/script/${data.script_id}`);
              }
              break;
            case 'new_follower':
              if (data.user_id) {
                router.push(`/profile/${data.user_id}`);
              }
              break;
            case 'script_featured':
              if (data.script_id) {
                router.push(`/script/${data.script_id}`);
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing notification data:', error);
        }
      }

      close();
    };

    const getNotificationIcon = (type) => {
      const icons = {
        new_comment: 'fas fa-comment',
        new_rating: 'fas fa-star',
        new_follower: 'fas fa-user-plus',
        script_featured: 'fas fa-crown',
        script_approved: 'fas fa-check-circle',
        script_rejected: 'fas fa-times-circle',
        system: 'fas fa-info-circle'
      };
      return icons[type] || 'fas fa-bell';
    };

    const formatDate = (date) => {
      const now = new Date();
      const notificationDate = new Date(date);
      const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return notificationDate.toLocaleDateString();
    };

    const close = () => {
      emit('close');
    };

    // Watch for unread count changes and emit to parent
    watch(unreadCount, (newCount) => {
      emit('unread-count', newCount);
    }, { immediate: true });

    // Watch for panel opening to fetch notifications
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        fetchNotifications(true);
      }
    });

    onMounted(() => {
      if (props.isOpen) {
        fetchNotifications(true);
      }
    });

    return {
      notifications,
      loading,
      hasMore,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      loadMore,
      handleNotificationClick,
      getNotificationIcon,
      formatDate,
      close
    };
  }
};
</script>

<style scoped>
.notification-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: var(--card-bg);
  border-left: 1px solid var(--border-color);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.notification-panel.open {
  right: 0;
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.notification-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.2rem;
}

.notification-actions {
  display: flex;
  gap: 10px;
}

.mark-read-btn, .close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.mark-read-btn:hover, .close-btn:hover {
  color: var(--text-color);
  background: var(--border-color);
}

.notification-content {
  flex: 1;
  overflow-y: auto;
}

.loading, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.notification-list {
  padding: 10px 0;
}

.notification-item {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.3s ease;
  position: relative;
}

.notification-item:hover {
  background: var(--hover-bg);
}

.notification-item.unread {
  background: rgba(74, 144, 226, 0.1);
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--primary-color);
}

.notification-icon {
  color: var(--primary-color);
  font-size: 1.1rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 5px 0;
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.notification-message {
  margin: 0 0 8px 0;
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

.notification-item .notification-actions {
  display: none;
  gap: 5px;
  flex-shrink: 0;
}

.notification-item:hover .notification-actions {
  display: flex;
}

.notification-actions button {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.notification-actions button:hover {
  color: var(--text-color);
  background: var(--border-color);
}

.delete-btn:hover {
  color: var(--error-color);
}

.notification-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
}

.load-more-btn, .clear-all-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.clear-all-btn:hover {
  background: var(--error-color);
  color: white;
  border-color: var(--error-color);
}

@media (max-width: 480px) {
  .notification-panel {
    width: 100%;
    right: -100%;
  }
  
  .notification-panel.open {
    right: 0;
  }
}
</style>
