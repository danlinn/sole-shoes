import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  MessageSquare,
  Sparkles,
  Bell,
  ArrowRight,
} from "lucide-react";
import { getUnreadCount } from "@/lib/actions/message-actions";
import { getUnreadNotificationCount } from "@/lib/actions/notification-actions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [
    totalListings,
    activeListings,
    matchRequestsReceived,
    unreadMessages,
    unreadNotifications,
    pendingSuggestions,
  ] = await Promise.all([
    db.shoePost.count({ where: { userId } }),
    db.shoePost.count({ where: { userId, status: { in: ["OPEN", "POTENTIAL_MATCH"] } } }),
    db.matchRequest.count({ where: { receiverId: userId, status: "PENDING" } }),
    getUnreadCount(),
    getUnreadNotificationCount(),
    db.matchSuggestion.count({
      where: { sourcePost: { userId }, status: "SUGGESTED" },
    }),
  ]);

  const stats = [
    {
      title: "Total Listings",
      value: totalListings,
      description: "All your shoe posts",
      icon: ClipboardList,
      href: "/dashboard/listings",
    },
    {
      title: "Active Listings",
      value: activeListings,
      description: "Open and potential matches",
      icon: ClipboardList,
      href: "/dashboard/listings",
    },
    {
      title: "Match Requests",
      value: matchRequestsReceived,
      description: "Pending requests received",
      icon: Sparkles,
      href: "/dashboard/messages",
    },
    {
      title: "Unread Messages",
      value: unreadMessages,
      description: "Messages awaiting your reply",
      icon: MessageSquare,
      href: "/dashboard/messages",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {session.user.name}</h1>
        <p className="text-muted-foreground">
          Here is an overview of your Sole Shoes activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {unreadNotifications > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {unreadNotifications} unread notification{unreadNotifications !== 1 ? "s" : ""}.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/notifications">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {pendingSuggestions > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI found {pendingSuggestions} potential match{pendingSuggestions !== 1 ? "es" : ""} for your listings.
              </p>
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href="/dashboard/ai-suggestions">
                  Review <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
