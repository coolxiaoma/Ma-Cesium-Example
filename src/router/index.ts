import { createRouter, createWebHistory } from 'vue-router'
import { examples } from '@/examples/registry'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: `/examples/${examples[0]?.id ?? 'hello-world'}`,
    },
    {
      path: '/examples/:id',
      name: 'example',
      component: () => import('@/views/ExampleView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
