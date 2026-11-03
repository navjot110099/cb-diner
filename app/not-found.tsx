import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 text-center">
      <Logo />
      <p className="eyebrow mt-12 text-gold-deep">404</p>
      <h1 className="mt-3 font-display text-5xl font-semibold">This table isn’t set</h1>
      <p className="mt-3 max-w-sm text-stone">The page you’re looking for doesn’t exist or has moved.</p>
      <Link href="/menu" className="mt-8 inline-flex h-12 items-center rounded-full bg-espresso px-6 font-semibold text-ivory">
        See the menu
      </Link>
    </div>
  );
}
