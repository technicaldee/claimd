"use client";

import Image from "next/image";
import { useState } from "react";

export function FigureAvatar({
  name,
  imageUrl,
  className = "h-12 w-12 rounded-full",
  fillClassName = "object-cover"
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
  fillClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`relative overflow-hidden bg-surface-container ${className}`}>
      {imageUrl && !failed ? (
        <Image src={imageUrl} alt={name} fill className={fillClassName} onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-headline font-bold text-primary">{initials}</div>
      )}
    </div>
  );
}
