import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// QueryClientProvider is intentionally not mounted here: the current public case-review surface uses direct read-only source data, and the legacy provider caused a runtime hook failure in this repository preview.
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
