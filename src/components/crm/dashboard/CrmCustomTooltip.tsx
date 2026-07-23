export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  amber: 'hsl(38, 92%, 50%)',
  blue: 'hsl(217, 91%, 60%)',
  emerald: 'hsl(160, 84%, 44%)',
  violet: 'hsl(263, 70%, 50%)',
  rose: 'hsl(350, 89%, 60%)',
  orange: 'hsl(25, 95%, 53%)',
};

export const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl">
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};
