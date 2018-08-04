import Vue from 'vue';
import VueRouter from 'vue-router';
import Buefy from 'buefy';
import VueResource from 'vue-resource';
import VeeValidate, { Validator } from 'vee-validate';
import VeeValidateEnglish from 'vee-validate/dist/locale/en';
// Styles
import 'buefy/lib/buefy.css';
//import './theme.css';
// Store
import store from './store';
// Components
import {GlobalComponents, LocalComponents, WikiComponents} from './components';
// Router
import router from './router';

// Mixins
Vue.use(VueRouter);
Vue.use(Buefy);
Vue.use(VueResource);

Validator.localize('en', VeeValidateEnglish);
Vue.use(VeeValidate);

// Http interceptors: Global response handler
Vue.http.interceptors.push(function(request, next) {
    next(res => {
        // on 401 send to login form
        if(res.status === 401 && res.url.substr(-6,6) !== "/login") {
            router.push({path: "/login"});
        }

        // if not 200 or 201, customize notification message
        if(!(res.status === 200 || res.status === 201)) {
            // on any other error, show a message
            if(res.body !== null) {
                if(res.body.hasOwnProperty("message")) {
                    let type = "danger";
                    switch(res.status) {
                        case 403:
                            router.push({path: "/login"});
                            if(res.body.message === undefined) {
                                res.body.message = "Not allowed."
                            }
                            break;
                        case 404:
                            type = "warning";
                            break;
                    }

                    this.$store.commit('setNotification', {
                        notification: {
                            type: type,
                            message: res.body.message
                        }
                    });
                } else {
                    this.$store.commit('setNotification', {
                        notification: {
                            type: "danger",
                            message: res.body
                        }
                    });
                }
            }
        }
        // if 401, log-in as anonymous
        /*if(res.status === 401 && res.url.substr(-6,6) !== "/login") {
            // refresh token
            return new Promise(resolve => {
                Vue.http.post(store.state.backendURL + "/user/login", {
                    username: "anonymous",
                    password: "anonymous"
                }).then(res => {
                    const base64Url = res.body.token.split('.')[1];
                    const base64 = base64Url.replace('-', '+').replace('_', '/');
                    const userData = JSON.parse(window.atob(base64));

                    store.commit('setUser', {
                        user: {
                            name: userData.id,
                            token: res.body.token,
                            exp: userData.exp
                        }
                    });

                    // re-send request
                    resolve(Vue.http(request));
                });
            });
        }*/

    });
});

// Http interceptors: Add Auth-Header if token present
Vue.http.interceptors.push(function (request, next) {
    if (store.state.user) {
        request.headers.set('Authorization', `Bearer ${store.state.user.token}`);
    }
    next();
});

new Vue({
    router,
    store,
    components: {LocalComponents, WikiComponents},
    el: '#app',
    render: h => h(GlobalComponents.App)
});
