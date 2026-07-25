"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
      <h2 className="text-2xl font-bold font-display text-error mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-6 text-sm">{error.message || "An unexpected error occurred."}</p>
      <button
        onClick={() => reset()}
        className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
