import Link from "next/link";
import Image from "next/image";
import { shadow } from "@/styles/utils";
import { Button } from "./ui/button";
import DarkModeToggle from "./dark-mode";

function Header() {
  const user = null;
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
          height={100}
          width={100}
          alt="Norate AI Logo"
          className="rounded-full"
          priority
        />
      </Link>

      <div className="flex gap-4">
        {user ? (
          <Button variant="outline">Logout</Button>
        ) : (
          <>
            <Button asChild className="hidden sm:block">
              <Link href="/sign-up">Sign Up</Link>
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
