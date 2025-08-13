import { requireAdmin } from "./admin-check";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Shield,
  FlaskConical
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="hf-container py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">Admin Panel</span>
      </div>
      
      <div className="flex gap-4 mb-8">
        <Link 
          href="/admin"
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        
        <Link 
          href="/admin/users"
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <Users className="h-4 w-4" />
          Users
        </Link>
        
        <Link 
          href="/admin/testing"
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <FlaskConical className="h-4 w-4" />
          Testing
        </Link>
      </div>
      
      {children}
    </div>
  );
}