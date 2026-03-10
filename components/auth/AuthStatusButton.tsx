"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function AuthStatusButton() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
        AUTH LOADING
      </span>
    );
  }

  if (!data?.user) {
    return (
      <Link
        href="/login"
        className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 hover:text-foreground/70"
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
      className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 hover:text-foreground/70"
      title={data.user.email || "Signed in"}
    >
      Logout
    </button>
  );
}
