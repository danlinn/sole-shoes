import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, ArrowRight } from "lucide-react";
import { getUserSuggestions } from "@/lib/actions/suggestion-actions";
import { SuggestionActions } from "./suggestion-actions";

export default async function AISuggestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const suggestions = await getUserSuggestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Potential matches our AI found for your listings.
        </p>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No AI suggestions right now.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back later as new listings are posted.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion: Awaited<ReturnType<typeof getUserSuggestions>>[number]) => (
            <Card key={suggestion.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Match Score: {Math.round(suggestion.score * 100)}%
                  </CardTitle>
                  <Badge variant="secondary">AI Suggested</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {suggestion.explanation}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Source post (user's listing) */}
                  <Link
                    href={`/listings/${suggestion.sourcePost.id}`}
                    className="group"
                  >
                    <div className="rounded-lg border p-3 transition-colors group-hover:bg-muted/50">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Your Listing
                      </p>
                      <div className="flex items-center gap-3">
                        {suggestion.sourcePost.images[0] ? (
                          <img
                            src={suggestion.sourcePost.images[0].imageUrl}
                            alt={suggestion.sourcePost.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs">
                            No img
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {suggestion.sourcePost.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.sourcePost.brand} &middot;{" "}
                            {suggestion.sourcePost.side} &middot; Size{" "}
                            {suggestion.sourcePost.size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Candidate post */}
                  <Link
                    href={`/listings/${suggestion.candidatePost.id}`}
                    className="group"
                  >
                    <div className="rounded-lg border p-3 transition-colors group-hover:bg-muted/50">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Potential Match
                      </p>
                      <div className="flex items-center gap-3">
                        {suggestion.candidatePost.images[0] ? (
                          <img
                            src={suggestion.candidatePost.images[0].imageUrl}
                            alt={suggestion.candidatePost.title}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs">
                            No img
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {suggestion.candidatePost.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.candidatePost.brand} &middot;{" "}
                            {suggestion.candidatePost.side} &middot; Size{" "}
                            {suggestion.candidatePost.size}
                          </p>
                          {suggestion.candidatePost.user && (
                            <p className="text-xs text-muted-foreground">
                              by {suggestion.candidatePost.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <Separator />

                <SuggestionActions suggestionId={suggestion.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
