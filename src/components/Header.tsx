"use client";
import Link from "next/link";
import Image from "next/image";
import { shadow } from "@/styles/utils";
import { Button } from "./ui/button";
import DarkModeToggle from "./dark-mode";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AuthUser } from "@supabase/supabase-js";

function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Get current user on mount
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header
      className="bg-popover text-popover-foreground relative flex h-24 w-full items-center justify-between px-3 sm:px-8"
      style={{
        boxShadow: shadow,
      }}
    >
      <Link href="/">
        <Image
          src="/logo-1.png"
          height={80}
          width={80}
          alt="Norate AI Logo"
          className="rounded-full"
          priority
        />
      </Link>

      <div className="flex gap-4 cursor-pointer">
        {user ? (
          <>
            <Button asChild variant="outline" className="hidden sm:block">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="cursor-pointer"
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button asChild className="hidden sm:block">
              <Link href="/signup">Sign Up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </>
        )}
        <DarkModeToggle />
      </div>
    </header>
  );
}

export default Header;
