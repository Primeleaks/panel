import { createRouter, createWebHistory } from 'vue-router';

import Login from '@/sites/login.vue';
import Checking from '@/sites/checking.vue';
import Main from '@/sites/main.vue'

import axios from 'axios';

const routes = [
    { path: '/', component: Login, meta: { title: 'Hopeleaks | Login', bodyClass: 'public', requiresAuth: false} },
    { path: '/checking', component: Checking, meta: { title: 'Hopeleaks | Login', bodyClass: 'public', requiresAuth: false} },
    { path: '/main', component: Main, meta: { title: 'Hopeleaks', bodyClass: 'public', requiresAuth: true} }, // SPäter aus true
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    document.body.className = '';

    if (to.meta.bodyClass) {
        document.body.classList.add(to.meta.bodyClass);
    }
    if (to.meta.title) {
        document.title = to.meta.title;
    }

    if (to.meta.requiresAuth) {
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find(cookie => cookie.startsWith("token="));

        if(!tokenCookie) {
            return next("/");
        }
        next();
    } else {
        next();
    }
});

export default router;
