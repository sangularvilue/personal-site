import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-rise">
        <h1 className="font-serif text-sand text-[clamp(2rem,5vw,3.5rem)] font-medium mb-4">
          404
        </h1>
        <p className="font-serif text-text-soft text-lg italic mb-8">
          Plot Twist: This page was dead the whole time!
        </p>
        <Link
          href="/"
          className="text-sm text-teal hover:text-text transition-colors font-mono"
        >
          &larr; back to the living
        </Link>
      </div>
    </main>
  );
}
