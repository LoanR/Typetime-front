import Vue from 'vue';
import App from './App';
import VueRouter from 'vue-router';
import Landing from './components/Landing';
import About from './components/About';

Vue.use(VueRouter);

const routes = [
    {path: '/', component: Landing},
    {path: '/Typetime-front', component: Landing}, // gh-pages landing special case
    {path: '/about', component: About}
];

const router = new VueRouter({
    routes,
    mode: 'history'
});

Vue.config.productionTip = false;

new Vue({
    el: '#app',
    template: '<App/>',
    components: { App },
    router
}).$mount('#app');
