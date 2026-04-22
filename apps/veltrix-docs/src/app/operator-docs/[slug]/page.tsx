import { DocsGuidePage } from "@/components/docs/docs-guide-page";

export default async function OperatorDocsDynamicPage({
  params,
}: Readonly<{
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;

  return <DocsGuidePage track="operator-docs" slug={slug} />;
}
