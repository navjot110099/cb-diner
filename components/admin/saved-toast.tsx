"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** Shows "Saved" once after a redirect from the dish form, then cleans the URL. */
export function SavedToast({ saved, deleted }: { saved?: string; deleted?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!saved && !deleted) return;
    if (saved) toast.success(`Saved “${saved}”`, { description: "Guests see the change on the menu right away." });
    if (deleted) toast.success("Dish deleted");
    router.replace("/admin", { scroll: false });
  }, [saved, deleted, router]);
  return null;
}
