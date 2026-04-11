import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { getConversations } from "@/lib/actions/message-actions";
import { format } from "date-fns";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversations = await getConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Your conversations about shoe matches.
        </p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No conversations yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by sending a match request on a listing.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation: Awaited<ReturnType<typeof getConversations>>[number]) => {
            const otherUser =
              conversation.participantOne.id === session.user!.id
                ? conversation.participantTwo
                : conversation.participantOne;

            const lastMessage = conversation.messages[0];
            const isUnread =
              lastMessage &&
              lastMessage.senderId !== session.user!.id &&
              !lastMessage.readAt;

            return (
              <Link
                key={conversation.id}
                href={`/dashboard/messages/${conversation.id}`}
              >
                <Card className={`transition-colors hover:bg-muted/50 ${isUnread ? "border-primary/30 bg-primary/5" : ""}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser.image ?? undefined} />
                      <AvatarFallback>
                        {otherUser.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">
                          {otherUser.name ?? "Unknown User"}
                        </span>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {conversation.shoePost.title}
                      </p>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {lastMessage.senderId === session.user!.id ? "You: " : ""}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(lastMessage.createdAt, "MMM d")}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {conversation.shoePost.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
