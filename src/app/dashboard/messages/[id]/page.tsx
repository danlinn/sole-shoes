import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { getConversationMessages } from "@/lib/actions/message-actions";
import { format } from "date-fns";
import { MessageForm } from "./message-form";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const conversation = await getConversationMessages(id);
  if (!conversation) notFound();

  const otherUser =
    conversation.participantOne.id === session.user.id
      ? conversation.participantTwo
      : conversation.participantOne;

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser.image ?? undefined} />
          <AvatarFallback>
            {otherUser.name?.charAt(0)?.toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{otherUser.name}</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/listings/${conversation.shoePost.id}`}
              className="truncate text-xs text-muted-foreground hover:underline"
            >
              {conversation.shoePost.title}
            </Link>
            <Badge variant="outline" className="text-xs">
              {conversation.shoePost.type}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {conversation.messages.map((message: (typeof conversation.messages)[number]) => {
            const isOwn = message.senderId === session.user!.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[75%] gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                  {!isOwn && (
                    <Avatar className="mt-1 h-7 w-7 shrink-0">
                      <AvatarImage src={message.sender.image ?? undefined} />
                      <AvatarFallback>
                        {message.sender.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.body}
                    </div>
                    <p className={`mt-1 text-xs text-muted-foreground ${isOwn ? "text-right" : ""}`}>
                      {format(message.createdAt, "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Send form */}
      <div className="pt-4">
        <MessageForm conversationId={id} />
      </div>
    </div>
  );
}
