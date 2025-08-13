export default function BoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="prose prose-gray max-w-none">
        {children}
      </div>
    </div>
  );
}