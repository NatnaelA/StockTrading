"use client";

import React from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserProfileProps = {
  compact?: boolean;
};

export default function UserProfile({ compact = false }: UserProfileProps) {
  const { user, signOut } = useSupabaseAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Get user display name from metadata, email, or id
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    user.id.substring(0, 8);

  // Get avatar URL if available
  const avatarUrl = user.user_metadata?.avatar_url || null;

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {avatarUrl && (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
        <span className="text-sm text-gray-700">{displayName}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {avatarUrl && (
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
      )}
      <div>
        <p className="font-medium text-gray-800">{displayName}</p>
        {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
      </div>
      <button
        onClick={handleSignOut}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Sign Out
      </button>
    </div>
  );
}
