"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="h-11 rounded-full px-5">
      <Printer /> Print cards
    </Button>
  );
}
