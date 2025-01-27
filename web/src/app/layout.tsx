"use client";

import { useEffect } from "react";
import "@/lib/i18n";
import "@/styles/globals.css";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set session cookie when user is authenticated
        user.getIdToken().then((token) => {
          document.cookie = `__session=${token}; path=/; max-age=3600; secure; samesite=strict`;
        });
      } else {
        // Clear session cookie when user is not authenticated
        document.cookie =
          "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
