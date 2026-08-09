import { useEffect } from 'react';

import { useRouter } from '@tanstack/react-router';

import NProgress from 'nprogress';

export default function NavigationProgress() {
  const router = useRouter();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.6 });

    const subs = [
      router.subscribe('onBeforeNavigate', () => NProgress.start()),
      router.subscribe('onResolved', () => NProgress.done()),
    ];

    return () => {
      NProgress.remove();
      subs.forEach((unsub) => unsub());
    };
  }, [router]);

  return null;
}
