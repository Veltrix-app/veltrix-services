import { DocsReferencePage } from "@/components/docs/docs-reference-page";

export default function DefiProviderIntegrationsReferencePage() {
  return (
    <DocsReferencePage
      eyebrow="Reference"
      title="DeFi Provider Integrations define the route boundary behind VYNTRO UI."
      description="This page explains how 0x, Uniswap, Moonwell and RPC providers support the DeFi product while VYNTRO keeps UX, education and proof tracking consistent."
      referenceSlug="defi-provider-integrations"
      stateExplorerSlug="provider-integration-flow"
      relatedHrefs={[
        "/reference",
        "/project-docs/defi-products",
        "/reference/defi-product-model",
        "/reference/xp-economy-enforcement",
      ]}
      rail={
        <div className="space-y-4">
          <p className="docs-kicker text-lime-300">Provider boundary</p>
          <p className="text-sm leading-7 text-slate-300">
            Provider disclosure can stay calm and minimal in product UI, but the docs must keep the execution boundary exact.
          </p>
        </div>
      }
    />
  );
}
