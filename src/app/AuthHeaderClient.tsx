"use client";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import React from "react";

export default function AuthHeaderClient() {
  return (
    <SessionProvider>
      <AuthHeader />
    </SessionProvider>
  );
}

function AuthHeader() {
  const { data: session, status } = useSession();
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {status === "loading" ? null : session ? (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-900 bg-white/80 px-2 py-1 rounded shadow">
            {session.user?.name}
          </span>
          <button
            className="px-3 py-1 rounded bg-green-600 text-white font-bold hover:bg-green-800 transition"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          className="px-3 py-1 rounded bg-green-600 text-white font-bold hover:bg-green-800 transition shadow"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
