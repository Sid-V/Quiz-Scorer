"use client";
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import React, { useEffect, useRef } from "react";

export default function AuthHeaderClient() {
  return (
    <SessionProvider>
      <AuthHeader />
    </SessionProvider>
  );
}

function AuthHeader() {
  const { data: session, status } = useSession();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Measure width and expose as CSS variable for dynamic positioning of other floating elements
  useEffect(() => {
    function updateWidth() {
      const w = wrapperRef.current?.offsetWidth || 0;
      // apply to body so other components can use var(--auth-header-width)
      if (typeof document !== 'undefined') {
        document.body.style.setProperty('--auth-header-width', w + 'px');
      }
    }
    updateWidth();
    // resize & interval fallback for potential session state change size differences
    window.addEventListener('resize', updateWidth);
    const id = setInterval(updateWidth, 1000); // lightweight periodic check
    return () => { window.removeEventListener('resize', updateWidth); clearInterval(id); };
  }, [ /* session change triggers re-measure */ ]);

  return (
    <div ref={wrapperRef} id="auth-header" className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
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
