import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { routerBasename } from "./utils/paths.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 14px",
              background: "#0F172A",
              color: "#fff",
              boxShadow: "0 10px 30px -10px rgba(15,23,42,.4)",
              border: "1px solid rgba(255,255,255,0.06)",
            },
            success: {
              iconTheme: { primary: "#10B981", secondary: "#fff" },
              style: { background: "#065F46", color: "#ECFDF5" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#fff" },
              style: { background: "#7F1D1D", color: "#FEF2F2" },
            },
            loading: {
              iconTheme: { primary: "#4F46E5", secondary: "#fff" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
