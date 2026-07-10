import React from "react";

// A single persistent search box that drives both the Jobs and Candidates
// tab lists at once. No dropdown to pick from — type here, then just click
// whichever tab you want; its full list is already filtered to match.
export default function GlobalSearch({ query, setQuery }) {
  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <span style={{ position: "absolute", left: 14, top: 12, color: "var(--ink-soft)", fontSize: 14 }}>🔎</span>
      <input
        className="input"
        style={{ paddingLeft: 36, fontSize: 14, padding: "11px 14px 11px 36px" }}
        placeholder="Search jobs and candidates — try a job title, skill, or name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() && (
        <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "6px 2px 0" }}>
          Showing matches for "{query}" — click Job orders or Candidates above to see the full list.
        </p>
      )}
    </div>
  );
}
