"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateShoePost } from "@/lib/actions/post-actions";
import type { ShoePostInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { SHOE_CATEGORIES, SHOE_CONDITIONS } from "@/lib/shoe-listing-constants";

type PostPayload = {
  id: string;
  type: "LOST" | "FOUND";
  title: string;
  description: string;
  brand: string;
  model: string | null;
  category: ShoePostInput["category"];
  size: string;
  primaryColor: string;
  secondaryColor: string | null;
  side: "LEFT" | "RIGHT";
  genderCategory: string | null;
  condition: ShoePostInput["condition"];
  locationText: string;
  dateOccurred: Date;
  reward: string | null;
  images: { imageUrl: string }[];
};

export function EditListingForm({
  post,
  cancelHref,
}: {
  post: PostPayload;
  cancelHref: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(
    post.images.map((i) => i.imageUrl)
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  const [form, setForm] = useState({
    type: post.type,
    title: post.title,
    description: post.description,
    brand: post.brand,
    model: post.model ?? "",
    category: post.category,
    size: post.size,
    primaryColor: post.primaryColor,
    secondaryColor: post.secondaryColor ?? "",
    side: post.side,
    genderCategory: post.genderCategory ?? "",
    condition: post.condition,
    locationText: post.locationText,
    dateOccurred: format(new Date(post.dateOccurred), "yyyy-MM-dd"),
    reward: post.reward ?? "",
  });

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addImageUrl() {
    const trimmed = newImageUrl.trim();
    if (trimmed && !imageUrls.includes(trimmed)) {
      setImageUrls((prev) => [...prev, trimmed]);
      setNewImageUrl("");
    }
  }

  function removeImageUrl(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const input: ShoePostInput = {
      type: form.type,
      title: form.title,
      description: form.description,
      brand: form.brand,
      model: form.model || undefined,
      category: form.category,
      size: form.size,
      primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor || undefined,
      side: form.side,
      genderCategory: form.genderCategory || undefined,
      condition: form.condition,
      locationText: form.locationText,
      dateOccurred: form.dateOccurred,
      reward: form.reward || undefined,
    };

    startTransition(async () => {
      const result = await updateShoePost(post.id, input, imageUrls);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/listings/${post.id}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href={cancelHref}>
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit listing</CardTitle>
          <CardDescription>
            Update the details below. Changes apply immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Listing Type</Label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="LOST"
                    checked={form.type === "LOST"}
                    onChange={() => updateField("type", "LOST")}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Lost</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="type"
                    value="FOUND"
                    checked={form.type === "FOUND"}
                    onChange={() => updateField("type", "FOUND")}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Found</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model (optional)</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => updateField("category", v as ShoePostInput["category"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => updateField("condition", v as ShoePostInput["condition"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOE_CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={form.size}
                  onChange={(e) => updateField("size", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Side</Label>
                <Select
                  value={form.side}
                  onValueChange={(v) => updateField("side", v as "LEFT" | "RIGHT")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEFT">Left</SelectItem>
                    <SelectItem value="RIGHT">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color (optional)</Label>
                <Input
                  id="secondaryColor"
                  value={form.secondaryColor}
                  onChange={(e) => updateField("secondaryColor", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genderCategory">Gender Category (optional)</Label>
              <Input
                id="genderCategory"
                value={form.genderCategory}
                onChange={(e) => updateField("genderCategory", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationText">Location</Label>
                <Input
                  id="locationText"
                  value={form.locationText}
                  onChange={(e) => updateField("locationText", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOccurred">Date Lost/Found</Label>
                <Input
                  id="dateOccurred"
                  type="date"
                  value={form.dateOccurred}
                  onChange={(e) => updateField("dateOccurred", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reward">Reward (optional)</Label>
              <Input
                id="reward"
                value={form.reward}
                onChange={(e) => updateField("reward", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Image URLs</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/shoe-image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addImageUrl}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {imageUrls.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {imageUrls.map((url, i) => (
                    <li
                      key={`${url}-${i}`}
                      className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm"
                    >
                      <span className="flex-1 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => removeImageUrl(i)}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                First image is the primary. Editing replaces all images with this list.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Saving..." : "Save changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={cancelHref}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
