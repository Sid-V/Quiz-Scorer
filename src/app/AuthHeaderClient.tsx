"use client";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";

// Color constant for consistency
const ACCENT_COLOR = '#2b544e';

export default function AuthHeaderClient() {
  return (
    <SessionProvider>
      <AuthHeader />
    </SessionProvider>
  );
}

function AuthHeader() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {session ? (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-900 bg-white/80 px-2 py-1 rounded shadow">
            {session.user?.name}
          </span>
          <button
            className="px-3 py-1 rounded text-white font-bold hover:opacity-80 transition"
            style={{backgroundColor: ACCENT_COLOR}}
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          className="px-3 py-1 rounded text-white font-bold hover:opacity-80 transition shadow"
          style={{backgroundColor: ACCENT_COLOR}}
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
