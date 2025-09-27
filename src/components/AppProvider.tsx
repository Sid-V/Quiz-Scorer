"use client";
import { SessionProvider } from "next-auth/react";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} 
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}