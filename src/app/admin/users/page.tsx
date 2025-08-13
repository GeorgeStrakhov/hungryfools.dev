import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { AdminToggle } from "./admin-toggle";
import { MoreVertical } from "lucide-react";
import Image from "next/image";

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id || "";
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      isAdmin: users.isAdmin,
      profile: {
        handle: profiles.handle,
        displayName: profiles.displayName,
        headline: profiles.headline,
      },
    })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.userId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 text-left font-medium">User</th>
              <th className="p-4 text-left font-medium">Profile</th>
              <th className="p-4 text-left font-medium">Role</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name || ""}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{user.name || "Unknown"}</p>
                      <p className="text-muted-foreground text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  {user.profile?.handle ? (
                    <div>
                      <p className="font-medium">@{user.profile.handle}</p>
                      <p className="text-muted-foreground text-sm">
                        {user.profile.headline || "No headline"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No profile</span>
                  )}
                </td>
                <td className="p-4">
                  <AdminToggle
                    userId={user.id}
                    isAdmin={user.isAdmin || false}
                    currentUserId={currentUserId}
                  />
                </td>
                <td className="p-4">
                  <button className="hover:bg-accent rounded-md p-2 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
