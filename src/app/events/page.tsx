"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SessionProviderWrapper from "./SessionProviderWrapper";

export default function EventsPageWrapper() {
  const router = useRouter();
  return (
    <SessionProviderWrapper>
      <div className="absolute top-4 left-8 z-50">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition"
          onClick={() => router.push("/")}
        >
          Back to Scoreboard
        </button>
      </div>
      <EventsPage />
    </SessionProviderWrapper>
  );
}

function EventsPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    if (status === "authenticated") fetchEvents();
  }, [status]);

  async function fetchEvents() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
      setActiveSheetId(data.activeSheetId || null);
    } catch (e: any) {
      setError(e.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }

  async function createEvent() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetName: eventName }),
      });
      const data = await res.json();
      if (data.sheetId) {
        setEventName("");
        await fetchEvents();
      } else {
        setError(data.error || "Failed to create event");
      }
    } catch (e: any) {
      setError(e.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  async function selectEvent(sheetId: string) {
    setLoading(true);
    setError("");
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId }),
      });
      setActiveSheetId(sheetId);
    } catch (e: any) {
      setError(e.message || "Failed to select event");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") return <div>Loading...</div>;
  if (status !== "authenticated") return <div className="p-8">Please sign in to manage events.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Your Events</h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          className="px-3 py-2 rounded border border-gray-300 flex-1"
          placeholder="Event name (e.g. TCQ Quiz Night...)"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          disabled={loading}
        />
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-bold hover:bg-blue-800 transition"
          onClick={createEvent}
          disabled={loading || !eventName.trim()}
        >
          {loading ? "Creating..." : "Create New Event (Google Sheet)"}
        </button>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <ul className="space-y-4">
        {events.map((event, idx) => (
          <li key={event.sheetId} className={`p-4 rounded border ${activeSheetId === event.sheetId ? "border-green-600 bg-green-50" : "border-gray-300 bg-white"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="font-semibold">{event.name || `Event ${idx + 1}`}</div>
                <div className="text-sm text-gray-600">{event.sheetUrl}</div>
              </div>
              <button
                className={`px-3 py-1 rounded font-bold ${activeSheetId === event.sheetId ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-800"}`}
                onClick={() => selectEvent(event.sheetId)}
                disabled={activeSheetId === event.sheetId}
              >
                {activeSheetId === event.sheetId ? "Active" : "Select"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
