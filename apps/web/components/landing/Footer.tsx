import React from "react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="w-full px-margin-mobile md:px-margin-desktop md:py-section-gap py-10 grid grid-cols-1 md:grid-cols-4 gap-gutter bg-surface border-t border-primary/30">
      <div className="col-span-1 md:col-span-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Image
            alt="CheckMate Logo"
            width={100}
            height={24}
            className="h-6 w-auto grayscale opacity-50"
            src="/logo.png"
          />
          <span className="text-headline-md font-headline-md font-bold text-primary">
            CheckMate
          </span>
        </div>
        <p className="text-on-surface-variant font-body-md text-sm">
          © {new Date().getFullYear()} CheckMate. Competitive chess platform for
          serious enthusiasts.
        </p>
      </div>
    </footer>
  );
};
