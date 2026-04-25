import type { Metadata } from "next";
import { PublicLaunchSite } from "@/components/marketing/public-launch-site";

export const metadata: Metadata = {
  title: "VYNTRO | Launch execution, community operations, member journeys and buyer-ready rollout",
  description:
    "VYNTRO gives projects one system for launches, community execution, member journeys, bot activation, safety workflows and the commercial path around them.",
};

export default function LandingPage() {
  return <PublicLaunchSite />;
}
