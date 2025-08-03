<template>
  <div class="checking-container">
    <div class="checking-card">
      <div class="checking-header">
        <div class="checking-logo">
          <div class="logo-icon">
            <i class="fa-solid fa-code"></i>
          </div>
          <h1 class="checking-title">TESTER</h1>
        </div>
        <p class="checking-subtitle">Dein Account wird überprüft, bitte warten!</p>
      </div>
      
      <div class="checking-content">
        <div class="checking-spinner-container">
          <div class="checking-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
        </div>
        
        <div class="status-display">
          <p class="status-text">{{ status }}</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
          </div>
        </div>
        
        <div class="checking-steps">
          <div 
            v-for="(step, index) in checkingSteps" 
            :key="index"
            class="step-item"
            :class="{ 
              'completed': index < currentStep, 
              'active': index === currentStep,
              'pending': index > currentStep 
            }"
          >
            <div class="step-icon">
              <i class="fa-solid fa-check" v-if="index < currentStep"></i>
              <div class="step-spinner" v-else-if="index === currentStep"></div>
              <i class="fa-solid fa-clock" v-else></i>
            </div>
            <span class="step-text">{{ step }}</span>
          </div>
        </div>
      </div>
      
      <div class="checking-footer">
        <p class="footer-text">Dies kann einen Moment dauern...</p>
        <div class="security-badges">
          <div class="security-badge">
            <i class="fa-solid fa-shield-check"></i>
            <span>Sicherheitsprüfung</span>
          </div>
          <div class="security-badge">
            <i class="fa-solid fa-key"></i>
            <span>Token-Generierung</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="checking-background">
      <div class="pulse-circles">
        <div class="pulse-circle pulse-1"></div>
        <div class="pulse-circle pulse-2"></div>
        <div class="pulse-circle pulse-3"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Checking",
  data() {
    return {
      error: null,
      status: "Initialisiere...",
      checkingSteps: ["Blacklist-Prüfung", "API-Token erstellen", "Rollen abrufen", "Abschluss"],
      currentStep: 0,
      progressWidth: 0
    };
  },
  mounted() {
    // Handle avatar parameter from Discord OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const avatar = urlParams.get("avatar");

    if (avatar) {
      localStorage.setItem("avatar", avatar);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    this.startChecking();
  },
  methods: {
    async startChecking() {
      try {
        console.log("Cookies:", document.cookie);

        const token = this.getCookie("token");
        console.log("Token gefunden:", !!token);

        if (!token) {
          console.log("Kein Token gefunden, leite zur Startseite weiter");
          this.$router.push("/");
          return;
        }

        const tokenData = this.parseJwt(token);
        console.log("Token-Daten:", tokenData);
        const discordId = tokenData.discord_id;

        this.status = this.checkingSteps[0];
        this.currentStep = 0;
        this.progressWidth = 25;
        await this.sleep(800);
        const blacklistResponse = await fetch(`http://localhost:3001/api/blacklist/isBlacklisted/${discordId}`);
        const isBlacklisted = await blacklistResponse.json();

        if (isBlacklisted) {
          console.log("Nutzer ist auf der Blacklist");
          this.$router.push("/");
          return;
        }

        this.status = this.checkingSteps[1];
        this.currentStep = 1;
        this.progressWidth = 50;
        await this.sleep(1000);

        this.status = this.checkingSteps[2];
        this.currentStep = 2;
        this.progressWidth = 75;
        await this.sleep(800);

        this.status = this.checkingSteps[3];
        this.currentStep = 3;
        this.progressWidth = 100;
        await this.sleep(500);

        this.$router.push("/main");
      } catch (error) {
        console.error("Fehler bei der Überprüfung:", error);
        this.$router.push("/");
      }
    },

    getCookie(name) {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
          return cookie.substring(name.length + 1);
        }
      }
      return null;
    },

    parseJwt(token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (error) {
        console.error("Token-Parse-Fehler:", error);
        return {};
      }
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
};
</script>

<style scoped>
/* Modern Checking Page Styles */
.checking-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

.checking-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 520px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  position: relative;
  z-index: 1;
  animation: slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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

.checking-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.checking-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
  box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 25px rgba(14, 165, 233, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 15px 35px rgba(14, 165, 233, 0.5);
  }
}

.checking-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: white;
  margin: 0;
  background: linear-gradient(135deg, #0ea5e9, #f97316);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.025em;
}

.checking-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  line-height: 1.6;
  margin: 0;
}

.checking-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.checking-spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.checking-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #0ea5e9;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-top-color: #f97316;
  animation-delay: -0.6s;
  transform: scale(0.8);
}

.spinner-ring:nth-child(3) {
  border-top-color: #8b5cf6;
  animation-delay: -1.2s;
  transform: scale(0.6);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-display {
  text-align: center;
  width: 100%;
}

.status-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
  animation: fadeIn 0.5s ease-in-out;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #f97316);
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.checking-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.step-item.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
}

.step-item.active {
  background: rgba(14, 165, 233, 0.1);
  border-color: rgba(14, 165, 233, 0.3);
  transform: scale(1.02);
}

.step-item.pending {
  opacity: 0.6;
}

.step-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.875rem;
}

.step-item.completed .step-icon {
  background: #22c55e;
  color: white;
}

.step-item.active .step-icon {
  background: #0ea5e9;
  color: white;
}

.step-item.pending .step-icon {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.step-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.step-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.95rem;
}

.step-item.pending .step-text {
  color: rgba(255, 255, 255, 0.5);
}

.checking-footer {
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.footer-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.security-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
}

.security-badge i {
  color: #0ea5e9;
}

.checking-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.pulse-circles {
  position: absolute;
  inset: 0;
}

.pulse-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1), transparent 70%);
  animation: pulse-expand 4s ease-in-out infinite;
}

.pulse-1 {
  width: 300px;
  height: 300px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.pulse-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 15%;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.1), transparent 70%);
  animation-delay: 1.3s;
}

.pulse-3 {
  width: 250px;
  height: 250px;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%);
  animation-delay: 2.6s;
}

@keyframes pulse-expand {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .checking-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
    max-width: none;
  }
  
  .checking-title {
    font-size: 2rem;
  }
  
  .checking-subtitle {
    font-size: 1rem;
  }
  
  .status-text {
    font-size: 1.125rem;
  }
  
  .security-badges {
    gap: 0.5rem;
  }
  
  .security-badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .checking-container {
    padding: 0.5rem;
  }
  
  .checking-card {
    padding: 1.5rem 1rem;
  }
  
  .logo-icon {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }
  
  .checking-title {
    font-size: 1.75rem;
  }
  
  .checking-spinner {
    width: 60px;
    height: 60px;
  }
  
  .security-badges {
    flex-direction: column;
    align-items: center;
  }
  
  .security-badge {
    width: 100%;
    justify-content: center;
  }
}
</style>