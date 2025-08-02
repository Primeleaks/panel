<template>
  <div class="collection-card" :class="{ 'is-featured': collection.is_featured }">
    <div class="collection-header">
      <h3 class="collection-title">{{ collection.name }}</h3>
      <div class="collection-badges">
        <span v-if="collection.is_featured" class="badge badge-featured">Featured</span>
        <span v-if="collection.is_private" class="badge badge-private">Private</span>
      </div>
    </div>
    
    <div class="collection-meta">
      <div class="collection-author">
        <img v-if="collection.creator_avatar" :src="collection.creator_avatar" class="avatar" />
        <span>{{ collection.creator_name || 'Anonymous' }}</span>
      </div>
      <div class="collection-stats">
        <span>{{ collection.item_count || 0 }} scripts</span>
        <span>{{ formatDate(collection.created_at) }}</span>
      </div>
    </div>
    
    <p class="collection-description">{{ truncateDescription(collection.description) }}</p>
    
    <div class="script-previews" v-if="collection.items && collection.items.length">
      <div v-for="script in collection.items" :key="script.id" class="script-preview">
        <img :src="script.image" class="script-thumbnail" alt="Script thumbnail" />
        <div class="script-title">{{ truncate(script.title, 18) }}</div>
      </div>
      <div v-if="collection.item_count > collection.items.length" class="more-indicator">
        +{{ collection.item_count - collection.items.length }} more
      </div>
    </div>
    <div v-else class="empty-collection">
      <i class="fas fa-folder-open"></i>
      <span>No scripts in this collection</span>
    </div>
    
    <div class="collection-actions">
      <router-link :to="{ name: 'collection', params: { id: collection.id } }" class="btn btn-primary">View</router-link>
      <button v-if="canEdit" @click="$emit('edit', collection)" class="btn btn-secondary">Edit</button>
      <button v-if="isAdmin && !collection.is_featured" @click="$emit('feature', collection)" class="btn btn-feature">Feature</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CollectionCard',
  props: {
    collection: {
      type: Object,
      required: true
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    truncateDescription(description) {
      if (!description) return 'No description';
      return description.length > 100 ? description.substring(0, 97) + '...' : description;
    },
    truncate(text, length) {
      return text.length > length ? text.substring(0, length - 3) + '...' : text;
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    }
  }
};
</script>

<style scoped>
.collection-card {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.collection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.collection-card.is-featured {
  border-left: 4px solid var(--accent-color);
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.collection-title {
  margin: 0;
  font-size: 1.2rem;
}

.collection-badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 3px 8px;
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

.collection-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.collection-author {
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

.collection-stats {
  display: flex;
  gap: 12px;
}

.collection-description {
  margin: 12px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.script-previews {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  margin: 15px 0;
}

.script-preview {
  position: relative;
  width: 100%;
}

.script-thumbnail {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.script-title {
  font-size: 0.75rem;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  background-color: rgba(0,0,0,0.1);
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.empty-collection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.empty-collection i {
  font-size: 2rem;
  margin-bottom: 8px;
}

.collection-actions {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 15px;
}

.btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: var(--accent-color);
  color: white;
  text-decoration: none;
}

.btn-secondary {
  background-color: var(--surface-alt-color);
  color: var(--text-primary);
}

.btn-feature {
  background-color: var(--success-color);
  color: white;
}

.btn:hover {
  opacity: 0.9;
}
</style>
