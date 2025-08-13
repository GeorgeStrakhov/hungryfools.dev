import { auth } from "@/auth";
import { db } from "@/db";
import { projects, profiles } from "@/db/schema/profile";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectsManagementPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  // Get user's profile for handle
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  if (!profile) {
    redirect("/onboarding/handle");
  }

  // Get user's projects
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.featured), desc(projects.createdAt));

  return (
    <div className="hf-container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your project portfolio
          </p>
        </div>
        <Button asChild>
          <a href="/profile/projects/new">Add Project</a>
        </Button>
      </div>

      {userProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Start building your portfolio by adding your first project
              </p>
              <Button asChild>
                <a href="/profile/projects/new">Add Your First Project</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {userProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {project.name}
                      {project.featured && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </CardTitle>
                    {project.oneliner && (
                      <p className="text-muted-foreground mt-1">
                        {project.oneliner}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/profile/projects/${project.slug}/edit`}>
                        Edit
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/u/${profile.handle}/p/${project.slug}`} target="_blank">
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {project.description}
                    </p>
                  )}
                  
                  {project.url && (
                    <div>
                      <span className="text-xs text-muted-foreground">URL: </span>
                      <a 
                        href={project.url} 
                        target="_blank" 
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {project.url}
                      </a>
                    </div>
                  )}

                  {project.media && project.media.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">
                        Media: {project.media.length} file{project.media.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                    {project.updatedAt !== project.createdAt && (
                      <span> • Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}