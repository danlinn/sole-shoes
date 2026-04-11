"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { updatePostStatus, deleteShoePost } from "@/lib/actions/post-actions";
import type { PostStatus } from "@/generated/prisma";

const statusOptions: { label: string; value: PostStatus }[] = [
  { label: "Open", value: "OPEN" },
  { label: "Potential Match", value: "POTENTIAL_MATCH" },
  { label: "Matched", value: "MATCHED" },
  { label: "Closed", value: "CLOSED" },
];

export function ListingActions({
  listingId,
  currentStatus,
}: {
  listingId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStatusChange(status: PostStatus) {
    startTransition(async () => {
      await updatePostStatus(listingId, status);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    startTransition(async () => {
      await deleteShoePost(listingId);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions
          .filter((o) => o.value !== currentStatus)
          .map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
            >
              Set as {option.label}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
