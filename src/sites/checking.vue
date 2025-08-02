<template>
  <div class="login-container">
    <div class="login-card">
      <h1>HOPE LEAKS</h1>
      <p>Dein Account wird überprüft bitte warten!</p>
      <p>{{ status }}</p>
      <svg viewBox="25 25 50 50" class="loading-spinner">
        <circle r="20" cy="50" cx="50"></circle>
      </svg>
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
      checkingSteps: ["Checking for Blacklist...", "Create API-Token...", "Fetch Roles...", "Finish!"]
    };
  },
  mounted() {
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
        await this.sleep(800);
        const blacklistResponse = await fetch(`http://localhost:3001/api/blacklist/isBlacklisted/${discordId}`);
        const isBlacklisted = await blacklistResponse.json();

        if (isBlacklisted) {
          console.log("Nutzer ist auf der Blacklist");
          this.$router.push("/");
          return;
        }

        this.status = this.checkingSteps[1];
        await this.sleep(1000);

        this.status = this.checkingSteps[2];
        await this.sleep(800);

        this.status = this.checkingSteps[3];
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
@import "@/assets/login.css";

svg {
  width: 3.25em;
  transform-origin: center;
  animation: rotate4 2s linear infinite;
}

circle {
  fill: none;
  stroke: hsl(0, 0%, 100%);
  stroke-width: 2;
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash4 1.5s ease-in-out infinite;
}

@keyframes rotate4 {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash4 {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35px;
  }

  100% {
    stroke-dashoffset: -125px;
  }
}
</style>