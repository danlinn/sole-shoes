"use client";

import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { sendMessage } from "@/lib/actions/message-actions";
import { useRouter } from "next/navigation";

export function MessageForm({ conversationId }: { conversationId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    const body = formData.get("body") as string;
    if (!body?.trim()) return;

    startTransition(async () => {
      await sendMessage(conversationId, body.trim());
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex items-center gap-2">
      <Input
        name="body"
        placeholder="Type a message..."
        autoComplete="off"
        disabled={isPending}
        className="flex-1"
      />
      <Button type="submit" size="icon" disabled={isPending}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
