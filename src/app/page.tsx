import { Suspense } from "react";
import { ShoeCard } from "@/components/shoe-card";
import { SearchFilters } from "@/components/search-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Footprints, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getRecentPosts } from "@/lib/actions/post-actions";

function ShoeGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

async function ShoeGrid({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const result = await getRecentPosts({
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    type: searchParams.type,
    category: searchParams.category,
    side: searchParams.side,
    size: searchParams.size,
    color: searchParams.color,
    search: searchParams.search,
  });

  if (result.posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Search className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No shoes found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or post a new listing.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/listings/new">Post a Shoe</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.posts.map((post) => (
          <ShoeCard key={post.id} post={post} />
        ))}
      </div>
      {result.pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === result.page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link
                href={`/?${new URLSearchParams({
                  ...searchParams,
                  page: p.toString(),
                } as Record<string, string>).toString()}`}
              >
                {p}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div>
      {!hasFilters && (
        <section className="relative isolate overflow-hidden py-16 sm:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 bg-[url('/images/hero-shoes.png')] bg-cover bg-[center_40%] bg-no-repeat"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/92 via-background/78 to-background"
          />
          <div className="relative z-0 mx-auto max-w-7xl px-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background/80 shadow-sm ring-1 ring-border backdrop-blur-sm">
              <Footprints className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance drop-shadow-sm sm:text-5xl">
              Lost a shoe? Found one?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty drop-shadow-sm">
              Sole Shoes helps reunite single lost shoes with their matching
              counterpart. Post a listing, browse matches, and reconnect with
              your missing shoe.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/listings/new">
                  Post a Shoe
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-background/60 backdrop-blur-sm" asChild>
                <Link href="#browse">Browse Listings</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section id="browse" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {hasFilters ? "Search Results" : "Recently Posted"}
          </h2>
        </div>

        <Suspense>
          <SearchFilters />
        </Suspense>

        <div className="mt-6">
          <Suspense fallback={<ShoeGridSkeleton />}>
            <ShoeGrid searchParams={params} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
