'use client';

import React, { useEffect, useState } from 'react';

/**
 * 🛡️ Hydration Guard
 * Prevents "Hydration Mismatch" errors by ensuring the component 
 * only renders on the client side after the initial mount.
 */
export default function HydrationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return null or a skeleton/loading state during server-side rendering
    return null; 
  }

  return <>{children}</>;
}
