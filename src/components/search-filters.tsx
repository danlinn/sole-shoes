"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState, useCallback } from "react";

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
];

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilter("search", searchValue);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/");
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 gap-2" style={{ minWidth: "200px" }}>
        <Input
          placeholder="Search shoes..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="max-w-sm"
        />
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <Select
        value={searchParams.get("type") || "ALL"}
        onValueChange={(v: string | null) => updateFilter("type", v || "ALL")}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="LOST">Lost</SelectItem>
          <SelectItem value="FOUND">Found</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("side") || "ALL"}
        onValueChange={(v: string | null) => updateFilter("side", v || "ALL")}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Side" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Both Sides</SelectItem>
          <SelectItem value="LEFT">Left</SelectItem>
          <SelectItem value="RIGHT">Right</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("category") || "ALL"}
        onValueChange={(v: string | null) => updateFilter("category", v || "ALL")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
