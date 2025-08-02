import { createApp } from 'vue'
import { createStore } from 'vuex'
import App from './App.vue'
import router from './router/router.js'

// Import CSS files
import './assets/main.css'
import './assets/analytics.css'
import './assets/collection-card.css'
import './assets/animations.css'
import './assets/hero-background.css'

// Global components
import Modal from './components/Modal.vue'
import Loader from './components/Loader.vue'
import ToastNotification from './components/ToastNotification.vue'
import Button from './components/Button.vue'

// Import utilities
import './utils/websocket.js'

// Create custom directives
const clickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  }
};

const lazyLoad = {
  beforeMount(el, binding) {
    function loadImage() {
      const imageElement = Array.from(el.children).find(
        el => el.nodeName === 'IMG'
      );
      if (imageElement) {
        imageElement.addEventListener('load', () => {
          setTimeout(() => el.classList.add('loaded'), 100);
        });
        imageElement.addEventListener('error', () => console.log('error'));
        imageElement.src = binding.value;
      }
    }

    function handleIntersect(entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage();
          observer.unobserve(el);
        }
      });
    }

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
    observer.observe(el);
  }
};

// Create Vuex store
const store = createStore({
  state() {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false
    }
  },
  mutations: {
    setUser(state, user) {
      state.user = user
      state.isAuthenticated = !!user
      state.isAdmin = user?.isAdmin || false
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.isAdmin = false
    }
  },
  getters: {
    isAuthenticated(state) {
      return state.isAuthenticated
    },
    isAdmin(state) {
      return state.isAdmin
    },
    userId(state) {
      return state.user?.discord_id
    },
    user(state) {
      return state.user
    }
  }
})

// Create Vue app
const app = createApp(App)

// Use Vuex store
app.use(store)

// Use router
app.use(router)

// Register global components
app.component('Modal', Modal)
app.component('Loader', Loader)
app.component('ToastNotification', ToastNotification)
app.component('Button', Button)

// Register global directives
app.directive('click-outside', clickOutside)
app.directive('lazy-load', lazyLoad)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue error:', err, info)
  
  // You could send this to an error reporting service
  if (window.location.hostname !== 'localhost') {
    // Only log errors in production
    console.error('Production error:', err)
  }
}

// Global properties
app.config.globalProperties.$formatDate = (date) => {
  if (!date) return ''
  const now = new Date()
  const inputDate = new Date(date)
  const diffInMinutes = Math.floor((now - inputDate) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return inputDate.toLocaleDateString()
}

app.config.globalProperties.$formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num?.toString() || '0'
}

app.config.globalProperties.$truncateText = (text, length = 100) => {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Performance monitoring
if (process.env.NODE_ENV === 'development') {
  app.config.performance = true
}

// Mount the app
app.mount('#app')

// Service Worker registration for PWA features
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}
