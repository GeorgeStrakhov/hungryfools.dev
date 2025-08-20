import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { profiles, projects } from "@/db/schema/profile";
import { sql, eq } from "drizzle-orm";
import {
  Users,
  UserCheck,
  Activity,
  Calendar,
  Shield,
  FolderOpen,
  Layers,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

  const [projectCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects);

  const [featuredProjectCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(sql`${projects.featured} = true`);

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

  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      slug: projects.slug,
      oneliner: projects.oneliner,
      createdAt: projects.createdAt,
      user: {
        name: users.name,
        handle: profiles.handle,
      },
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .leftJoin(profiles, eq(projects.userId, profiles.userId))
    .orderBy(sql`${projects.createdAt} desc`)
    .limit(5);

  return {
    totalUsers: Number(userCount?.count || 0),
    totalProfiles: Number(profileCount?.count || 0),
    totalAdmins: Number(adminCount?.count || 0),
    totalProjects: Number(projectCount?.count || 0),
    featuredProjects: Number(featuredProjectCount?.count || 0),
    recentUsers,
    recentProjects,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:mt-2 sm:text-base">
          Monitor and manage your hungryfools community
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <div className="rounded-lg border p-3 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              Total Users
            </span>
          </div>
          <div className="text-lg font-bold sm:text-2xl">
            {stats.totalUsers}
          </div>
        </div>

        <div className="rounded-lg border p-3 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <UserCheck className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              Profiles
            </span>
          </div>
          <div className="text-lg font-bold sm:text-2xl">
            {stats.totalProfiles}
          </div>
        </div>

        <div className="rounded-lg border p-3 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <FolderOpen className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              Projects
            </span>
          </div>
          <div className="text-lg font-bold sm:text-2xl">
            {stats.totalProjects}
          </div>
        </div>

        <div className="rounded-lg border p-3 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Layers className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              Featured
            </span>
          </div>
          <div className="text-lg font-bold sm:text-2xl">
            {stats.featuredProjects}
          </div>
        </div>

        <div className="rounded-lg border p-3 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="text-muted-foreground h-4 w-4 flex-shrink-0" />
            <span className="text-muted-foreground truncate text-xs sm:text-sm">
              Admins
            </span>
          </div>
          <div className="text-lg font-bold sm:text-2xl">
            {stats.totalAdmins}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Users */}
        <div className="rounded-lg border p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-base font-semibold sm:text-lg">Recent Users</h2>
            <Activity className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {stats.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 sm:gap-3">
                {user.image && (
                  <Image
                    src={user.image}
                    alt={user.name || ""}
                    width={32}
                    height={32}
                    className="h-6 w-6 flex-shrink-0 rounded-full sm:h-8 sm:w-8"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium sm:text-sm">
                    {user.name || "Unknown"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs break-all">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentUsers.length === 0 && (
              <p className="text-muted-foreground text-xs sm:text-sm">
                No users yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="rounded-lg border p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-base font-semibold sm:text-lg">
              Recent Projects
            </h2>
            <FolderOpen className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {stats.recentProjects.map((project) => (
              <div key={project.id} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {project.user.handle ? (
                      <Link
                        href={`/u/${project.user.handle}/p/${project.slug}`}
                        className="hover:text-primary block truncate text-xs font-medium underline decoration-dotted underline-offset-4 transition-colors sm:text-sm"
                      >
                        {project.name}
                      </Link>
                    ) : (
                      <p className="truncate text-xs font-medium sm:text-sm">
                        {project.name}
                      </p>
                    )}
                    <p className="text-muted-foreground truncate text-xs">
                      {project.oneliner || "No description"}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground truncate text-xs">
                  by {project.user.name || "Unknown"}
                </p>
              </div>
            ))}
            {stats.recentProjects.length === 0 && (
              <p className="text-muted-foreground text-xs sm:text-sm">
                No projects yet
              </p>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-lg border p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <h2 className="text-base font-semibold sm:text-lg">
              System Metrics
            </h2>
            <Calendar className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground truncate">
                Profile Completion
              </span>
              <span className="flex-shrink-0 font-medium">
                {Math.round(
                  (stats.totalProfiles / Math.max(stats.totalUsers, 1)) * 100,
                )}
                %
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground truncate">
                Projects per User
              </span>
              <span className="flex-shrink-0 font-medium">
                {stats.totalUsers > 0
                  ? (stats.totalProjects / stats.totalUsers).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground truncate">
                Featured Rate
              </span>
              <span className="flex-shrink-0 font-medium">
                {stats.totalProjects > 0
                  ? Math.round(
                      (stats.featuredProjects / stats.totalProjects) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground truncate">Database</span>
              <span className="flex-shrink-0 font-medium">Neon Postgres</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground truncate">
                Auth Provider
              </span>
              <span className="flex-shrink-0 font-medium">GitHub OAuth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
