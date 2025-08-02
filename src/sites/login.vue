<template>
  <div class="login-container">
    <div class="login-card">
      <h1>HOPE LEAKS</h1>
      <p v-if="redirecting">Weiterleitung...</p>
      <div v-else>
        <p>Melde dich an, um fortzufahren</p>
        <button class="discord-btn" @click="redirectToDiscordLogin">
          <i class="fa-brands fa-discord"></i>
          Mit Discord anmelden
        </button>
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
      redirecting: false,
    };
  },
  created() {
    // Immediate check for avatar parameter
    this.checkAndRedirect();
  },
  methods: {
    checkAndRedirect() {
      console.log("Current URL:", window.location.href);
      
      const urlSearchParams = new URLSearchParams(window.location.search);
      const avatar = urlSearchParams.get('avatar');
      
      console.log("Avatar parameter found:", avatar);
      
      if (avatar) {
        console.log("Avatar detected, initiating redirect...");
        this.redirecting = true;
        
        // Store avatar in localStorage
        localStorage.setItem("avatar", avatar);
        
        // Clear URL parameters
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Redirect to checking page
        setTimeout(() => {
          console.log("Redirecting to checking page...");
          this.$router.replace("/checking");
        }, 500);
      }
    },
    redirectToDiscordLogin() {
      const clientId = "1377085186558132387";
      const redirectUri = encodeURIComponent("http://localhost:3001/api/discord/callback");
      const scope = encodeURIComponent("identify guilds guilds.join");
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    },
  },
};
</script>

<style scoped>
@import "@/assets/login.css";
</style>