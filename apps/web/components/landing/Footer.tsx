import React from "react";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="w-full px-margin-mobile md:px-margin-desktop md:py-section-gap py-10 grid grid-cols-1 md:grid-cols-4 gap-gutter bg-surface border-t border-primary/30">
      <div className="col-span-1 md:col-span-4 mb-8">
        <div className="mb-6">
          <Image
            alt="CheckMate Logo"
            width={500}
            height={150}
            className="h-12 md:h-16 w-auto scale-[2.5] origin-left"
            src="/logo2.png"
          />
        </div>
        <p className="text-on-surface-variant font-body-md text-sm ml-2">
          © {new Date().getFullYear()} MishRone Entertainment. Competitive chess
          platform for serious enthusiasts.
        </p>
      </div>
    </footer>
  );
};
