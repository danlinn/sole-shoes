import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPostById } from "@/lib/actions/post-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MatchDialog } from "@/components/match-dialog";
import { ListingOwnerControls } from "./owner-controls";
import {
  MapPin,
  Calendar,
  ArrowLeft,
  Tag,
  Palette,
  Ruler,
  Sparkles,
  User,
  Gift,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

function formatCondition(condition: string) {
  const map: Record<string, string> = {
    NEW: "New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
    WORN: "Worn",
  };
  return map[condition] ?? condition;
}

function formatCategory(category: string) {
  const map: Record<string, string> = {
    SNEAKER: "Sneaker",
    BOOT: "Boot",
    SANDAL: "Sandal",
    HEEL: "Heel",
    LOAFER: "Loafer",
    DRESS_SHOE: "Dress Shoe",
    ATHLETIC: "Athletic",
    SLIPPER: "Slipper",
    OTHER: "Other",
  };
  return map[category] ?? category;
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    OPEN: "Open",
    POTENTIAL_MATCH: "Potential Match",
    MATCHED: "Matched",
    CLOSED: "Closed",
  };
  return map[status] ?? status;
}

function statusVariant(status: string) {
  if (status === "MATCHED") return "default" as const;
  if (status === "POTENTIAL_MATCH") return "secondary" as const;
  if (status === "CLOSED") return "outline" as const;
  return "outline" as const;
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const showMatch = sp.match === "true";

  const [post, session] = await Promise.all([getPostById(id), auth()]);

  if (!post) {
    notFound();
  }

  const isOwner = session?.user?.id === post.userId;
  const isAdmin = Boolean(session?.user?.isAdmin);
  const canManageListing = isOwner || isAdmin;
  const canMatch =
    !isOwner &&
    !!session?.user?.id &&
    (post.status === "OPEN" || post.status === "POTENTIAL_MATCH");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to listings
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image gallery */}
          {post.images.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="grid gap-2 p-2">
                {/* Primary image */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={post.images[0].imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                  />
                </div>
                {/* Additional images */}
                {post.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {post.images.slice(1).map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square overflow-hidden rounded-md bg-muted"
                      >
                        <Image
                          src={img.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 33vw, 20vw"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex aspect-video items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">No images available</p>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={post.type === "LOST" ? "destructive" : "default"}
                    >
                      {post.type === "LOST" ? "Lost" : "Found"}
                    </Badge>
                    <Badge variant="secondary">
                      {post.side === "LEFT" ? "Left" : "Right"} Shoe
                    </Badge>
                    {post.status !== "OPEN" && (
                      <Badge variant={statusVariant(post.status)}>
                        {formatStatus(post.status)}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                </div>
                {post.reward && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                  >
                    <Gift className="h-3 w-3" />
                    Reward: {post.reward}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {post.description}
              </p>

              <Separator />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">
                    {post.brand}
                    {post.model ? ` ${post.model}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{post.size}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Color:</span>
                  <span className="font-medium">
                    {post.primaryColor}
                    {post.secondaryColor ? ` / ${post.secondaryColor}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{formatCategory(post.category)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Condition:</span>
                  <span className="font-medium">{formatCondition(post.condition)}</span>
                </div>
                {post.genderCategory && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium">{post.genderCategory}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{post.locationText}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {format(new Date(post.dateOccurred), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                Posted{" "}
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          {post.sourceSuggestions && post.sourceSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  AI-Suggested Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {post.sourceSuggestions.map((suggestion) => {
                    const candidate = suggestion.candidatePost;
                    const candidateImage =
                      candidate.images[0]?.imageUrl || "/placeholder-shoe.svg";
                    return (
                      <Link
                        key={suggestion.id}
                        href={`/listings/${candidate.id}`}
                        className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={candidateImage}
                            alt={candidate.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-tight">
                            {candidate.title}
                          </p>
                          {suggestion.explanation && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {suggestion.explanation}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {Math.round(suggestion.score * 100)}% match
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Poster info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posted by
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {post.user.name
                      ? post.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{post.user.name || "Anonymous"}</p>
                  <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {post.user.city && <span>{post.user.city}</span>}
                    <span>
                      Member since{" "}
                      {format(new Date(post.user.createdAt), "MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner / admin controls */}
          {canManageListing && (
            <ListingOwnerControls
              postId={post.id}
              status={post.status}
              variant={isAdmin && !isOwner ? "admin" : "owner"}
            />
          )}

          {/* Match action */}
          {canMatch && (showMatch ? (
            <MatchDialog shoePostId={post.id} />
          ) : (
            <Card>
              <CardContent className="py-6">
                <Button className="w-full" size="lg" asChild>
                  <Link href={`/listings/${post.id}?match=true`}>
                    I Have the Match!
                  </Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Think you have the matching shoe? Send a message to the owner.
                </p>
              </CardContent>
            </Card>
          ))}

          {!session?.user && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" className="font-medium text-primary underline">
                    Sign in
                  </Link>{" "}
                  to send a match request.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
