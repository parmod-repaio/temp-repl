import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color: "blue" | "green" | "purple";
}

export default function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const bgColorMap = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
  };
  
  const trendColor = trend && trend.value >= 0 ? "text-green-500" : "text-red-500";
  const trendIcon = trend && trend.value >= 0 ? "↑" : "↓";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <span className={cn("rounded-full p-1 w-8 h-8 flex items-center justify-center", bgColorMap[color])}>
            {icon}
          </span>
        </div>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        {trend && (
          <p className="mt-2 text-sm text-gray-500">
            <span className={trendColor}>
              {trendIcon} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1">{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
