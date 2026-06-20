interface PageBannerProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function PageBanner({ title, subtitle, badge }: PageBannerProps) {
  return (
    <section className="border-b border-white/[0.08] bg-[#0c0818]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {badge && (
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">{badge}</p>
        )}
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/50 mt-3 text-base sm:text-lg max-w-2xl">{subtitle}</p>}
      </div>
    </section>
  );
}
