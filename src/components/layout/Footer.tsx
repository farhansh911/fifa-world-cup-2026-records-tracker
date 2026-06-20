import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] mt-24 bg-[#0c0818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <p className="font-display font-black text-lg mb-3">WC26 Records</p>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">
              Tracking records and milestones at FIFA World Cup 2026. Data updated after each match.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">Explore</p>
            <ul className="space-y-2 text-sm text-white/45">
              <li><Link href="/records/broken" className="hover:text-white transition-colors">Records Broken</Link></li>
              <li><Link href="/records/new" className="hover:text-white transition-colors">New Records</Link></li>
              <li><Link href="/timeline" className="hover:text-white transition-colors">Timeline</Link></li>
              <li><Link href="/golden-boot" className="hover:text-white transition-colors">Golden Boot</Link></li>
              <li><Link href="/stats" className="hover:text-white transition-colors">Statistics</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">More</p>
            <ul className="space-y-2 text-sm text-white/45">
              <li><Link href="/teams" className="hover:text-white transition-colors">Teams</Link></li>
              <li><Link href="/players" className="hover:text-white transition-colors">Players</Link></li>
              <li><Link href="/matches" className="hover:text-white transition-colors">Matches</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/30">
          <p>&copy; {new Date().getFullYear()} World Cup 2026 Records Tracker</p>
          <p>Not affiliated with FIFA.</p>
        </div>
      </div>
    </footer>
  );
}
