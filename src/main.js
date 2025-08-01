import '@/assets/main.css'
import '@/assets/app.css'
import '@/assets/login.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/router.js'

createApp(App).use(router).mount('#app')