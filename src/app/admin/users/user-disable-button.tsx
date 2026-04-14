"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setUserDisabled } from "@/lib/actions/admin-actions";
import { Loader2 } from "lucide-react";

export function UserDisableButton({
  userId,
  disabled,
  isSelf,
}: {
  userId: string;
  disabled: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground" title="You cannot disable your own account">
        —
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <span className="max-w-[12rem] text-right text-xs text-destructive">{error}</span>
      )}
      <Button
        type="button"
        variant={disabled ? "outline" : "destructive"}
        size="sm"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setUserDisabled(userId, !disabled);
            if ("error" in result) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
        {disabled ? "Enable" : "Disable"}
      </Button>
    </div>
  );
}
