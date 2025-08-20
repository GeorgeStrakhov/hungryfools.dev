import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { AdminToggle } from "./admin-toggle";
import { UserDropdownMenu } from "./user-dropdown-menu";
import Image from "next/image";
import Link from "next/link";

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
          Manage user accounts and permissions
        </p>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-2 text-left text-sm font-medium sm:p-4 sm:text-base">
                User
              </th>
              <th className="hidden p-2 text-left text-sm font-medium sm:table-cell sm:p-4 sm:text-base">
                Profile
              </th>
              <th className="p-2 text-left text-sm font-medium sm:p-4 sm:text-base">
                Role
              </th>
              <th className="p-2 text-left text-sm font-medium sm:p-4 sm:text-base">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-2 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name || ""}
                        width={40}
                        height={40}
                        className="h-8 w-8 flex-shrink-0 rounded-full sm:h-10 sm:w-10"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium sm:text-base">
                        {user.name || "Unknown"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs break-all sm:text-sm">
                        {user.email}
                      </p>
                      {/* Show profile info on mobile when profile column is hidden */}
                      {user.profile?.handle && (
                        <div className="mt-1 sm:hidden">
                          <Link
                            href={`/u/${user.profile.handle}`}
                            className="text-primary hover:text-primary/80 text-xs underline decoration-dotted underline-offset-4 transition-colors"
                          >
                            @{user.profile.handle}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden p-2 sm:table-cell sm:p-4">
                  {user.profile?.handle ? (
                    <div className="min-w-0">
                      <Link
                        href={`/u/${user.profile.handle}`}
                        className="hover:text-primary block truncate font-medium underline decoration-dotted underline-offset-4 transition-colors"
                      >
                        @{user.profile.handle}
                      </Link>
                      <p className="text-muted-foreground truncate text-sm">
                        {user.profile.headline || "No headline"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No profile</span>
                  )}
                </td>
                <td className="p-2 sm:p-4">
                  <AdminToggle
                    userId={user.id}
                    isAdmin={user.isAdmin || false}
                    currentUserId={currentUserId}
                  />
                </td>
                <td className="p-2 sm:p-4">
                  <UserDropdownMenu
                    userId={user.id}
                    userName={user.name || "Unknown"}
                    userEmail={user.email || "No email"}
                    currentUserId={currentUserId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
