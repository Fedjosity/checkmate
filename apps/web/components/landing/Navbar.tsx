import React from "react";
import Link from "next/link";
import Image from "next/image";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 max-w-none bg-[#0A0B0F] md:bg-[#0A0B0F]/90 md:backdrop-blur-md border-b border-border/10 md:border-transparent transition-colors">
      <div className="flex items-center">
        <Image
          alt="CheckMate Logo"
          width={500}
          height={150}
          className="h-10 md:h-12 w-auto scale-[2.5] origin-left"
          src="/logo2.png"
          unoptimized
          priority
        />
      </div>
      <Link
        href="/beta"
        className="btn-primary px-6 py-3 font-label-caps text-label-caps rounded-sm  text-center"
      >
        Join Beta
      </Link>
    </nav>
  );
};
