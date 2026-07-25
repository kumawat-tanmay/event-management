import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h2 className="text-6xl font-display font-bold text-primary mb-4">404</h2>
      <h3 className="text-xl font-bold mb-2">Page Not Found</h3>
      <p className="text-muted-foreground mb-8 text-sm">Oops! The page you are looking for does not exist.</p>
      <Link 
        href="/"
        className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
