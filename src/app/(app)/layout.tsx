import { Topbar } from "@/components/topbar";
import { Footer } from "@/components/footer";
import { BannerAlert } from "@/components/banner-alert";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <BannerAlert />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
