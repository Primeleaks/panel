<template>
  <div v-if="isOpen" class="admin-dashboard-overlay">
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h2>Admin Dashboard</h2>
        <button class="close-btn" @click="onClose">&times;</button>
      </div>

      <div class="tab-navigation">
        <button :class="{ active: activeTab === 'scripts' }" @click="activeTab = 'scripts'">Scripts</button>
        <button :class="{ active: activeTab === 'blacklist' }" @click="activeTab = 'blacklist'">Blacklist</button>
        <button :class="{ active: activeTab === 'ad' }" @click="activeTab = 'ad'">Werbung</button>
        <button :class="{ active: activeTab === 'site-settings' }" @click="activeTab = 'site-settings'">Site Settings</button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="loading" class="loading">Laden...</div>

      <div class="dashboard-content">
        <div v-if="activeTab === 'scripts' && !loading" class="scripts-list">
          <h3>Alle Scripts</h3>
          <table>
            <thead>
            <tr>
              <th>Titel</th>
              <th>Author</th>
              <th>Kategorie</th>
              <th>Datum</th>
              <th>Aktionen</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="script in scripts" :key="script.id">
              <td>{{ script.title }}</td>
              <td>{{ script.author }}</td>
              <td>{{ script.category }}</td>
              <td>{{ script.date }}</td>
              <td>
                <button class="delete-btn" @click="handleDeleteScript(script.id)">Löschen</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'blacklist'" class="blacklist-section">
          <h3>User Blacklist</h3>
          <form @submit.prevent="handleBlacklistUser">
            <div class="form-group">
              <input v-model="blacklistUserId" type="text" placeholder="Discord User ID" required />
              <input v-model="blacklistReason" type="text" placeholder="Grund" required />
              <button type="submit" :disabled="loading">{{ loading ? 'Wird blacklisted...' : 'Blacklisten' }}</button>
            </div>
          </form>
          <table>
            <thead>
            <tr>
              <th>User ID</th>
              <th>Username</th>
              <th>Grund</th>
              <th>Datum</th>
              <th>Aktionen</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="user in blacklist" :key="user.discord_id">
              <td>{{ user.discord_id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.reason }}</td>
              <td>{{ user.date }}</td>
              <td>
                <button class="unban-btn" @click="handleUnbanUser(user.discord_id)">Entbannen</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div v-if="activeTab === 'ad'" class="blacklist-section">
          <h3>Werbung</h3>
          <form @submit.prevent>
            <div class="form-group">
              <label for="adLabel">Label:</label>
              <input id="adLabel" v-model="adLabel" type="text" placeholder="Werbe-Label" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adText">Text:</label>
              <input id="adText" v-model="adText" type="text" placeholder="Werbetext" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adUrl">Ziel-URL:</label>
              <input id="adUrl" v-model="adUrl" type="url" placeholder="https://hopeleaks.xyz" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adImage">Bild-URL:</label>
              <input id="adImage" v-model="adImage" type="url" placeholder="https://hopeleaks.xyz/banner.png" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adType">Typ:</label>
              <select id="adType" v-model="adType" style="margin-right:10px;">
                <option value="popup">Popup</option>
              </select>
            </div>
            <div class="form-group">
              <label for="adActive">Aktiv:</label>
              <input id="adActive" v-model="adActive" type="checkbox" style="margin-top:7px;" />
            </div>
            <button type="submit" style="margin-top:10px;">Werbung speichern (inaktiv)</button>
          </form>
          <p style="margin-top: 20px; color: var(--text-secondary); font-size: 15px;">
            Hier können Sie zukünftig Werbung schalten. Diese Funktion ist aktuell nur im Frontend sichtbar und noch nicht aktiv.
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: {
    isOpen: Boolean,
    onClose: Function,
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'scripts',
      scripts: [],
      blacklist: [],
      inviteUserId: '',
      blacklistUserId: '',
      blacklistReason: '',
      loading: false,
      error: '',
      adLabel: '',
      adText: '',
      adUrl: '',
      adImage: '',
      adType: 'popup',
      adActive: false
    };
  },
  watch: {
    isOpen(newValue) {
      if (newValue) {
        if (this.activeTab === 'scripts') this.fetchScripts();
        if (this.activeTab === 'blacklist') this.fetchBlacklist();
      }
    },
    activeTab(newValue) {
      if (newValue === 'blacklist' && this.isOpen) {
        this.fetchBlacklist();
      } else if (newValue === 'scripts' && this.isOpen) {
        this.fetchScripts();
      }
    }
  },
  mounted() {
    if (this.isOpen) {
      if (this.activeTab === 'scripts') this.fetchScripts();
      if (this.activeTab === 'blacklist') this.fetchBlacklist();
    }
  },
  methods: {
    getCookie(cookieName) {
      const cookies = document.cookie.split("; ");
      const cookie = cookies.find(row => row.startsWith(`${cookieName}=`));
      return cookie ? cookie.split("=")[1] : null;
    },
    async fetchScripts() {
      this.loading = true;
      try {
        const response = await fetch('https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/scripts');
        if (!response.ok) throw new Error('Fehler beim Laden der Scripts');
        this.scripts = await response.json();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchBlacklist() {
      this.loading = true;
      const apiToken = this.getCookie("token");

      try {
        const response = await axios.get(`https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/blacklist`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
          },
        });

        this.blacklist = response.data;
      } catch (error) {
        this.error = error.message;
        console.error('Fehler beim Abrufen der Blacklist:', error);
      } finally {
        this.loading = false;
      }
    },

    async handleBlacklistUser() {
      this.loading = true;
      this.error = '';
      const apiToken = this.getCookie("token");

      try {
        const response = await axios.post(
            'https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/blacklist/create',
            {
              discordId: this.blacklistUserId,
              name: 'Unbekannt',
              reason: this.blacklistReason,
              bannedBy: this.user.username
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiToken}`,
              }
            }
        );

        await this.fetchBlacklist();
        this.blacklistUserId = '';
        this.blacklistReason = '';
      } catch (error) {
        this.error = error.message;
        console.error('Fehler beim Blacklisten des Users:', error);
      } finally {
        this.loading = false;
      }
    },


    async handleUnbanUser(userId) {
      if (!confirm('Möchten Sie diesen Benutzer wirklich von der Blacklist entfernen?')) {
        return;
      }

      this.loading = true;
      const apiToken = this.getCookie("token")

      try {

        await axios.delete(`https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/blacklist/delete/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
          }
        });
        await this.fetchBlacklist();
      } catch (error) {
        this.error = error.message;
        console.error('Fehler beim Entfernen von der Blacklist:', error);
      } finally {
        this.loading = false;
      }
    },

    async handleDeleteScript(id) {
      if (!confirm('Möchtest du dieses Script wirklich löschen?')) return;
      this.scripts = this.scripts.filter(script => script.id !== id);
      const apiToken = this.getCookie("token")
      await axios.post(`https://hopeleaks-panel-backend.xsojeo.easypanel.host/api/scripts/delete/${id}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`
        }
      });
    }
  }
};
</script>

<style scoped>
@import '../assets/admindashboard.css';
</style>
