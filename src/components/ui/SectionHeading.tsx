interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8 min-w-0">
      <div className="min-w-0">
        <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">{title}</h2>
        {subtitle && <p className="text-white/45 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
