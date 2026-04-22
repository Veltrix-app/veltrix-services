import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export function DocsShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="docs-shell-grid">
      <DocsSidebar />

      <div className="docs-main">
        <DocsHeader />
        {children}
      </div>
    </div>
  );
}
