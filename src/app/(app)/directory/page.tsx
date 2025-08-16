import { searchDirectory } from "@/app/actions/search";
import { DirectorySearch } from "@/components/directory/directory-search";

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function DirectoryPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

  // Use hybrid search for intelligent results
  const searchResult = await searchDirectory(q);
  const finalResults = searchResult.results;
  const totalCount = searchResult.totalCount;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DirectorySearch
        initialQuery={q}
        initialResults={finalResults}
        initialCount={totalCount}
        initialTiming={searchResult.timing}
      />
    </div>
  );
}
