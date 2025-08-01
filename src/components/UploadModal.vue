<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isAdmin ? 'Admin Upload' : 'Script hochladen' }}</h2>
        <button class="close-btn" @click="onClose">×</button>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Titel</label>
          <input
              type="text"
              v-model="title"
              required
              placeholder="Name des Scripts"
          />
        </div>
        <div class="form-group">
          <label>Beschreibung</label>
          <textarea
              v-model="description"
              required
              placeholder="Beschreibe das Script..."
          ></textarea>
        </div>
        <div class="form-group" v-if="isAdmin">
          <label>Kategorie</label>
          <select v-model="category" required>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group" v-else>
          <label>Kategorie</label>
          <input
              type="text"
              value="User-Leaks"
              disabled
              class="disabled-input"
          />
          <small class="info-text">
            Normale User können nur in User-Leaks posten
          </small>
        </div>
        <div class="form-group">
          <label>Bild Link</label>
          <input
              type="url"
              v-model="imgurLink"
              required
              placeholder="https://cdn.discordapp.com/attachments/... oder https://imgur.com/abcd123"
              class="image-input"
          />
          <small class="info-text">
            Option 1: Discord Bild Link kopieren<br />
            1. Rechtsklick auf ein Bild in Discord<br />
            2. "Link kopieren" wählen<br />
          </small>
        </div>
        <div class="form-group">
          <label>Download Link</label>
          <input
              type="url"
              v-model="downloadLink"
              required
              placeholder="https://example.com/download"
          />
        </div>
        <div class="modal-actions">
          <button type="button" @click="onClose" :disabled="loading">
            Abbrechen
          </button>
          <button type="submit" :disabled="loading" class="submit-btn">
            {{ loading ? 'Wird hochgeladen...' : 'Hochladen' }}
          </button>
        </div>
      </form>
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
      category: 'user',
      imgurLink: '',
      downloadLink: '',
      loading: false,
      error: '',
    };
  },
  methods: {
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
          throw new Error('Nicht unterstützte Bild-URL. Bitte verwende Discord oder Imgur Links.');
        }
      } catch (error) {
        throw new Error('Ungültige Bild-URL. Bitte füge einen gültigen Discord oder Imgur Link ein.');
      }
    },
    async handleSubmit() {
      this.loading = true;
      this.error = '';

      try {
        if (!this.imgurLink) {
          throw new Error('Bitte füge einen Imgur-Link ein');
        }

        console.log(this.user.discord_id)

        const token = this.getCookie("token");
        const userId = this.user.discord_id;
        const username = this.user.username;

        if (!token || !userId) {
          throw new Error('Nicht eingeloggt. Bitte neu anmelden.');
        }

        const formattedImageUrl = this.formatImageUrl(this.imgurLink);
        let endpoint = '/api/scripts/create';
        if(!this.isAdmin)
          endpoint = '/api/scripts/createuserscript';

        const apiToken = this.getCookie("token")

        const response = await fetch(`https://hopeleaks-panel-backend.xsojeo.easypanel.host${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
          },
          body: JSON.stringify({data: {
              title: this.title,
              description: this.description,
              category: this.isAdmin ? this.category : 'user',
              imgurLink: formattedImageUrl,
              downloadLink: this.downloadLink,
              authorId: userId,
              author: username,
            }}),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Upload fehlgeschlagen (${response.status})`);
        }

        const responseData = await response.json();

        this.title = '';
        this.description = '';
        this.imgurLink = '';
        this.downloadLink = '';
        this.category = 'user';

        if (this.onUploadSuccess) {
          await this.onUploadSuccess();
        }
        this.onClose();
      } catch (error) {
        console.error('Upload error:', error);
        this.error = error.message || 'Upload fehlgeschlagen';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
@import '@/assets/uploadmodal.css';
</style>