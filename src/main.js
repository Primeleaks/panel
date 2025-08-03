import '@/assets/main.css'
import '@/assets/app.css'
import '@/assets/login.css'
import '@/assets/animations.css'
import '@/assets/responsive.css'
import '@/assets/components.css'
import '@/assets/uiverse.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/router.js'

createApp(App).use(router).mount('#app')