"use client";

import Image from "next/image";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function NavigationBar() {
  return (
    <nav className="flex items-center justify-between rounded-full border border-white/40 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
      <Link href="/" className="flex items-center gap-3">
        <Image src="/pollcipher-mark.svg" alt="PollCipher mark" width={40} height={40} priority />
        <Image
          src="/pollcipher-logo.svg"
          alt="PollCipher Predictions"
          width={160}
          height={42}
          priority
          style={{ height: "auto", width: "160px" }}
        />
      </Link>
      <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
    </nav>
  );
}

