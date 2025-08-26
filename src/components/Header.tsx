import Image from "next/image";
import { memo } from 'react';

export const Header = memo(() => {
  return (
    <header className="w-full flex flex-col items-center text-white shadow-lg py-6 quiz-primary">
      <div className="w-full flex flex-row items-center justify-between px-12 py-2">
        <div className="flex flex-col">
          <span className="text-5xl font-extrabold tracking-widest">The Curiosity Quotient</span>
        </div>
        <Image
          src="/tcq_logo.png"
          alt="TCQ Logo"
          className="h-48 w-auto max-w-lg"
          width={512}
          height={512}
        />
      </div>
    </header>
  );
});

Header.displayName = 'Header';
