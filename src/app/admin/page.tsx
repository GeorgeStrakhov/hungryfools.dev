import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles } from "@/db/schema/profile";
import { sql } from "drizzle-orm";
import { Users, UserCheck, Activity, Calendar, Shield } from "lucide-react";
import Image from "next/image";

async function getStats() {
  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const [profileCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(profiles);

  const [adminCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.isAdmin} = true`);

  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .orderBy(sql`${users.id} desc`)
    .limit(5);

  return {
    totalUsers: Number(userCount?.count || 0),
    totalProfiles: Number(profileCount?.count || 0),
    totalAdmins: Number(adminCount?.count || 0),
    recentUsers,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage your hungryfools community
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="mb-2 flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">Total Users</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="mb-2 flex items-center gap-2">
            <UserCheck className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">
              Profiles Created
            </span>
          </div>
          <div className="text-2xl font-bold">{stats.totalProfiles}</div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm">Admins</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalAdmins}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Activity className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name || ""}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {user.name || "Unknown"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-muted-foreground text-sm">No users yet</p>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">System Info</h2>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Database</span>
              <span>Neon Postgres</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Auth Provider</span>
              <span>GitHub OAuth</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Environment</span>
              <span>Production</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span>
                {Math.round(
                  (stats.totalProfiles / Math.max(stats.totalUsers, 1)) * 100,
                )}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
