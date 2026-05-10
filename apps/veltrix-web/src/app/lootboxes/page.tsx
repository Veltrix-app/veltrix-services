import { AppShell } from "@/components/layout/app-shell";
import { LootboxShopScreen } from "@/components/lootboxes/lootbox-shop-screen";
import { ProtectedState } from "@/components/shared/protected-state";

export default function LootboxesPage() {
  return (
    <AppShell
      eyebrow="Lootboxes"
      title="Shard vault"
      description="Spend earned shards on VYNTRO lootboxes, cosmetics and perk unlocks."
      hidePageHeader
    >
      <ProtectedState allowPreview previewLabel="Lootbox preview" showPreviewBanner={false}>
        <LootboxShopScreen />
      </ProtectedState>
    </AppShell>
  );
}
