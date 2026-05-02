import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function DefiProductModelReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="DeFi Product Model defines VYNTRO's wallet-safe finance layer."
      description="This page explains how Swap, Vaults, Borrow/Lending and Trading Arena fit together as a VYNTRO-native product layer without custody or hidden provider boundaries."
      referenceSlug="defi-product-model"
      stateExplorerSlug="defi-product-flow"
      relatedHrefs={[
        "/reference",
        "/project-docs/defi-products",
        "/reference/defi-provider-integrations",
        "/reference/xp-economy-enforcement",
        "/reference/premium-anti-fraud-model",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-cyan-200">DeFi layer</p>
          <p className="text-sm leading-7 text-slate-300">
            VYNTRO owns discovery, education and proof posture. The user wallet and configured providers own execution.
          </p>
        </div>
      }
    />
  );
}
