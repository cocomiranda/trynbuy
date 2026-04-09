import Image from "next/image";
import Link from "next/link";

type SiteNavProps = {
  current?: "account" | "home" | "shoes";
};

const linkClass =
  "transition hover:text-stone-900";

export function SiteNav({ current }: SiteNavProps) {
  return (
    <nav className="flex flex-col items-center gap-4 py-2 sm:flex-row sm:justify-between">
      <Link href="/" className="flex items-center justify-center">
        <Image
          src="/try-n-buy-logo-v2.png"
          alt="Try ’n Buy"
          width={180}
          height={90}
          priority
          className="h-auto w-[180px]"
        />
      </Link>

      <div className="flex items-center gap-5 text-sm font-medium text-stone-600">
        <Link
          href="/"
          className={`${linkClass} ${current === "home" ? "text-stone-950" : ""}`}
        >
          Home
        </Link>
        <Link href="/#how-it-works" className={linkClass}>
          How It Works
        </Link>
        <Link
          href="/shoes"
          className={`${linkClass} ${current === "shoes" ? "text-stone-950" : ""}`}
        >
          Shoes
        </Link>
        <Link
          href="/account"
          className={`${linkClass} ${current === "account" ? "text-stone-950" : ""}`}
        >
          My account
        </Link>
      </div>
    </nav>
  );
}
