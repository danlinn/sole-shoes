import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ShoppingBag,
  PackageOpen,
  Handshake,
  Flag,
  Sparkles,
} from "lucide-react";
import { getAdminStats } from "@/lib/actions/admin-actions";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const metrics = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
    },
    {
      title: "Total Listings",
      value: stats.totalListings.toLocaleString(),
      icon: ShoppingBag,
    },
    {
      title: "Open Listings",
      value: stats.openListings.toLocaleString(),
      icon: PackageOpen,
    },
    {
      title: "Confirmed Matches",
      value: stats.confirmedMatches.toLocaleString(),
      icon: Handshake,
    },
    {
      title: "Open Reports",
      value: stats.openReports.toLocaleString(),
      icon: Flag,
    },
    {
      title: "AI Acceptance Rate",
      value: `${stats.acceptanceRate}%`,
      description: `${stats.confirmedSuggestions} of ${stats.totalSuggestions} suggestions`,
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
