import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        return await apiRequest("/api/auth/user");
      } catch (err: any) {
        if (err.message?.includes('401')) {
          return null; // Return null for unauthorized instead of throwing
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
