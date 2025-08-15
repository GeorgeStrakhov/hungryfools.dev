/**
 * Get the avatar URL for a user, with fallback priority:
 * 1. Custom profile image (uploaded by user)
 * 2. Auth.js user image (GitHub avatar)
 * 3. Default avatar
 */
export function getAvatarUrl(
  profileImage?: string | null,
  userImage?: string | null,
): string {
  return profileImage || userImage || "/images/default-avatar.png";
}

/**
 * Get avatar URL from combined user and profile data
 */
export function getUserAvatarUrl(
  user: {
    image?: string | null;
    profile?: {
      profileImage?: string | null;
    } | null;
  } | null,
): string {
  return getAvatarUrl(user?.profile?.profileImage, user?.image);
}

/**
 * Get avatar URL from separate profile and user objects
 */
export function getProfileAvatarUrl(
  profile: { profileImage?: string | null } | null,
  user: { image?: string | null } | null,
): string {
  return getAvatarUrl(profile?.profileImage, user?.image);
}
