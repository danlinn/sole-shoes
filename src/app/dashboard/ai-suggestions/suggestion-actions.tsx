"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import {
  dismissSuggestion,
  confirmSuggestion,
} from "@/lib/actions/suggestion-actions";

export function SuggestionActions({
  suggestionId,
}: {
  suggestionId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    startTransition(async () => {
      await confirmSuggestion(suggestionId);
      router.refresh();
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissSuggestion(suggestionId);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleConfirm} disabled={isPending} size="sm">
        <Check className="mr-2 h-4 w-4" />
        Confirm Match
      </Button>
      <Button
        variant="outline"
        onClick={handleDismiss}
        disabled={isPending}
        size="sm"
      >
        <X className="mr-2 h-4 w-4" />
        Dismiss
      </Button>
    </div>
  );
}
