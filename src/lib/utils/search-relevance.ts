import type { DirectorySearchResult } from "@/app/actions/search";

export interface MatchCategory {
  label: string;
  color: "green" | "blue" | "yellow" | "gray";
  icon: string;
  bgClass: string;
  textClass: string;
}

export interface RelevanceReason {
  type:
    | "skill"
    | "location"
    | "interest"
    | "company"
    | "availability"
    | "semantic";
  text: string;
  icon: string;
}

/**
 * Convert search score, position, and relevance reasons to user-friendly match category
 */
export function getMatchCategory(
  score: number,
  position: number,
  relevanceReasons: RelevanceReason[],
): MatchCategory {
  // Count different types of matches for quality assessment
  const skillMatches = relevanceReasons.filter(
    (r) => r.type === "skill",
  ).length;
  const locationMatches = relevanceReasons.filter(
    (r) => r.type === "location",
  ).length;
  const interestMatches = relevanceReasons.filter(
    (r) => r.type === "interest",
  ).length;
  const companyMatches = relevanceReasons.filter(
    (r) => r.type === "company",
  ).length;
  const availabilityMatches = relevanceReasons.filter(
    (r) => r.type === "availability",
  ).length;

  // Calculate match strength based on variety and type of matches
  const explicitMatches =
    skillMatches +
    locationMatches +
    interestMatches +
    companyMatches +
    availabilityMatches;

  // Perfect Match: Multiple explicit matches including skills/company OR very high score
  if (
    (explicitMatches >= 2 && (skillMatches > 0 || companyMatches > 0)) ||
    score > 0.8
  ) {
    return {
      label: "Perfect Match",
      color: "green",
      icon: "🎯",
      bgClass: "bg-green-100 dark:bg-green-900",
      textClass: "text-green-800 dark:text-green-200",
    };
  }

  // Excellent Match: Has skill/company match OR multiple explicit matches OR top position with good score
  if (
    skillMatches > 0 ||
    companyMatches > 0 ||
    explicitMatches >= 2 ||
    (position === 0 && score > 0.3)
  ) {
    return {
      label: "Excellent Match",
      color: "blue",
      icon: "⭐",
      bgClass: "bg-blue-100 dark:bg-blue-900",
      textClass: "text-blue-800 dark:text-blue-200",
    };
  }

  // Good Match: Has explicit matches (location, interests, availability) OR good position
  if (explicitMatches > 0 || (position <= 3 && score > 0.1)) {
    return {
      label: "Good Match",
      color: "yellow",
      icon: "✨",
      bgClass: "bg-yellow-100 dark:bg-yellow-900",
      textClass: "text-yellow-800 dark:text-yellow-200",
    };
  }

  // Everything else is just "Related" (semantic matches, weak scores)
  return {
    label: "Related",
    color: "gray",
    icon: "📝",
    bgClass: "bg-gray-100 dark:bg-gray-800",
    textClass: "text-gray-700 dark:text-gray-300",
  };
}

/**
 * Generate relevance explanation based on profile and search query
 */
export function generateRelevanceReasons(
  profile: DirectorySearchResult,
  searchQuery: string,
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
  },
): RelevanceReason[] {
  const reasons: RelevanceReason[] = [];

  if (!parsedQuery) {
    // Fallback: try to extract simple matches from the search query
    const queryLower = searchQuery.toLowerCase();

    // Check skills
    const matchingSkills =
      profile.skills?.filter(
        (skill) =>
          queryLower.includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(queryLower),
      ) || [];

    if (matchingSkills.length > 0) {
      reasons.push({
        type: "skill",
        text: `Skills: ${matchingSkills.slice(0, 3).join(", ")}${matchingSkills.length > 3 ? "..." : ""}`,
        icon: "🛠️",
      });
    }

    // Check location
    if (
      profile.location &&
      queryLower.includes(profile.location.toLowerCase())
    ) {
      reasons.push({
        type: "location",
        text: `Location: ${profile.location}`,
        icon: "📍",
      });
    }

    // Check interests
    const matchingInterests =
      profile.interests?.filter(
        (interest) =>
          queryLower.includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(queryLower),
      ) || [];

    if (matchingInterests.length > 0) {
      reasons.push({
        type: "interest",
        text: `Interests: ${matchingInterests.slice(0, 2).join(", ")}${matchingInterests.length > 2 ? "..." : ""}`,
        icon: "❤️",
      });
    }

    return reasons;
  }

  // With parsed query, we can be more precise

  // Skills matching
  const matchingSkills =
    profile.skills?.filter((skill) =>
      parsedQuery.skills.some(
        (searchSkill) =>
          skill.toLowerCase().includes(searchSkill.toLowerCase()) ||
          searchSkill.toLowerCase().includes(skill.toLowerCase()),
      ),
    ) || [];

  if (matchingSkills.length > 0) {
    reasons.push({
      type: "skill",
      text: `Skills: ${matchingSkills.slice(0, 3).join(", ")}${matchingSkills.length > 3 ? "..." : ""}`,
      icon: "🛠️",
    });
  }

  // Location matching
  const matchingLocations = parsedQuery.locations.filter((searchLocation) =>
    profile.location?.toLowerCase().includes(searchLocation.toLowerCase()),
  );

  if (matchingLocations.length > 0 && profile.location) {
    reasons.push({
      type: "location",
      text: `Location: ${profile.location}`,
      icon: "📍",
    });
  }

  // Interests matching
  const matchingInterests =
    profile.interests?.filter((interest) =>
      parsedQuery.interests.some(
        (searchInterest) =>
          interest.toLowerCase().includes(searchInterest.toLowerCase()) ||
          searchInterest.toLowerCase().includes(interest.toLowerCase()),
      ),
    ) || [];

  if (matchingInterests.length > 0) {
    reasons.push({
      type: "interest",
      text: `Interests: ${matchingInterests.slice(0, 2).join(", ")}${matchingInterests.length > 2 ? "..." : ""}`,
      icon: "❤️",
    });
  }

  // Companies matching (if mentioned in headline/bio)
  const matchingCompanies = parsedQuery.companies.filter(
    (company) =>
      profile.headline?.toLowerCase().includes(company.toLowerCase()) ||
      profile.displayName?.toLowerCase().includes(company.toLowerCase()),
  );

  if (matchingCompanies.length > 0) {
    reasons.push({
      type: "company",
      text: `Companies: ${matchingCompanies.join(", ")}`,
      icon: "🏢",
    });
  }

  // Availability matching
  if (parsedQuery.availability) {
    const availabilityMatches = [];

    if (parsedQuery.availability.hire && profile.availability?.hire) {
      availabilityMatches.push("Available for hire");
    }
    if (parsedQuery.availability.collab && profile.availability?.collab) {
      availabilityMatches.push("Open to collaboration");
    }
    if (parsedQuery.availability.hiring && profile.availability?.hiring) {
      availabilityMatches.push("Currently hiring");
    }

    if (availabilityMatches.length > 0) {
      reasons.push({
        type: "availability",
        text: availabilityMatches.join(", "),
        icon: "💼",
      });
    }
  }

  // If it's a vector/semantic match, add that info
  if (
    profile.searchMethod?.includes("vector") ||
    profile.searchMethod === "rerank"
  ) {
    reasons.push({
      type: "semantic",
      text: "Similar profile content",
      icon: "🧠",
    });
  }

  // If no specific reasons found but it's a match, add a generic reason
  if (reasons.length === 0) {
    if (profile.searchMethod === "bm25") {
      reasons.push({
        type: "semantic",
        text: "Keyword match in profile",
        icon: "🔍",
      });
    } else {
      reasons.push({
        type: "semantic",
        text: "Profile content relevance",
        icon: "📝",
      });
    }
  }

  return reasons;
}

/**
 * Calculate match percentage for display (normalized across all results)
 */
export function calculateMatchPercentage(
  score: number,
  allScores: number[],
): number {
  if (allScores.length === 0) return 0;

  const maxScore = Math.max(...allScores);
  const minScore = Math.min(...allScores);

  if (maxScore === minScore) return 100; // All scores are the same

  return Math.round(((score - minScore) / (maxScore - minScore)) * 100);
}
