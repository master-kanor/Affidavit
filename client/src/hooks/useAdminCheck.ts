import { useAuthorization } from "@/hooks/useAuthorization";

export function useAdminCheck() {
  const { isLoading, isAdmin, isOwner, error } = useAuthorization();
  return { isAdmin: isAdmin || isOwner, isOwner, isLoading, error };
}
