"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Trash2 } from "lucide-react";
import { deleteUser } from "./actions";
import { toast } from "sonner";

interface UserDropdownMenuProps {
  userId: string;
  userName: string;
  userEmail: string;
  currentUserId: string;
}

export function UserDropdownMenu({
  userId,
  userName,
  userEmail,
  currentUserId,
}: UserDropdownMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentUser = userId === currentUserId;

  const handleDelete = async () => {
    if (isCurrentUser) {
      toast.error("You cannot delete your own account from the admin panel");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(userId);
      toast.success(`User ${userName} has been deleted successfully`);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete user. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="hover:bg-accent rounded-md p-2 transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            disabled={isCurrentUser}
            onClick={() => setShowDeleteDialog(true)}
            className={isCurrentUser ? "cursor-not-allowed opacity-50" : ""}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isCurrentUser ? "Cannot delete yourself" : "Delete User"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userName}</strong>&apos;s
              account ({userEmail})? This will permanently delete their profile,
              projects, and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Yes, delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
