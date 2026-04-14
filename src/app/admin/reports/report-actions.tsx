"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateReportStatus } from "@/lib/actions/admin-actions";
import { MoreHorizontal, Eye, CheckCircle, XCircle } from "lucide-react";
import type { ReportStatus } from "@/generated/prisma/enums";

const statusActions: {
  label: string;
  value: ReportStatus;
  icon: React.ElementType;
}[] = [
  { label: "Mark Reviewing", value: "REVIEWING", icon: Eye },
  { label: "Resolve", value: "RESOLVED", icon: CheckCircle },
  { label: "Dismiss", value: "DISMISSED", icon: XCircle },
];

export function ReportActions({
  reportId,
  currentStatus,
}: {
  reportId: string;
  currentStatus: ReportStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: ReportStatus) {
    startTransition(async () => {
      await updateReportStatus(reportId, status);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusActions
          .filter((action) => action.value !== currentStatus)
          .map((action) => (
            <DropdownMenuItem
              key={action.value}
              onClick={() => handleStatusChange(action.value)}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
