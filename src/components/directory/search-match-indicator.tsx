import {
  getMatchCategory,
  generateRelevanceReasons,
  type RelevanceReason,
} from "@/lib/utils/search-relevance";
import type { DirectorySearchResult } from "@/app/actions/search";

interface SearchMatchIndicatorProps {
  profile: DirectorySearchResult;
  position: number;
  searchQuery: string;
  parsedQuery?: {
    companies: string[];
    locations: string[];
    skills: string[];
    interests: string[];
    availability?: {
      hire?: boolean;
      collab?: boolean;
      hiring?: boolean;
    };
    strictFilters?: {
      locations?: string[];
      skills?: string[];
      companies?: string[];
      availability?: {
        hire?: boolean;
        collab?: boolean;
        hiring?: boolean;
      };
    };
  };
}

export function SearchMatchIndicator({
  profile,
  position,
  searchQuery,
  parsedQuery,
}: SearchMatchIndicatorProps) {
  // Don't show match indicators if there's no search query
  if (!searchQuery.trim()) return null;

  const relevanceReasons = generateRelevanceReasons(
    profile,
    searchQuery,
    parsedQuery,
  );
  const matchCategory = getMatchCategory(
    profile.searchScore || 0,
    position,
    relevanceReasons,
  );

  return (
    <div className="mb-3 space-y-1">
      {/* Match Category Badge */}
      <div className="flex items-center gap-1">
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${matchCategory.bgClass} ${matchCategory.textClass}`}
        >
          <span>{matchCategory.icon}</span>
          {matchCategory.label}
        </span>
      </div>

      {/* Relevance Reasons */}
      {relevanceReasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {relevanceReasons.slice(0, 3).map((reason, index) => (
            <RelevanceReason key={index} reason={reason} />
          ))}
          {relevanceReasons.length > 3 && (
            <span className="text-muted-foreground text-xs">
              +{relevanceReasons.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RelevanceReason({ reason }: { reason: RelevanceReason }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs">
      <span>{reason.icon}</span>
      <span>{reason.text}</span>
    </span>
  );
}
