import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, bgColor }: StatsCardProps) {
  return (
    <Card className="border border-gray-100" data-testid={`stats-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`${iconColor}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900" data-testid={`stats-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
