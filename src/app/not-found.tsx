"use client";

import { Suspense } from "react";

export default function NotFound() {
  return (
    <Suspense fallback={null}>
      <NotFoundContent />
    </Suspense>
  );
}

function NotFoundContent() {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "8px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#999", fontSize: "16px" }}>
        The page you are looking for does not exist.
      </p>
    </div>
  );
}
