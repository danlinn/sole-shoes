"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createShoePost } from "@/lib/actions/post-actions";
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

const CATEGORIES = [
  { value: "SNEAKER", label: "Sneaker" },
  { value: "BOOT", label: "Boot" },
  { value: "SANDAL", label: "Sandal" },
  { value: "HEEL", label: "Heel" },
  { value: "LOAFER", label: "Loafer" },
  { value: "DRESS_SHOE", label: "Dress Shoe" },
  { value: "ATHLETIC", label: "Athletic" },
  { value: "SLIPPER", label: "Slipper" },
  { value: "OTHER", label: "Other" },
] as const;

const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "WORN", label: "Worn" },
] as const;

export default function NewListingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [form, setForm] = useState({
    type: "LOST" as "LOST" | "FOUND",
    title: "",
    description: "",
    brand: "",
    model: "",
    category: "SNEAKER" as ShoePostInput["category"],
    size: "",
    primaryColor: "",
    secondaryColor: "",
    side: "LEFT" as "LEFT" | "RIGHT",
    genderCategory: "",
    condition: "GOOD" as ShoePostInput["condition"],
    locationText: "",
    dateOccurred: "",
    reward: "",
  });

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      const result = await createShoePost(input, imageUrls);
      if (result.error) {
        setError(result.error);
      } else if (result.postId) {
        router.push(`/listings/${result.postId}`);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to listings
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Post a Shoe</CardTitle>
          <CardDescription>
            Fill out the details below to create a new listing for a lost or found shoe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Type */}
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

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Lost red Nike Air Max left shoe"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the shoe in detail - any distinguishing marks, where you lost/found it, etc."
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                required
              />
            </div>

            {/* Brand & Model */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g. Nike"
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model (optional)</Label>
                <Input
                  id="model"
                  placeholder="e.g. Air Max 90"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                />
              </div>
            </div>

            {/* Category & Condition */}
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
                    {CATEGORIES.map((c) => (
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
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Size & Side */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  placeholder="e.g. 10, 42, 8.5"
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

            {/* Colors */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <Input
                  id="primaryColor"
                  placeholder="e.g. Red"
                  value={form.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color (optional)</Label>
                <Input
                  id="secondaryColor"
                  placeholder="e.g. White"
                  value={form.secondaryColor}
                  onChange={(e) => updateField("secondaryColor", e.target.value)}
                />
              </div>
            </div>

            {/* Gender Category */}
            <div className="space-y-2">
              <Label htmlFor="genderCategory">Gender Category (optional)</Label>
              <Input
                id="genderCategory"
                placeholder="e.g. Men, Women, Unisex, Kids"
                value={form.genderCategory}
                onChange={(e) => updateField("genderCategory", e.target.value)}
              />
            </div>

            {/* Location & Date */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="locationText">Location</Label>
                <Input
                  id="locationText"
                  placeholder="e.g. Central Park, NYC"
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

            {/* Reward */}
            <div className="space-y-2">
              <Label htmlFor="reward">Reward (optional)</Label>
              <Input
                id="reward"
                placeholder="e.g. $20, Coffee, Eternal gratitude"
                value={form.reward}
                onChange={(e) => updateField("reward", e.target.value)}
              />
            </div>

            {/* Image URLs */}
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
                      key={i}
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
                Add URLs for images of the shoe. The first image will be used as the primary image.
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Creating..." : "Create Listing"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
