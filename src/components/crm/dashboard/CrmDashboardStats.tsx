import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  border: string;
  loading?: boolean;
}

export const CrmStatCard = ({ title, value, icon: Icon, gradient, iconBg, border, loading }: StatCardProps) => (
  <Card className={`border ${border} bg-gradient-to-br ${gradient} overflow-hidden relative`}>
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-foreground/[0.02] to-transparent rounded-bl-full" />
    <CardContent className="p-4 sm:p-5 relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1.5 sm:mt-2 tracking-tight">
            {loading ? '–' : value}
          </p>
        </div>
        <div className={`p-2 sm:p-2.5 rounded-xl ${iconBg}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);
