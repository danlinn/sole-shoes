import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to site
            </Link>
          </Button>
        </div>
      </header>
      <nav className="border-b bg-background">
        <div className="container mx-auto flex gap-4 px-4">
          <Link
            href="/admin"
            className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/reports"
            className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            Reports
          </Link>
          <Link
            href="/admin/posts"
            className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            Listings
          </Link>
          <Link
            href="/admin/users"
            className="border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            Users
          </Link>
        </div>
      </nav>
      <Separator />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
