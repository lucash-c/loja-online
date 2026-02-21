function normalizePublicKey(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractPublicKeyFromQuery(query = {}) {
  return normalizePublicKey(query.publicKey || query.key);
}

function removePublicKeyFromQuery(query = {}) {
  const { publicKey, key, ...remainingQuery } = query;
  return remainingQuery;
}

const routes = [
  {
    path: '/:publicKey',
    redirect: (to) => {
      const publicKey = normalizePublicKey(to.params?.publicKey);

      if (!publicKey || publicKey.toLowerCase() === 'r') {
        return {
          path: '/',
          query: to.query,
          replace: true,
        };
      }

      return {
        path: `/r/${encodeURIComponent(publicKey)}`,
        query: to.query,
        replace: true,
      };
    },
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    beforeEnter: (to) => {
      const publicKey = extractPublicKeyFromQuery(to.query);

      if (!publicKey) {
        return true;
      }

      return {
        path: `/r/${encodeURIComponent(publicKey)}`,
        query: removePublicKeyFromQuery(to.query),
        replace: true,
      };
    },
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ]
  },

  {
    path: '/r/:publicKey',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') }
    ]
  },

  {
    path: '/r/:publicKey/pedido-sucesso',
    component: () => import('layouts/SuccessLayout.vue'),
    children: [
      {
        path: '',
        name: 'order-success',
        component: () => import('src/pages/SuccessPage.vue')
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
