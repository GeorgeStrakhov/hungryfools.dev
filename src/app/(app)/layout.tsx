import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}