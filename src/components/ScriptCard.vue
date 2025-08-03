<template>
  <div class="script-card" :style="`--index: ${index}`">
    <div class="script-image-container">
      <img
          :src="script.image"
          :alt="script.title"
          class="script-image"
          @error="handleImageError"
      />
      <div class="script-overlay">
        <div class="script-category">
          <i :class="getCategoryIcon(script.category)"></i>
          <span>{{ getCategoryName(script.category) }}</span>
        </div>
      </div>
    </div>
    
    <div class="script-content">
      <div class="script-header">
        <h3 class="script-title">{{ script.title }}</h3>
        <div class="script-rating">
          <i class="fa-solid fa-star"></i>
          <span>{{ script.rating || '4.8' }}</span>
        </div>
      </div>
      
      <p class="script-description">{{ script.description }}</p>
      
      <div class="script-tags" v-if="script.tags && script.tags.length">
        <span v-for="tag in script.tags.slice(0, 3)" :key="tag" class="tag">
          {{ tag }}
        </span>
      </div>
      
      <div class="script-footer">
        <div class="script-meta">
          <div class="author-info">
            <div class="author-avatar">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="author-details">
              <span class="author-name">{{ script.author }}</span>
              <span class="upload-date">{{ formatDate(script.date) }}</span>
            </div>
          </div>
          
          <div class="script-stats">
            <div class="stat">
              <i class="fa-solid fa-download"></i>
              <span>{{ script.downloads || 0 }}</span>
            </div>
            <div class="stat">
              <i class="fa-solid fa-eye"></i>
              <span>{{ script.views || 0 }}</span>
            </div>
          </div>
        </div>
        
        <div class="script-actions">
          <button
              class="download-btn"
              @click="$emit('download', script.downloadUrl)"
              title="Script herunterladen"
          >
            <i class="fa-solid fa-download"></i>
            <span>Download</span>
          </button>
          
          <button
              v-if="isAdmin"
              class="delete-btn"
              @click="$emit('delete', script.id)"
              title="Script löschen"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    script: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      default: 0
    },
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  emits: ['download', 'delete'],
  methods: {
    handleImageError(event) {
      event.target.src = 'https://cdn.discordapp.com/attachments/1241131307002499135/1317850358231470134/testerbanner_leak.png?ex=67ede889&is=67ec9709&hm=973efbf736b1e8e5f6d6f9eb4fc114c20244a3fa33a52dc40908bf203de2e74a&';
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Heute';
      if (diffDays <= 7) return `vor ${diffDays} Tagen`;
      if (diffDays <= 30) return `vor ${Math.ceil(diffDays / 7)} Wochen`;
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    },
    
    getCategoryName(categoryId) {
      const categories = {
        'all': 'Alle Scripts',
        'user': 'User Leaks',
        'full': 'Full Server',
        'scripts': 'Scripts',
        'crimelife': 'Crimelife',
        'hud': 'HUD',
        'loading': 'Loading',
        'anticheat': 'Anticheat',
        'design': 'Design',
        'dumps': 'Dumps',
        'bots': 'Bots',
        'tools': 'Tools'
      };
      return categories[categoryId] || 'Unbekannt';
    },
    
    getCategoryIcon(categoryId) {
      const icons = {
        'all': 'fa-solid fa-layer-group',
        'user': 'fa-solid fa-user-secret',
        'full': 'fa-solid fa-server',
        'scripts': 'fa-solid fa-file-code',
        'crimelife': 'fa-solid fa-skull',
        'hud': 'fa-solid fa-desktop',
        'loading': 'fa-solid fa-spinner',
        'anticheat': 'fa-solid fa-shield-halved',
        'design': 'fa-solid fa-paint-brush',
        'dumps': 'fa-solid fa-database',
        'bots': 'fa-solid fa-robot',
        'tools': 'fa-solid fa-wrench'
      };
      return icons[categoryId] || 'fa-solid fa-file';
    }
  }
};
</script>

<style scoped>
/* Modern Script Card Styles */
.script-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: calc(var(--index, 0) * 0.1s);
  backdrop-filter: blur(10px);
}

.script-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.3), rgba(249, 115, 22, 0.3));
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: xor;
  -webkit-mask-composite: xor;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.script-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border-color: rgba(14, 165, 233, 0.3);
}

.script-card:hover::before {
  opacity: 1;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.script-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(249, 115, 22, 0.1));
}

.script-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.script-card:hover .script-image {
  transform: scale(1.1);
}

.script-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.8) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 1rem;
}

.script-category {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.script-category i {
  color: #0ea5e9;
}

.script-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.script-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.script-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
  margin: 0;
}

.script-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(249, 115, 22, 0.2);
  border-radius: 6px;
  color: #f97316;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.script-rating i {
  font-size: 0.75rem;
}

.script-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.script-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.25rem 0.75rem;
  background: rgba(14, 165, 233, 0.2);
  color: #0ea5e9;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(14, 165, 233, 0.3);
}

.script-footer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.script-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.author-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.upload-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.script-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  font-weight: 500;
}

.stat i {
  color: #0ea5e9;
}

.script-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.download-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.download-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.download-btn:hover {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
}

.download-btn:hover::before {
  left: 100%;
}

.delete-btn {
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15));
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.delete-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.delete-btn:hover {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.25));
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.delete-btn:hover::before {
  left: 100%;
}

/* Responsive Design */
@media (max-width: 768px) {
  .script-content {
    padding: 1rem;
  }
  
  .script-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .script-rating {
    align-self: flex-end;
  }
  
  .script-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .script-stats {
    align-self: flex-end;
  }
  
  .script-actions {
    flex-direction: column;
  }
  
  .download-btn {
    padding: 1rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .script-image-container {
    height: 160px;
  }
  
  .script-overlay {
    padding: 0.75rem;
  }
  
  .script-category {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
  
  .script-title {
    font-size: 1.125rem;
  }
  
  .script-description {
    font-size: 0.8125rem;
  }
  
  .author-info {
    gap: 0.5rem;
  }
  
  .author-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
}
</style>