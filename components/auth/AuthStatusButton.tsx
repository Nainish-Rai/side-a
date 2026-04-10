"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthStatusButton() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/65">
        AUTH LOADING
      </span>
    );
  }

  if (!data?.user) {
    return (
      <Link
        href="/login"
        className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/65 transition-colors hover:text-foreground/85"
      >
        Login
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/65 transition-colors hover:text-foreground/85"
      title={data.user.email || "Signed in"}
    >
      Logout
    </button>
  );
}
