interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight">{title}</h2>
        {subtitle && <p className="text-white/45 mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
