"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Signs out clients whose session indicates the account was disabled server-side.
 */
export function DisabledAccountHandler() {
  const { data: session, status } = useSession();
  const didSignOut = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!session.user.disabled || didSignOut.current) return;
    didSignOut.current = true;
    void signOut({ callbackUrl: "/login?disabled=1" });
  }, [session, status]);

  return null;
}
