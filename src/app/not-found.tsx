import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-black text-white/20 mb-4">404</p>
      <p className="text-white/45 mb-6">Page not found.</p>
      <Link href="/" className="px-5 py-2.5 bg-white text-[#0a0612] text-sm font-semibold hover:bg-white/90">
        Back home
      </Link>
    </div>
  );
}
