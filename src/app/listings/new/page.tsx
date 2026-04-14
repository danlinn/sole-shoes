"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { upload } from "@vercel/blob/client";
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
import { SHOE_CATEGORIES, SHOE_CONDITIONS } from "@/lib/shoe-listing-constants";

export default function NewListingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        uploaded.push(blob.url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Image upload failed. Try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Photos</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Add photos"}
              </Button>
              {imageUrls.length > 0 && (
                <ul className="mt-2 grid grid-cols-3 gap-2">
                  {imageUrls.map((url, i) => (
                    <li
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-md border bg-muted"
                    >
                      <Image
                        src={url}
                        alt={`Upload ${i + 1}`}
                        fill
                        sizes="(max-width: 640px) 33vw, 200px"
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(i)}
                        aria-label="Remove photo"
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-foreground opacity-0 shadow transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">
                          Primary
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                Upload photos of the shoe (JPEG, PNG, WebP, or GIF — up to 10MB each).
                The first photo will be used as the primary image.
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
