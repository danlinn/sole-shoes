import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { ListingActions } from "./listing-actions";
import type { ShoePostModel as ShoePost, ShoeImageModel as ShoeImage } from "@/generated/prisma";

type ListingWithRelations = ShoePost & {
  images: ShoeImage[];
  _count: { matchRequests: number };
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "default",
  POTENTIAL_MATCH: "secondary",
  MATCHED: "outline",
  CLOSED: "destructive",
};

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  POTENTIAL_MATCH: "Potential Match",
  MATCHED: "Matched",
  CLOSED: "Closed",
};

export default async function ListingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const listings = await db.shoePost.findMany({
    where: { userId: session.user.id },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { matchRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your lost and found shoe posts.
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">You have not posted any listings yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/listings/new">Create Your First Listing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((listing: ListingWithRelations) => (
            <Card key={listing.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {listing.images[0] ? (
                  <img
                    src={listing.images[0].imageUrl}
                    alt={listing.title}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    No img
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{listing.title}</h3>
                    <Badge variant={statusVariant[listing.status] ?? "outline"}>
                      {statusLabel[listing.status] ?? listing.status}
                    </Badge>
                    <Badge variant="outline">{listing.type}</Badge>
                    <Badge variant="outline">{listing.side}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {listing.brand} &middot; Size {listing.size} &middot; {listing.primaryColor} &middot;{" "}
                    {format(listing.createdAt, "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {listing._count.matchRequests} match request{listing._count.matchRequests !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/listings/${listing.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/listings/${listing.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <ListingActions listingId={listing.id} currentStatus={listing.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
