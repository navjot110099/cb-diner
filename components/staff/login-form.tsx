"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type SignInState } from "@/app/staff/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null });
  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required className="h-11 rounded-xl bg-white" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 rounded-xl bg-white" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-12 rounded-xl text-base">
        {pending && <Loader2 className="animate-spin" />} Sign in
      </Button>
    </form>
  );
}
