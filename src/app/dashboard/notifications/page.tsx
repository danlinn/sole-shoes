import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { getNotifications } from "@/lib/actions/notification-actions";
import { format } from "date-fns";
import { NotificationActions, MarkAllReadButton } from "./notification-actions";

const typeLabels: Record<string, string> = {
  NEW_MATCH_REQUEST: "Match Request",
  NEW_MESSAGE: "Message",
  AI_MATCH_FOUND: "AI Match",
  LISTING_STATUS_CHANGE: "Status Update",
  REPORT_UPDATE: "Report",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const notifications = await getNotifications();
  const hasUnread = notifications.some((n: Awaited<ReturnType<typeof getNotifications>>[number]) => !n.readAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay up to date with your shoe matches.
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification: Awaited<ReturnType<typeof getNotifications>>[number]) => (
            <Card
              key={notification.id}
              className={notification.readAt ? "opacity-60" : "border-primary/20"}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-transparent" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{notification.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeLabels[notification.type] ?? notification.type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(notification.createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {!notification.readAt && (
                  <NotificationActions notificationId={notification.id} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
