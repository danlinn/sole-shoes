"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteShoePost, updatePostStatus } from "@/lib/actions/post-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import type { PostStatus } from "@/generated/prisma/enums";

interface ListingOwnerControlsProps {
  postId: string;
  status: string;
}

export function ListingOwnerControls({
  postId,
  status,
}: ListingOwnerControlsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await updatePostStatus(postId, newStatus as PostStatus);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteShoePost(postId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Settings className="h-4 w-4" />
          Manage Listing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={status}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="POTENTIAL_MATCH">Potential Match</SelectItem>
              <SelectItem value="MATCHED">Matched</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            asChild
            disabled={isPending}
          >
            <Link href={`/listings/${postId}/edit`}>
              <Pencil className="mr-1 h-3 w-3" />
              Edit
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-3 w-3" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  listing and remove any associated match requests.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
