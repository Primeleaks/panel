 <template>
  <div className="login-container">
    <div className="login-card">
      <h1>HOPE LEAKS</h1>
      <p>Melde dich an, um fortzufahren</p>
      <button className="discord-btn" @click="redirectToDiscordLogin">
        <i class="fa-brands fa-discord"></i>
        Mit Discord anmelden
      </button>
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
      const clientId = "1355715825482338415";
      const redirectUri = encodeURIComponent("https://api.hopeleaks.xyz/api/discord/callback");
      const scope = encodeURIComponent("identify guilds guilds.join");
      window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    },
  },
};
</script>

<style scoped>
@import "@/assets/login.css";
</style>