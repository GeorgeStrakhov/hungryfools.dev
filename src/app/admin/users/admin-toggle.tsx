"use client";

import { useState } from "react";
import { toggleAdminStatus } from "./actions";
import { Shield } from "lucide-react";

interface AdminToggleProps {
  userId: string;
  isAdmin: boolean;
  currentUserId: string;
}

export function AdminToggle({
  userId,
  isAdmin,
  currentUserId,
}: AdminToggleProps) {
  const [loading, setLoading] = useState(false);
  const isCurrentUser = userId === currentUserId;

  const handleToggle = async () => {
    if (loading) return;
    if (isCurrentUser && isAdmin) {
      alert("You cannot remove your own admin status");
      return;
    }

    setLoading(true);
    try {
      await toggleAdminStatus(userId, !isAdmin);
    } catch (error) {
      console.error("Failed to toggle admin status:", error);
      alert("Failed to update admin status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || (isCurrentUser && isAdmin)}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
        isAdmin
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "bg-muted hover:bg-accent"
      } ${loading || (isCurrentUser && isAdmin) ? "cursor-not-allowed opacity-50" : "cursor-pointer"} `}
      title={
        isCurrentUser && isAdmin
          ? "Cannot remove your own admin status"
          : "Toggle admin status"
      }
    >
      <Shield className="h-3 w-3" />
      {isAdmin ? "Admin" : "User"}
    </button>
  );
}
