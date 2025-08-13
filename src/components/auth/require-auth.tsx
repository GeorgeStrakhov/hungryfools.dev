import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export async function RequireAuth({
  children,
  redirectTo = "/",
}: RequireAuthProps) {
  const session = await auth();

  if (!session?.user) {
    redirect(redirectTo);
  }

  return <>{children}</>;
}
