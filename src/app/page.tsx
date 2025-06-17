// app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const countries = [
  { name: "United States", code: "US" },
  { name: "Peru", code: "PE" },
  { name: "United Kingdom", code: "GB" },
  { name: "Japan", code: "JP" },
];

export default function HomePage() {
  const [country1, setCountry1] = useState("US");
  const [country2, setCountry2] = useState("PE");

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Country Profile Comparison</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-lg mb-2">Country 1</label>
          <select
            className="w-full p-2 border rounded"
            value={country1}
            onChange={(e) => setCountry1(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-lg mb-2">Country 2</label>
          <select
            className="w-full p-2 border rounded"
            value={country2}
            onChange={(e) => setCountry2(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href={`/compare/${country1}-${country2}`}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Compare
        </Link>
      </div>
    </main>
  );
}
