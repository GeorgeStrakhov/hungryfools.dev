import { DirectorySearchContainer } from "@/components/directory/directory-search-container";

type SearchParams = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
  }>;
};

export default async function DirectoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DirectorySearchContainer searchParams={params} />
    </div>
  );
}
