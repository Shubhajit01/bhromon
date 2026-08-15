import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { createLogger } from './lib/logger';
import { routeTree } from './routeTree.gen';

const logger = createLogger('query-client');

export function getRouter() {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logger.error('query_client.mutation_failed', error, {
          mutationKey: mutation.options.mutationKey,
        });
      },
    }),
    queryCache: new QueryCache({
      onError: (error, query) => {
        logger.error('query_client.query_failed', error, {
          queryKey: query.queryKey,
        });
      },
    }),
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
