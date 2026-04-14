import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAdminPosts } from "@/lib/actions/admin-actions";
import { formatDistanceToNow } from "date-fns";
import { Pencil } from "lucide-react";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  const sp = await searchParams;
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;
  const { posts, pages, total } = await getAdminPosts(page, 25);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Listings</h2>
        <p className="text-sm text-muted-foreground">
          {total} total · Edit any listing as an administrator.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"> </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right"> </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const img = post.images[0]?.imageUrl;
            return (
              <TableRow key={post.id}>
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {post.title}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="block truncate">{post.user.name}</span>
                  <span className="text-xs">{post.user.email}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={post.type === "LOST" ? "destructive" : "default"}>
                    {post.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{post.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/listings/${post.id}/edit`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`/admin/posts?page=${p}`}>{p}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
