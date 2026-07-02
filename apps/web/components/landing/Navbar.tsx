import React from "react";
import Link from "next/link";
import Image from "next/image";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-none bg-[#0A0B0F]/90 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Image
          alt="CheckMate Logo"
          width={120}
          height={32}
          className="h-8 w-auto"
          src="/logo.png"
        />
        <span className="text-headline-md font-headline-md font-bold text-primary">
          CheckMate
        </span>
      </div>
      <Link
        href="/beta"
        className="btn-primary px-6 py-3 font-label-caps text-label-caps rounded-sm hidden md:block text-center"
      >
        Join Beta
      </Link>
    </nav>
  );
};
