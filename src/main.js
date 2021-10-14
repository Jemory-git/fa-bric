import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { fabric } from "fabric"// https://gitee.com/eternitywith/fabric.js-docs-cn

console.log(fabric)
Vue.config.productionTip = false
Vue.prototype.$fbc = fabric;
window.fbc = fabric


let fns = {
  log(...rest) {// goutou 2020-8
    try {
      rest = rest.map(c => {
        return typeof c === 'function' || c === undefined || Object.is(NaN, c) ? c : JSON.parse(JSON.stringify(c));
      })
    } catch (error) {
      console && console.warn('该对象存在循环引用，无法stringify');
    }
    console && console.info(...rest);
  },
  isObject(o) {
    return typeof o === 'object' && o !== null && !Array.isArray(o);
  },
  deepCopy(o) {
    return JSON.parse(JSON.stringify(o));
  },
}
// 方法
Object.keys(fns).forEach(name => window[name] = fns[name])

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
