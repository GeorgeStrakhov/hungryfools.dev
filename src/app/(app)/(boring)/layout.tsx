export default function BoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="prose prose-gray max-w-none">{children}</div>
    </div>
  );
}
