import type { BillingPlanKey } from "@/lib/billing/billing-access";

export type PublicBillingPlan = {
  id: BillingPlanKey;
  name: string;
  priceMonthly: number;
  description: string;
  projectsLimit: number;
  campaignsLimit: number;
  questsLimit: number;
  raidsLimit: number;
  providersLimit: number;
  includedBillableSeats: number;
  trialDays: number;
  isPublic: boolean;
  isSelfServe: boolean;
  isCheckoutEnabled: boolean;
  isFreeTier: boolean;
  isEnterprise: boolean;
  stripePriceId?: string;
  features: string[];
};

const starterPriceId = process.env.STRIPE_STARTER_MONTHLY_PRICE_ID;
const growthPriceId = process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID;

export const billingPlanCatalog: PublicBillingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "A real small live tier for testing launch posture without hiding the core product.",
    projectsLimit: 1,
    campaignsLimit: 1,
    questsLimit: 10,
    raidsLimit: 1,
    providersLimit: 1,
    includedBillableSeats: 2,
    trialDays: 0,
    isPublic: true,
    isSelfServe: true,
    isCheckoutEnabled: false,
    isFreeTier: true,
    isEnterprise: false,
    features: [
      "1 project",
      "1 active campaign",
      "10 live quests",
      "1 live raid",
      "1 provider",
      "2 billable seats",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 99,
    description: "The first real paid tier for small teams running live campaigns and community execution.",
    projectsLimit: 2,
    campaignsLimit: 5,
    questsLimit: 50,
    raidsLimit: 5,
    providersLimit: 2,
    includedBillableSeats: 5,
    trialDays: 14,
    isPublic: true,
    isSelfServe: true,
    isCheckoutEnabled: true,
    isFreeTier: false,
    isEnterprise: false,
    stripePriceId: starterPriceId,
    features: [
      "2 projects",
      "5 active campaigns",
      "50 live quests",
      "5 live raids",
      "Discord + Telegram",
      "5 billable seats",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 299,
    description: "For serious operators who need more capacity, richer automation and real launch volume.",
    projectsLimit: 5,
    campaignsLimit: 25,
    questsLimit: 250,
    raidsLimit: 20,
    providersLimit: 2,
    includedBillableSeats: 15,
    trialDays: 14,
    isPublic: true,
    isSelfServe: true,
    isCheckoutEnabled: true,
    isFreeTier: false,
    isEnterprise: false,
    stripePriceId: growthPriceId,
    features: [
      "5 projects",
      "25 active campaigns",
      "250 live quests",
      "20 live raids",
      "Advanced automations",
      "15 billable seats",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 0,
    description: "High-touch commercial posture for accounts that need custom limits and enterprise handling.",
    projectsLimit: 999,
    campaignsLimit: 999,
    questsLimit: 9999,
    raidsLimit: 999,
    providersLimit: 99,
    includedBillableSeats: 999,
    trialDays: 0,
    isPublic: true,
    isSelfServe: false,
    isCheckoutEnabled: false,
    isFreeTier: false,
    isEnterprise: true,
    features: [
      "Custom limits",
      "Enterprise-managed billing",
      "High-touch onboarding",
      "Commercial review path",
    ],
  },
];

export function getPublicBillingPlans() {
  return billingPlanCatalog.filter((plan) => plan.isPublic);
}

export function getPublicBillingPlan(planId: string) {
  return billingPlanCatalog.find((plan) => plan.id === planId);
}
