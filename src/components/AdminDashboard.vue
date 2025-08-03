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
    <button :class="{ active: activeTab === 'analytics' }" @click="activeTab = 'analytics'">Analytics</button>
    <button :class="{ active: activeTab === 'moderation' }" @click="activeTab = 'moderation'">Moderation</button>
    <button :class="{ active: activeTab === 'ad' }" @click="activeTab = 'ad'">Werbung</button>
    <button :class="{ active: activeTab === 'site-settings' }" @click="activeTab = 'site-settings'">Site Settings</button>
  </div>      <div v-if="error" class="error-message">{{ error }}</div>
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
<<<<<<< Updated upstream
        
        <div v-if="activeTab === 'analytics'" class="analytics-section">
          <h3>Dashboard Analytics</h3>
          
          <div class="analytics-controls">
            <div class="time-range-selector">
              <label>Time Range:</label>
              <select v-model="analyticsTimeRange" @change="fetchAnalytics">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
=======

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
              <input id="adUrl" v-model="adUrl" type="url" placeholder="https://localhost" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adImage">Bild-URL:</label>
              <input id="adImage" v-model="adImage" type="url" placeholder="https://localhost/banner.png" style="margin-right:10px;" />
            </div>
            <div class="form-group">
              <label for="adType">Typ:</label>
              <select id="adType" v-model="adType" style="margin-right:10px;">
                <option value="popup">Popup</option>
>>>>>>> Stashed changes
              </select>
            </div>
          </div>
          
          <div class="analytics-dashboard">
            <div class="analytics-grid">
              <div class="analytics-card summary-stats">
                <h4>Summary Statistics</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <div v-else class="stats-grid">
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardStats.totalUsers || 0 }}</span>
                    <span class="stat-label">Total Users</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardStats.activeUsersWeek || 0 }}</span>
                    <span class="stat-label">Active Users (Week)</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardStats.totalScripts || 0 }}</span>
                    <span class="stat-label">Total Scripts</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardStats.totalDownloads || 0 }}</span>
                    <span class="stat-label">Total Downloads</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ dashboardStats.totalComments || 0 }}</span>
                    <span class="stat-label">Total Comments</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ (dashboardStats.averageRating || 0).toFixed(1) }}</span>
                    <span class="stat-label">Avg Rating</span>
                  </div>
                </div>
              </div>
              
              <div class="analytics-card user-growth">
                <h4>User Growth</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <div v-else ref="userGrowthChart" class="chart-container"></div>
              </div>
              
              <div class="analytics-card script-uploads">
                <h4>Script Uploads</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <div v-else ref="scriptUploadsChart" class="chart-container"></div>
              </div>
              
              <div class="analytics-card category-distribution">
                <h4>Category Distribution</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <div v-else ref="categoryDistributionChart" class="chart-container"></div>
              </div>
            </div>
            
            <div class="analytics-tables">
              <div class="analytics-card top-scripts">
                <h4>Top Scripts</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <table v-else>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Downloads</th>
                      <th>Views</th>
                      <th>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="script in topScripts" :key="script.id">
                      <td>{{ script.title }}</td>
                      <td>{{ script.author }}</td>
                      <td>{{ script.downloads }}</td>
                      <td>{{ script.views }}</td>
                      <td>{{ script.rating_average ? script.rating_average.toFixed(1) : 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="analytics-card top-users">
                <h4>Top Users</h4>
                <div v-if="loadingAnalytics" class="card-loader">Loading...</div>
                <table v-else>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Scripts</th>
                      <th>Downloads</th>
                      <th>Followers</th>
                      <th>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in topUsers" :key="user.discord_id">
                      <td>{{ user.username }}</td>
                      <td>{{ user.script_count }}</td>
                      <td>{{ user.total_downloads }}</td>
                      <td>{{ user.follower_count }}</td>
                      <td>{{ user.avg_rating ? user.avg_rating.toFixed(1) : 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="activeTab === 'moderation'" class="moderation-section">
          <h3>Content Moderation</h3>
          
          <div class="moderation-tabs">
            <button :class="{ active: moderationSubTab === 'reports' }" @click="moderationSubTab = 'reports'">Reports</button>
            <button :class="{ active: moderationSubTab === 'pending' }" @click="moderationSubTab = 'pending'">Pending Scripts</button>
            <button :class="{ active: moderationSubTab === 'flagged' }" @click="moderationSubTab = 'flagged'">Flagged Content</button>
            <button :class="{ active: moderationSubTab === 'strikes' }" @click="moderationSubTab = 'strikes'">User Strikes</button>
          </div>
          
          <div v-if="moderationSubTab === 'reports'" class="reports-list">
            <div v-if="loadingModeration" class="loading">Loading reports...</div>
            <div v-else-if="reports.length === 0" class="empty-state">No pending reports</div>
            <table v-else>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target</th>
                  <th>Reason</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in reports" :key="report.id">
                  <td>{{ report.type }}</td>
                  <td>{{ report.target_name }}</td>
                  <td>{{ report.reason }}</td>
                  <td>{{ report.reporter_name }}</td>
                  <td>{{ formatDate(report.created_at) }}</td>
                  <td class="action-buttons">
                    <button class="view-btn" @click="viewReportedContent(report)">View</button>
                    <button class="approve-btn" @click="resolveReport(report.id, 'dismiss')">Dismiss</button>
                    <button class="delete-btn" @click="resolveReport(report.id, 'action')">Take Action</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="moderationSubTab === 'pending'" class="pending-scripts">
            <div v-if="loadingModeration" class="loading">Loading pending scripts...</div>
            <div v-else-if="pendingScripts.length === 0" class="empty-state">No pending scripts</div>
            <table v-else>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="script in pendingScripts" :key="script.id">
                  <td>{{ script.title }}</td>
                  <td>{{ script.author }}</td>
                  <td>{{ script.category }}</td>
                  <td>{{ formatDate(script.date) }}</td>
                  <td class="action-buttons">
                    <button class="view-btn" @click="viewScript(script.id)">View</button>
                    <button class="approve-btn" @click="approveScript(script.id)">Approve</button>
                    <button class="reject-btn" @click="rejectScript(script.id)">Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="moderationSubTab === 'strikes'" class="user-strikes">
            <div v-if="loadingModeration" class="loading">Loading user strikes...</div>
            <div v-else-if="userStrikes.length === 0" class="empty-state">No user strikes</div>
            <table v-else>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Total Strikes</th>
                  <th>Last Strike</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="strike in userStrikes" :key="strike.user_id">
                  <td>{{ strike.username }}</td>
                  <td>{{ strike.strike_count }}</td>
                  <td>{{ formatDate(strike.last_strike_date) }}</td>
                  <td>{{ strike.last_strike_reason }}</td>
                  <td class="action-buttons">
                    <button class="view-btn" @click="viewUserStrikes(strike.user_id)">Details</button>
                    <button class="delete-btn" @click="blacklistUserFromStrikes(strike.user_id)">Blacklist</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="activeTab === 'ad'" class="advertising-section">
          <h3>Werbung & Marketing</h3>
          
          <div class="ad-preview-container">
            <h4>Vorschau</h4>
            <div class="ad-preview" :class="{ 'popup-preview': adType === 'popup', 'banner-preview': adType === 'banner' }">
              <div v-if="adImage" class="ad-image">
                <img :src="adImage" :alt="adLabel" @error="adImageError = true" />
              </div>
              <div class="ad-content">
                <h5 v-if="adLabel">{{ adLabel }}</h5>
                <p v-if="adText">{{ adText }}</p>
                <a v-if="adUrl" :href="adUrl" target="_blank" rel="noopener" class="ad-link">
                  {{ adUrl }}
                </a>
              </div>
              <div v-if="!adLabel && !adText && !adUrl" class="ad-placeholder">
                <i class="fas fa-ad"></i>
                <p>Werbung-Vorschau wird hier angezeigt</p>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="saveAdvertising" class="ad-form">
            <div class="form-row">
              <div class="form-group">
                <label for="adLabel">Werbe-Titel:</label>
                <input 
                  id="adLabel" 
                  v-model="adLabel" 
                  type="text" 
                  placeholder="z.B. Jetzt 50% Rabatt!" 
                  maxlength="50"
                />
              </div>
              <div class="form-group">
                <label for="adType">Anzeigen-Typ:</label>
                <select id="adType" v-model="adType">
                  <option value="popup">Popup-Fenster</option>
                  <option value="banner">Banner (oben)</option>
                  <option value="sidebar">Seitenleiste</option>
                  <option value="footer">Footer-Banner</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="adText">Werbetext:</label>
              <textarea 
                id="adText" 
                v-model="adText" 
                placeholder="Beschreibung der Werbung..."
                rows="3"
                maxlength="200"
              ></textarea>
              <small>{{ adText.length }}/200 Zeichen</small>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="adUrl">Ziel-URL:</label>
                <input 
                  id="adUrl" 
                  v-model="adUrl" 
                  type="url" 
                  placeholder="https://beispiel.de" 
                />
              </div>
              <div class="form-group">
                <label for="adImage">Bild-URL:</label>
                <input 
                  id="adImage" 
                  v-model="adImage" 
                  type="url" 
                  placeholder="https://beispiel.de/banner.png" 
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    id="adActive" 
                    v-model="adActive" 
                    type="checkbox" 
                    :disabled="!adLabel || !adUrl"
                  />
                  <span class="checkmark"></span>
                  Werbung aktivieren
                </label>
                <small v-if="!adLabel || !adUrl" class="error-text">
                  Titel und URL sind erforderlich
                </small>
              </div>
              <div class="form-group">
                <button 
                  type="submit" 
                  class="save-ad-btn"
                  :disabled="!adLabel || !adUrl || savingAd"
                >
                  <i class="fas fa-save"></i>
                  {{ savingAd ? 'Speichert...' : 'Werbung speichern' }}
                </button>
              </div>
            </div>
          </form>
          
          <div class="ad-statistics">
            <h4>Werbung-Statistiken</h4>
            <div class="stats-grid">
              <div class="stat-card">
                <i class="fas fa-eye"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ adStats.impressions || 0 }}</span>
                  <span class="stat-label">Impressionen</span>
                </div>
              </div>
              <div class="stat-card">
                <i class="fas fa-mouse-pointer"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ adStats.clicks || 0 }}</span>
                  <span class="stat-label">Klicks</span>
                </div>
              </div>
              <div class="stat-card">
                <i class="fas fa-percentage"></i>
                <div class="stat-info">
                  <span class="stat-value">{{ adStats.ctr || '0.0' }}%</span>
                  <span class="stat-label">CTR</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ad-management">
            <h4>Aktive Werbeanzeigen</h4>
            <div v-if="activeAds.length === 0" class="no-ads">
              <p>Keine aktiven Werbeanzeigen vorhanden.</p>
            </div>
            <div v-else class="ads-list">
              <div v-for="ad in activeAds" :key="ad.id" class="ad-item">
                <div class="ad-info">
                  <h5>{{ ad.label }}</h5>
                  <p>{{ ad.text }}</p>
                  <small>Typ: {{ ad.type }} | Erstellt: {{ formatDate(ad.created_at) }}</small>
                </div>
                <div class="ad-actions">
                  <button @click="toggleAdStatus(ad)" class="toggle-btn">
                    {{ ad.is_active ? 'Deaktivieren' : 'Aktivieren' }}
                  </button>
                  <button @click="deleteAd(ad.id)" class="delete-btn">Löschen</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'site-settings'" class="site-settings-section">
          <h3>Site-Einstellungen</h3>
          
          <div class="settings-grid">
            <div class="setting-card">
              <h4>Allgemeine Einstellungen</h4>
              <div class="form-group">
                <label>Site-Name:</label>
                <input v-model="siteSettings.siteName" type="text" placeholder="Hope Leaks" />
              </div>
              <div class="form-group">
                <label>Site-Beschreibung:</label>
                <textarea v-model="siteSettings.siteDescription" rows="3" placeholder="Die beste Quelle für FiveM Scripts..."></textarea>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.registrationEnabled" type="checkbox" />
                  <span class="checkmark"></span>
                  Registrierung aktiviert
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.maintenanceMode" type="checkbox" />
                  <span class="checkmark"></span>
                  Wartungsmodus
                </label>
              </div>
            </div>
            
            <div class="setting-card">
              <h4>Upload-Einstellungen</h4>
              <div class="form-group">
                <label>Max. Dateigröße (MB):</label>
                <input v-model="siteSettings.maxFileSize" type="number" min="1" max="100" />
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.autoApproval" type="checkbox" />
                  <span class="checkmark"></span>
                  Automatische Genehmigung neuer Scripts
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.allowAnonymousDownloads" type="checkbox" />
                  <span class="checkmark"></span>
                  Anonyme Downloads erlauben
                </label>
              </div>
            </div>
            
            <div class="setting-card">
              <h4>Discord-Integration</h4>
              <div class="form-group">
                <label>Discord Bot Token:</label>
                <input v-model="siteSettings.discordBotToken" type="password" placeholder="•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••" />
              </div>
              <div class="form-group">
                <label>Webhook URL:</label>
                <input v-model="siteSettings.webhookUrl" type="url" placeholder="https://discord.com/api/webhooks/..." />
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.discordNotifications" type="checkbox" />
                  <span class="checkmark"></span>
                  Discord-Benachrichtigungen aktiviert
                </label>
              </div>
            </div>
            
            <div class="setting-card">
              <h4>Sicherheit</h4>
              <div class="form-group">
                <label>Rate Limit (Anfragen pro Minute):</label>
                <input v-model="siteSettings.rateLimit" type="number" min="10" max="1000" />
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.requireEmailVerification" type="checkbox" />
                  <span class="checkmark"></span>
                  E-Mail-Verifizierung erforderlich
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="siteSettings.enableCaptcha" type="checkbox" />
                  <span class="checkmark"></span>
                  CAPTCHA aktiviert
                </label>
              </div>
            </div>
          </div>
          
          <div class="settings-actions">
            <button @click="saveSiteSettings" class="save-settings-btn" :disabled="savingSettings">
              <i class="fas fa-save"></i>
              {{ savingSettings ? 'Speichert...' : 'Einstellungen speichern' }}
            </button>
            <button @click="resetSettings" class="reset-settings-btn">
              <i class="fas fa-undo"></i>
              Zurücksetzen
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import Chart from 'chart.js/auto';

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
      
      // Analytics data
      analyticsTimeRange: '30',
      dashboardStats: {},
      userGrowth: [],
      scriptTrends: [],
      categoryStats: [],
      topScripts: [],
      topUsers: [],
      loadingAnalytics: false,
      userGrowthChart: null,
      scriptUploadsChart: null,
      categoryDistributionChart: null,
      
      // Moderation data
      moderationSubTab: 'reports',
      loadingModeration: false,
      reports: [],
      pendingScripts: [],
      flaggedContent: [],
      userStrikes: [],
      
      // Ad data
      adLabel: '',
      adText: '',
      adUrl: '',
      adImage: '',
      adType: 'popup',
      adActive: false,
      adImageError: false,
      savingAd: false,
      adStats: {
        impressions: 0,
        clicks: 0,
        ctr: 0.0
      },
      activeAds: [],
      
      // Site settings data
      siteSettings: {
        siteName: 'Hope Leaks',
        siteDescription: 'Die beste Quelle für FiveM Scripts',
        registrationEnabled: true,
        maintenanceMode: false,
        maxFileSize: 50,
        autoApproval: false,
        allowAnonymousDownloads: true,
        discordBotToken: '',
        webhookUrl: '',
        discordNotifications: true,
        rateLimit: 100,
        requireEmailVerification: false,
        enableCaptcha: false
      },
      savingSettings: false
    };
  },
  watch: {
    isOpen(newValue) {
      if (newValue) {
        if (this.activeTab === 'scripts') this.fetchScripts();
        if (this.activeTab === 'blacklist') this.fetchBlacklist();
        if (this.activeTab === 'analytics') this.fetchAnalytics();
        if (this.activeTab === 'moderation') this.fetchModeration();
      }
    },
    activeTab(newValue) {
      if (newValue === 'blacklist' && this.isOpen) {
        this.fetchBlacklist();
      } else if (newValue === 'scripts' && this.isOpen) {
        this.fetchScripts();
      } else if (newValue === 'analytics' && this.isOpen) {
        this.fetchAnalytics();
      } else if (newValue === 'moderation' && this.isOpen) {
        this.fetchModeration();
      } else if (newValue === 'ad' && this.isOpen) {
        this.fetchActiveAds();
        this.fetchAdStats();
      } else if (newValue === 'site-settings' && this.isOpen) {
        this.fetchSiteSettings();
      }
    },
    moderationSubTab() {
      if (this.activeTab === 'moderation' && this.isOpen) {
        this.fetchModeration();
      }
    },
    analyticsTimeRange() {
      if (this.activeTab === 'analytics' && this.isOpen) {
        this.fetchAnalytics();
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
        const response = await fetch('http://localhost:3001/api/scripts');
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
        const response = await axios.get(`http://localhost:3001/api/blacklist`, {
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
            'http://localhost:3001/api/blacklist/create',
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

        await axios.delete(`http://localhost:3001/api/blacklist/delete/${userId}`, {
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
      await axios.post(`http://localhost:3001/api/scripts/delete/${id}`, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`
        }
      });
    },

    // Advertising methods
    async saveAdvertising() {
      if (!this.adLabel || !this.adUrl) {
        this.error = 'Titel und URL sind erforderlich';
        return;
      }

      this.savingAd = true;
      this.error = '';
      const apiToken = this.getCookie("token");

      try {
        const adData = {
          label: this.adLabel,
          text: this.adText,
          url: this.adUrl,
          image: this.adImage,
          type: this.adType,
          is_active: this.adActive
        };

        const response = await axios.post('http://localhost:3001/api/admin/ads', adData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
          }
        });

        // Show success message
        this.showToast('Werbung erfolgreich gespeichert', 'success');
        
        // Reset form if successful
        this.resetAdForm();
        await this.fetchActiveAds();
        
      } catch (error) {
        this.error = error.response?.data?.message || 'Fehler beim Speichern der Werbung';
        console.error('Error saving advertisement:', error);
      } finally {
        this.savingAd = false;
      }
    },

    async fetchActiveAds() {
      const apiToken = this.getCookie("token");
      
      try {
        const response = await axios.get('http://localhost:3001/api/admin/ads', {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.activeAds = response.data;
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    },

    async fetchAdStats() {
      const apiToken = this.getCookie("token");
      
      try {
        const response = await axios.get('http://localhost:3001/api/admin/ads/stats', {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.adStats = response.data;
      } catch (error) {
        console.error('Error fetching ad stats:', error);
      }
    },

    async toggleAdStatus(ad) {
      const apiToken = this.getCookie("token");
      
      try {
        await axios.patch(`http://localhost:3001/api/admin/ads/${ad.id}/toggle`, {}, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        // Update local state
        ad.is_active = !ad.is_active;
        this.showToast(`Werbung ${ad.is_active ? 'aktiviert' : 'deaktiviert'}`, 'success');
        
      } catch (error) {
        this.error = 'Fehler beim Ändern des Werbung-Status';
        console.error('Error toggling ad status:', error);
      }
    },

    async deleteAd(adId) {
      if (!confirm('Sind Sie sicher, dass Sie diese Werbung löschen möchten?')) {
        return;
      }

      const apiToken = this.getCookie("token");
      
      try {
        await axios.delete(`http://localhost:3001/api/admin/ads/${adId}`, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        // Remove from local state
        this.activeAds = this.activeAds.filter(ad => ad.id !== adId);
        this.showToast('Werbung erfolgreich gelöscht', 'success');
        
      } catch (error) {
        this.error = 'Fehler beim Löschen der Werbung';
        console.error('Error deleting ad:', error);
      }
    },

    resetAdForm() {
      this.adLabel = '';
      this.adText = '';
      this.adUrl = '';
      this.adImage = '';
      this.adType = 'popup';
      this.adActive = false;
      this.adImageError = false;
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Analytics methods
    async fetchAnalytics() {
      this.loadingAnalytics = true;
      const apiToken = this.getCookie("token");
      
      try {
        const response = await axios.get(`http://localhost:3001/api/admin/analytics?timeRange=${this.analyticsTimeRange}`, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.dashboardStats = response.data.stats || {};
        this.topScripts = response.data.topScripts || [];
        this.topUsers = response.data.topUsers || [];
        
      } catch (error) {
        console.error('Error fetching analytics:', error);
        this.error = 'Fehler beim Laden der Analytics-Daten';
      } finally {
        this.loadingAnalytics = false;
      }
    },

    // Moderation methods
    async fetchModeration() {
      this.loadingModeration = true;
      const apiToken = this.getCookie("token");
      
      try {
        const endpoint = this.moderationSubTab === 'reports' ? 'reports' :
                        this.moderationSubTab === 'pending' ? 'pending-scripts' :
                        this.moderationSubTab === 'strikes' ? 'user-strikes' : 'reports';
                        
        const response = await axios.get(`http://localhost:3001/api/admin/moderation/${endpoint}`, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        if (this.moderationSubTab === 'reports') {
          this.reports = response.data;
        } else if (this.moderationSubTab === 'pending') {
          this.pendingScripts = response.data;
        } else if (this.moderationSubTab === 'strikes') {
          this.userStrikes = response.data;
        }
        
      } catch (error) {
        console.error('Error fetching moderation data:', error);
        this.error = 'Fehler beim Laden der Moderation-Daten';
      } finally {
        this.loadingModeration = false;
      }
    },

    async resolveReport(reportId, action) {
      const apiToken = this.getCookie("token");
      
      try {
        await axios.post(`http://localhost:3001/api/admin/moderation/reports/${reportId}/resolve`, 
          { action },
          {
            headers: {
              Authorization: `Bearer ${apiToken}`
            }
          }
        );
        
        this.showToast(`Report ${action === 'dismiss' ? 'abgelehnt' : 'bearbeitet'}`, 'success');
        await this.fetchModeration();
        
      } catch (error) {
        this.error = 'Fehler beim Bearbeiten des Reports';
        console.error('Error resolving report:', error);
      }
    },

    async approveScript(scriptId) {
      const apiToken = this.getCookie("token");
      
      try {
        await axios.post(`http://localhost:3001/api/admin/scripts/approve/${scriptId}`, {}, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.showToast('Script genehmigt', 'success');
        await this.fetchModeration();
        
      } catch (error) {
        this.error = 'Fehler beim Genehmigen des Scripts';
        console.error('Error approving script:', error);
      }
    },

    async rejectScript(scriptId) {
      const apiToken = this.getCookie("token");
      
      try {
        await axios.post(`http://localhost:3001/api/admin/scripts/reject/${scriptId}`, {}, {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.showToast('Script abgelehnt', 'success');
        await this.fetchModeration();
        
      } catch (error) {
        this.error = 'Fehler beim Ablehnen des Scripts';
        console.error('Error rejecting script:', error);
      }
    },

    viewScript(scriptId) {
      // Open script in new tab or navigate to script view
      window.open(`/script/${scriptId}`, '_blank');
    },

    viewReportedContent(report) {
      // Handle viewing reported content
      console.log('Viewing reported content:', report);
    },

    viewUserStrikes(userId) {
      // Handle viewing user strikes details
      console.log('Viewing user strikes:', userId);
    },

    blacklistUserFromStrikes(userId) {
      // Add user to blacklist from strikes
      if (confirm('Benutzer von den Strikes zur Blacklist hinzufügen?')) {
        // Implementation would go here
        console.log('Blacklisting user:', userId);
      }
    },

    // Site settings methods
    async saveSiteSettings() {
      this.savingSettings = true;
      this.error = '';
      const apiToken = this.getCookie("token");

      try {
        await axios.post('http://localhost:3001/api/admin/settings', this.siteSettings, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`
          }
        });

        this.showToast('Einstellungen erfolgreich gespeichert', 'success');
        
      } catch (error) {
        this.error = error.response?.data?.message || 'Fehler beim Speichern der Einstellungen';
        console.error('Error saving settings:', error);
      } finally {
        this.savingSettings = false;
      }
    },

    resetSettings() {
      if (confirm('Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?')) {
        this.siteSettings = {
          siteName: 'Hope Leaks',
          siteDescription: 'Die beste Quelle für FiveM Scripts',
          registrationEnabled: true,
          maintenanceMode: false,
          maxFileSize: 50,
          autoApproval: false,
          allowAnonymousDownloads: true,
          discordBotToken: '',
          webhookUrl: '',
          discordNotifications: true,
          rateLimit: 100,
          requireEmailVerification: false,
          enableCaptcha: false
        };
      }
    },

    async fetchSiteSettings() {
      const apiToken = this.getCookie("token");
      
      try {
        const response = await axios.get('http://localhost:3001/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${apiToken}`
          }
        });
        
        this.siteSettings = { ...this.siteSettings, ...response.data };
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    },

    showToast(message, type = 'info') {
      // Simple toast implementation - you might want to use a more sophisticated toast system
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'}-color);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        opacity: 0.9;
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 3000);
    }
  }
};
</script>

<style scoped>
@import '../assets/admindashboard.css';

/* Analytics Dashboard Styles */
.analytics-section {
  padding: 1rem;
}

.analytics-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.analytics-card {
  background-color: var(--bg-card);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  position: relative;
}

.analytics-card h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.card-loader {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-weight: bold;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.analytics-tables {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.analytics-card table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.analytics-card th {
  background-color: var(--bg-secondary);
  text-align: left;
  padding: 0.75rem;
}

.analytics-card td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

/* Moderation Styles */
.moderation-section {
  padding: 1rem;
}

.moderation-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.moderation-tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.moderation-tabs button.active {
  background-color: var(--primary-color);
  color: white;
}

.moderation-tabs button:not(.active):hover {
  background-color: var(--bg-secondary);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Advertising Styles */
.advertising-section {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.ad-preview-container {
  margin-bottom: 2rem;
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}

.ad-preview {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
}

.ad-preview.popup-preview {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.05);
}

.ad-preview.banner-preview {
  border-color: var(--warning-color);
  background: rgba(255, 193, 7, 0.05);
}

.ad-image img {
  max-width: 80px;
  max-height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.ad-content h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.ad-content p {
  margin: 0 0 0.5rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.ad-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.8rem;
}

.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  color: var(--text-tertiary);
}

.ad-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.ad-form {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--input-bg);
  color: var(--text-color);
  font-size: 0.9rem;
}

.form-group small {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  flex-direction: row !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.save-ad-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.save-ad-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
  transform: translateY(-1px);
}

.save-ad-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ad-statistics {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 6px;
}

.stat-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.ad-management {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.no-ads {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.ads-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.ad-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.ad-info h5 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
}

.ad-info p {
  margin: 0 0 0.25rem 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.ad-info small {
  color: var(--text-tertiary);
  font-size: 0.75rem;
}

.ad-actions {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  background: var(--warning-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.toggle-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.error-text {
  color: var(--danger-color);
}

@media (max-width: 768px) {
  .form-row,
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .ad-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .ad-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.view-btn, .approve-btn, .reject-btn, .delete-btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-btn {
  background-color: #e0e0e0;
  color: #333;
}

.approve-btn {
  background-color: #4caf50;
  color: white;
}

.reject-btn, .delete-btn {
  background-color: #f44336;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
}

/* Site Settings Styles */
.site-settings-section {
  padding: 1.5rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.setting-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.setting-card h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.save-settings-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.save-settings-btn:hover:not(:disabled) {
  background: var(--primary-color-dark);
  transform: translateY(-1px);
}

.save-settings-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-settings-btn {
  background: var(--warning-color);
  color: var(--text-dark);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.reset-settings-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  
  .settings-actions {
    flex-direction: column;
  }
}
</style>
