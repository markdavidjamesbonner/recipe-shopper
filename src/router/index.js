import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const base = import.meta.env.BASE_URL
const router = createRouter({
  // Hash mode so /recipes works on GitHub Pages (no 404 on refresh)
  history: createWebHashHistory(base),
  routes: [
    {
      path: '/',
      redirect: { name: 'recipes' },
    },
    {
      path: '/index.html',
      redirect: { name: 'recipes' },
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('../views/RecipesView.vue'),
    },
  ],
})

// Fix pathname when it wrongly contains /recipes (e.g. .../recipe_shopper/recipes#/recipes).
// In hash mode the pathname must be only the base; otherwise refresh returns 404.
router.beforeEach((to, from, next) => {
  const pathname = window.location.pathname
  const basePath = base.replace(/\/?$/, '') // e.g. /sandbox/recipe_shopper
  const isCorrectPath =
    pathname === basePath ||
    pathname === basePath + '/' ||
    pathname === basePath + '/index.html'
  if (!isCorrectPath && pathname.startsWith(basePath)) {
    const hash = window.location.hash || '#/'
    window.location.replace(window.location.origin + basePath + '/' + (hash.startsWith('#') ? hash : '#' + hash))
    return
  }
  next()
})

export default router
