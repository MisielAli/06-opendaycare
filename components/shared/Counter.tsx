"use client";

import { useState } from "react";

interface CounterProps {
  initialValue?: number;
  step?: number;
}

export function Counter({ initialValue = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initialValue);

  function increment() {
    setCount((prev) => prev + step);
  }

  function decrement() {
    setCount((prev) => prev - step);
  }

  function reset() {
    setCount(initialValue);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Contador
      </p>

      <p
        className="font-display text-6xl font-bold tabular-nums text-zinc-900"
        aria-live="polite"
      >
        {count}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-xl font-semibold text-zinc-700 transition hover:bg-zinc-200 active:scale-95"
          aria-label="Decrementar"
        >
          −
        </button>

        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 active:scale-95"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={increment}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900 text-xl font-semibold text-white transition hover:bg-zinc-800 active:scale-95"
          aria-label="Incrementar"
        >
          +
        </button>
      </div>
    </div>
  );
}
