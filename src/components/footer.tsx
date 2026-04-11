import Link from "next/link";
import { Footprints } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Footprints className="h-5 w-5 text-primary" />
            Sole Shoes
          </Link>
          <p className="text-sm text-muted-foreground">
            Reuniting lost shoes with their matching counterparts.
          </p>
        </div>
      </div>
    </footer>
  );
}
