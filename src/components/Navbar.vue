<template>
  <aside class="sidebar">
    <div class="logo">
      <h1>HOPE LEAKS</h1>
    </div>
    <nav class="nav-menu">
      <a
          v-for="cat in categories"
          :key="cat.id"
          href="#"
          :class="{ active: currentCategory === cat.id }"
          @click.prevent="onCategoryChange(cat.id)"
      >
        <i :class="cat.icon" style="margin-right: 8px;"></i>
        {{ cat.name }}
      </a>
    </nav>
    <div class="sidebar-footer">
      <button v-if="isAdmin" class="admin-btn" @click="onOpenAdminDashboard">
        <i class="fa-solid fa-gauge" style="margin-right: 6px;"></i>
        Admin Dashboard
      </button>
      <button class="logout-btn" @click="logout">
        <i class="fa-solid fa-right-from-bracket" style="margin-right: 6px;"></i>
        Logout
      </button>
    </div>
  </aside>
</template>

<script>
import Cookies from "js-cookie";
export default {
  props: {
    currentCategory: {
      type: String,
      required: true
    },
    onCategoryChange: {
      type: Function,
      required: true
    },
    isAdmin: {
      type: Boolean,
      required: true
    },
    onOpenAdminDashboard: {
      type: Function,
      required: true
    },
    categories: {
      type: Array,
      required: true
    }
  },
  methods: {
    logout() {
      Cookies.remove("token");
      Cookies.remove("refreshToken");
      this.$router.push("/");
    },
  }
};
</script>

<style scoped>
@import '@/assets/navbar.css';
</style>