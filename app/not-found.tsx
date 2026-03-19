import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-sand/[0.03] blur-[80px] pointer-events-none" />
      <div className="text-center animate-rise glass px-12 py-10">
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
