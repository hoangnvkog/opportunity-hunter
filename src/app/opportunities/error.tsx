"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button
        onClick={() => reset()}
        className="border px-4 py-2"
      >
        Retry
      </button>
    </div>
  );
}