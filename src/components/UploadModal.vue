<template>
  <div v-if="isOpen" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="modal-title-section">
          <div class="modal-icon">
            <i class="fa-solid fa-upload"></i>
          </div>
          <div class="modal-title-text">
            <h2 class="modal-title">{{ isAdmin ? 'Admin Upload' : 'Script hochladen' }}</h2>
            <p class="modal-subtitle">{{ isAdmin ? 'Erstelle einen neuen Beitrag' : 'Teile dein Script mit der Community' }}</p>
          </div>
        </div>
        <button class="modal-close-btn" @click="onClose" title="Schließen">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="error-alert">
          <i class="fa-solid fa-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="upload-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                <i class="fa-solid fa-heading"></i>
                Titel
              </label>
              <input
                  type="text"
                  v-model="title"
                  required
                  placeholder="Name des Scripts"
                  class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                <i class="fa-solid fa-align-left"></i>
                Beschreibung
              </label>
              <textarea
                  v-model="description"
                  required
                  placeholder="Beschreibe das Script..."
                  class="form-textarea"
                  rows="4"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" v-if="isAdmin">
              <label class="form-label">
                <i class="fa-solid fa-tags"></i>
                Kategorie
              </label>
              <div class="select-wrapper">
                <select v-model="category" required class="form-select">
                  <option value="" disabled>Kategorie auswählen</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
                <i class="fa-solid fa-chevron-down select-icon"></i>
              </div>
            </div>
            <div class="form-group" v-else>
              <label class="form-label">
                <i class="fa-solid fa-tags"></i>
                Kategorie
              </label>
              <input
                  type="text"
                  value="User-Leaks"
                  disabled
                  class="form-input form-input-disabled"
              />
              <div class="form-help">
                <i class="fa-solid fa-info-circle"></i>
                <span>Normale User können nur in User-Leaks posten</span>
              </div>
            </div>
          </div>

          <div class="form-row form-row-split">
            <div class="form-group">
              <label class="form-label">
                <i class="fa-solid fa-image"></i>
                Bild Link
              </label>
              <input
                  type="url"
                  v-model="image"
                  required
                  placeholder="https://example.com/image.png"
                  class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">
                <i class="fa-solid fa-download"></i>
                Download Link
              </label>
              <input
                  type="url"
                  v-model="downloadUrl"
                  required
                  placeholder="https://example.com/script.lua"
                  class="form-input"
              />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="onClose" class="btn-secondary">
              <i class="fa-solid fa-xmark"></i>
              <span>Abbrechen</span>
            </button>
            <button type="submit" :disabled="uploading" class="btn-primary">
              <i class="fa-solid fa-spinner fa-spin" v-if="uploading"></i>
              <i class="fa-solid fa-upload" v-else></i>
              <span>{{ uploading ? 'Wird hochgeladen...' : 'Hochladen' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    onClose: {
      type: Function,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
    },
    onUploadSuccess: {
      type: Function,
      default: null,
    },
    categories: {
      type: Array,
      required: true,
    },
    user: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      title: '',
      description: '',
      category: '',
      image: '',
      downloadUrl: '',
      uploading: false,
      error: '',
    };
  },
  methods: {
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.onClose();
      }
    },
    
    getCookie(cookieName) {
      const cookies = document.cookie.split("; ");
      const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
      return cookie ? cookie.split("=")[1] : null;
    },
    
    formatImageUrl(url) {
      try {
        if (url.includes('discord.com/attachments/') || url.includes('cdn.discordapp.com/attachments/')) {
          return url;
        }
        else if (url.includes('imgur.com')) {
          url = url.replace('/a/', '/');
          const matches = url.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)/);
          const imgurId = matches?.[1];

          if (!imgurId) {
            throw new Error('Ungültige Bild-URL');
          }

          return `https://i.imgur.com/${imgurId}.png`;
        } else {
          return url; // Allow other valid URLs
        }
      } catch (error) {
        throw new Error('Ungültige Bild-URL. Bitte verwende einen gültigen Link.');
      }
    },
    
    async handleSubmit() {
      this.uploading = true;
      this.error = '';

      try {
        if (!this.image) {
          throw new Error('Bitte füge einen Bild-Link ein');
        }

        const token = this.getCookie("token");
        const userId = this.user.discord_id;
        const username = this.user.username;

        if (!token || !userId) {
          throw new Error('Nicht eingeloggt. Bitte neu anmelden.');
        }

        const formattedImageUrl = this.formatImageUrl(this.image);
        let endpoint = '/api/scripts/create';
        if (!this.isAdmin) {
          endpoint = '/api/scripts/createuserscript';
        }

        const apiToken = this.getCookie("token")

        const response = await fetch(`http://localhost:3001${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            data: {
              title: this.title,
              description: this.description,
              category: this.isAdmin ? this.category : 'user',
              imgurLink: formattedImageUrl,
              downloadLink: this.downloadUrl,
              authorId: userId,
              author: username,
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Upload fehlgeschlagen (${response.status})`);
        }

        // Reset form
        this.title = '';
        this.description = '';
        this.image = '';
        this.downloadUrl = '';
        this.category = '';

        if (this.onUploadSuccess) {
          await this.onUploadSuccess();
        }
        this.onClose();
      } catch (error) {
        console.error('Upload error:', error);
        this.error = error.message || 'Upload fehlgeschlagen';
      } finally {
        this.uploading = false;
      }
    },
  },
};
</script>

<style scoped>
/* Modern Upload Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.modal-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);
}

.modal-title-text {
  flex: 1;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.25rem 0;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.modal-close-btn {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  transform: scale(1.05);
}

.modal-body {
  padding: 1rem 2rem 2rem;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.form-label i {
  color: #0ea5e9;
  width: 16px;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #0ea5e9;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.form-input-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  line-height: 1.5;
}

.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  cursor: pointer;
  padding-right: 3rem;
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  pointer-events: none;
}

.form-help {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-help i {
  color: #0ea5e9;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary,
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex: 1;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: white;
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover::before {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #0ea5e9, #0284c7);
  color: white;
  flex: 2;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
}

.btn-primary:hover:not(:disabled)::before {
  left: 100%;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-container {
    margin: 0.5rem;
    max-width: none;
    border-radius: 20px;
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .modal-title {
    font-size: 1.25rem;
  }
  
  .modal-body {
    padding: 1rem 1.5rem 1.5rem;
  }
  
  .form-row-split {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn-secondary,
  .btn-primary {
    flex: none;
    padding: 1rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-close-btn {
    align-self: flex-end;
  }
  
  .modal-body {
    padding: 0.75rem 1rem 1rem;
  }
  
  .modal-title-section {
    gap: 0.75rem;
  }
  
  .modal-icon {
    width: 40px;
    height: 40px;
    font-size: 1.125rem;
  }
  
  .form-input,
  .form-textarea,
  .form-select {
    padding: 0.75rem;
  }
}

/* Scrollbar Styling */
.modal-container::-webkit-scrollbar {
  width: 6px;
}

.modal-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.modal-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.modal-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>