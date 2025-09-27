"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

// Color constant for consistency
const ACCENT_COLOR = '#2b544e';

export default function AuthHeaderClient() {
  return <AuthHeader />;
}

function AuthHeader() {
  const { data: session, status, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [showError, setShowError] = useState(false);

  // Check for authentication errors
  useEffect(() => {
    if (session && (session as any).error === 'RefreshAccessTokenError') {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [session]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await update();
      // Force a page reload if the session is still invalid
      setTimeout(() => {
        if (session && (session as any).error === 'RefreshAccessTokenError') {
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      // Silently handle refresh errors
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <div className="bg-white/80 px-3 py-2 rounded shadow text-sm text-gray-600">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {showError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded shadow text-sm max-w-xs">
          <div className="font-semibold mb-1">Session Expired</div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => signOut()}
              className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
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
