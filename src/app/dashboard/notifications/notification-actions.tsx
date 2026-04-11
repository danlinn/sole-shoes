"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, CheckCheck } from "lucide-react";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notification-actions";

export function NotificationActions({
  notificationId,
}: {
  notificationId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkRead() {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleMarkRead}
      disabled={isPending}
    >
      <Check className="mr-1 h-3 w-3" />
      Read
    </Button>
  );
}

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={isPending}>
      <CheckCheck className="mr-2 h-4 w-4" />
      Mark All Read
    </Button>
  );
}
