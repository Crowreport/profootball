"use client";
// src/components/Providers.js
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
