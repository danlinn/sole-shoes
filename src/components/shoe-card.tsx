"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ShoeCardProps {
  post: {
    id: string;
    type: string;
    title: string;
    brand: string;
    model?: string | null;
    size: string;
    side: string;
    primaryColor: string;
    locationText: string;
    status: string;
    createdAt: Date;
    images: { imageUrl: string }[];
    user: { name: string };
  };
}

export function ShoeCard({ post }: ShoeCardProps) {
  const imageUrl = post.images[0]?.imageUrl || "/placeholder-shoe.svg";

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={post.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant={post.type === "LOST" ? "destructive" : "default"}>
            {post.type === "LOST" ? "Lost" : "Found"}
          </Badge>
          <Badge variant="secondary">{post.side === "LEFT" ? "Left" : "Right"}</Badge>
        </div>
        {post.status !== "OPEN" && (
          <div className="absolute right-2 top-2">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              {post.status === "MATCHED" ? "Matched!" : post.status === "POTENTIAL_MATCH" ? "Potential Match" : "Closed"}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold leading-tight line-clamp-1">{post.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {post.brand}{post.model ? ` ${post.model}` : ""} &middot; Size {post.size}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {post.locationText}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/listings/${post.id}`}>View Details</Link>
          </Button>
          {post.status === "OPEN" || post.status === "POTENTIAL_MATCH" ? (
            <Button size="sm" className="flex-1" asChild>
              <Link href={`/listings/${post.id}?match=true`}>I Have the Match!</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
