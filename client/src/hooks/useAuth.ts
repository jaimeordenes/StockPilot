import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: rawUser, isLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const user = rawUser
    ? {
        ...rawUser,
        firstName: rawUser.firstName || rawUser.nombre || undefined,
        lastName: rawUser.lastName || undefined,
        email: rawUser.email || rawUser.correo || undefined,
      }
    : null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
