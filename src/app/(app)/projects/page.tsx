import { ProjectSearchContainer } from "@/components/projects/project-search-container";
import { ProjectsHeader } from "@/components/projects/projects-header";

type SearchParams = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: SearchParams) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProjectsHeader />
      <ProjectSearchContainer searchParams={params} />
    </div>
  );
}
