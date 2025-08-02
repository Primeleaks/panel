import { createRouter, createWebHistory } from 'vue-router';

import Login from '@/sites/login.vue';
import Checking from '@/sites/checking.vue';
import Main from '@/sites/main.vue';

// New components
import UserProfile from '@/components/UserProfile.vue';
import NotificationPanel from '@/components/NotificationPanel.vue';
import RatingSystem from '@/components/RatingSystem.vue';
import CommentSystem from '@/components/CommentSystem.vue';

// Collection components
import CollectionsView from '@/sites/collections.vue';
import CollectionView from '@/sites/collectionView.vue';

import axios from 'axios';

const routes = [
    { 
        path: '/', 
        component: Login, 
        meta: { title: 'Script Panel | Login', bodyClass: 'public', requiresAuth: false } 
    },
    { 
        path: '/checking', 
        component: Checking, 
        meta: { title: 'Script Panel | Checking', bodyClass: 'public', requiresAuth: false } 
    },
    { 
        path: '/main', 
        component: Main,  //ALLWAYS ON TRUE
        meta: { title: 'Script Panel | Dashboard', bodyClass: 'authenticated', requiresAuth: false } 
    },
    
    // User Profile Routes
    { 
        path: '/profile/:id?', 
        component: UserProfile, 
        meta: { title: 'Script Panel | Profile', bodyClass: 'authenticated', requiresAuth: true },
        props: true 
    },
    
    // Collections Routes
    { 
        path: '/collections', 
        component: CollectionsView, 
        meta: { title: 'Script Panel | Collections', bodyClass: 'authenticated', requiresAuth: false } 
    },
    { 
        path: '/collections/:id', 
        component: CollectionView, 
        meta: { title: 'Script Panel | Collection', bodyClass: 'authenticated', requiresAuth: false },
        props: true 
    },
    
    // Script Detail Routes (with comments and ratings)
    { 
        path: '/script/:id', 
        component: Main, // You might want to create a dedicated ScriptDetail component
        meta: { title: 'Script Panel | Script Details', bodyClass: 'authenticated', requiresAuth: true },
        props: true 
    },
    
    // Notifications Route
    { 
        path: '/notifications', 
        component: NotificationPanel, 
        meta: { title: 'Script Panel | Notifications', bodyClass: 'authenticated', requiresAuth: true } 
    },
    
    // Settings/Account Routes
    { 
        path: '/settings', 
        component: UserProfile, 
        meta: { title: 'Script Panel | Settings', bodyClass: 'authenticated', requiresAuth: true } 
    },
    
    // Search Results
    { 
        path: '/search', 
        component: Main, 
        meta: { title: 'Script Panel | Search Results', bodyClass: 'authenticated', requiresAuth: true } 
    },
    
    // Admin Routes (for future admin features)
    { 
        path: '/admin', 
        component: Main, // Replace with AdminDashboard when created
        meta: { title: 'Script Panel | Admin', bodyClass: 'authenticated', requiresAuth: true, requiresAdmin: true } 
    },
    
    // 404 Fallback
    { 
        path: '/:pathMatch(.*)*', 
        redirect: '/main', 
        meta: { requiresAuth: true } 
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, from, next) => {
    console.log("Router guard - navigating to:", to.path, "with query:", to.query);
    
    // Handle avatar parameter redirect at router level
    if (to.path === "/" && to.query.avatar) {
        console.log("Avatar parameter detected in router, redirecting to checking");
        localStorage.setItem("avatar", to.query.avatar);
        return next("/checking");
    }
    
    // Clear previous body classes
    document.body.className = '';

    // Add new body class
    if (to.meta.bodyClass) {
        document.body.classList.add(to.meta.bodyClass);
    }
    
    // Set page title
    if (to.meta.title) {
        document.title = to.meta.title;
    }

    // Check authentication
    if (to.meta.requiresAuth) {
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find(cookie => cookie.startsWith("token="));

        if (!tokenCookie) {
            return next("/");
        }

        // Additional admin check if required
        if (to.meta.requiresAdmin) {
            try {
                const token = tokenCookie.split("=")[1];
                const response = await axios.get('http://localhost:3001/api/auth/verify', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (!response.data.user.isAdmin) {
                    return next("/main");
                }
            } catch (error) {
                console.error('Admin verification failed:', error);
                return next("/");
            }
        }
    }
    
    next();
});

// Global navigation guard for tracking page views (analytics)
router.afterEach((to, from) => {
    // You can add analytics tracking here
    console.log(`Navigated from ${from.path} to ${to.path}`);
    
    // Track page view for analytics
    if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
            page_path: to.path,
            page_title: to.meta.title
        });
    }
});

export default router;
