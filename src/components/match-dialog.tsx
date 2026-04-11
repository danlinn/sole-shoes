"use client";

import { useState, useTransition } from "react";
import { sendMatchRequest } from "@/lib/actions/match-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Send } from "lucide-react";

interface MatchDialogProps {
  shoePostId: string;
}

export function MatchDialog({ shoePostId }: MatchDialogProps) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (message.trim().length < 5) {
      setError("Message must be at least 5 characters");
      return;
    }

    startTransition(async () => {
      const result = await sendMatchRequest(shoePostId, message.trim());
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold">Match Request Sent!</h3>
          <p className="text-center text-sm text-muted-foreground">
            The listing owner has been notified. You can continue the conversation
            in your messages.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          I Have the Match!
        </CardTitle>
        <CardDescription>
          Think you have the matching shoe? Send a message to the listing owner to
          start a conversation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="match-message">Your Message</Label>
            <Textarea
              id="match-message"
              placeholder="Describe how you think your shoe matches this listing. Include any details that could help verify the match..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              minLength={5}
            />
          </div>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Sending..." : "Send Match Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
