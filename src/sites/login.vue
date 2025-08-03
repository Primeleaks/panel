 <template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <div class="logo-icon">
            <i class="fa-solid fa-code"></i>
          </div>
          <h1 class="login-title">TESTER</h1>
        </div>
        <p class="login-subtitle">Willkommen zurück! Melde dich an, um fortzufahren</p>
      </div>
      
      <div class="login-form">
        <button class="discord-login-btn" @click="redirectToDiscordLogin">
          <div class="discord-icon">
            <i class="fa-brands fa-discord"></i>
          </div>
          <span>Mit Discord anmelden</span>
          <div class="btn-shine"></div>
        </button>
        
        <div class="login-divider">
          <span>oder</span>
        </div>
        
        <div class="alternative-login">
          <p class="alt-text">Noch kein Account? Registriere dich über Discord!</p>
        </div>
      </div>
      
      <div class="login-footer">
        <div class="feature-badges">
          <div class="badge">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Sicher</span>
          </div>
          <div class="badge">
            <i class="fa-solid fa-bolt"></i>
            <span>Schnell</span>
          </div>
          <div class="badge">
            <i class="fa-solid fa-users"></i>
            <span>Community</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="login-background">
      <div class="floating-elements">
        <div class="element element-1"></div>
        <div class="element element-2"></div>
        <div class="element element-3"></div>
        <div class="element element-4"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      error: null,
    };
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const avatar = urlParams.get("avatar");

    if (avatar) {
      localStorage.setItem("avatar", avatar);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      this.$router.push("/checking");
    }

  },
  methods: {
    redirectToDiscordLogin() {
      const clientId = "1401315678518251641";
      const redirectUri = encodeURIComponent("http://localhost:3001/api/discord/callback");
      const scope = encodeURIComponent("identify guilds guilds.join");
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    },
  },
};
</script>

<style scoped>
/* Modern Login Page Styles */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
  overflow: hidden;
  padding: 1rem;
}

.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.15), transparent 60%),
    radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.1), transparent 60%),
    radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.08), transparent 60%);
  animation: glow 4s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.login-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 3rem;
  width: 100%;
  max-width: 480px;
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

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-logo {
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
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.login-title {
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

.login-subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  line-height: 1.6;
  margin: 0;
}

.login-form {
  margin-bottom: 2rem;
}

.discord-login-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #5865f2, #4752c4);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 25px rgba(88, 101, 242, 0.4);
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
  transform: translateZ(0);
}

.discord-login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.discord-login-btn:hover {
  background: linear-gradient(135deg, #4752c4, #3c4796);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 15px 35px rgba(88, 101, 242, 0.6);
}

.discord-login-btn:hover::before {
  left: 100%;
}

.discord-login-btn:active {
  transform: translateY(-1px) scale(1.01);
}

.discord-icon {
  font-size: 1.5rem;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.discord-login-btn:hover .btn-shine {
  left: 100%;
}

.login-divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.login-divider span {
  background: rgba(15, 23, 42, 0.9);
  color: rgba(255, 255, 255, 0.5);
  padding: 0 1rem;
  font-size: 0.875rem;
}

.alternative-login {
  text-align: center;
}

.alt-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.login-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.feature-badges {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.badge {
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.badge:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.badge i {
  color: #0ea5e9;
}

.login-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-elements {
  position: absolute;
  inset: 0;
}

.element {
  position: absolute;
  border-radius: 50%;
  background: rgba(14, 165, 233, 0.1);
  animation: float-random 10s infinite linear;
}

.element-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.element-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  background: rgba(249, 115, 22, 0.1);
  animation-delay: 2s;
}

.element-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  background: rgba(139, 92, 246, 0.1);
  animation-delay: 4s;
}

.element-4 {
  width: 100px;
  height: 100px;
  top: 30%;
  right: 30%;
  animation-delay: 6s;
}

@keyframes float-random {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-card {
    padding: 2rem 1.5rem;
    margin: 1rem;
    max-width: none;
  }
  
  .login-title {
    font-size: 2rem;
  }
  
  .login-subtitle {
    font-size: 1rem;
  }
  
  .discord-login-btn {
    padding: 0.875rem 1.25rem;
    font-size: 1rem;
  }
  
  .feature-badges {
    gap: 0.5rem;
  }
  
  .badge {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }
  
  .login-card {
    padding: 1.5rem 1rem;
  }
  
  .logo-icon {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
  
  .feature-badges {
    flex-direction: column;
    align-items: center;
  }
  
  .badge {
    width: 100%;
    justify-content: center;
  }
}
</style>