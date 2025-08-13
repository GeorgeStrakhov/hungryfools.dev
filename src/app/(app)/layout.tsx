import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
