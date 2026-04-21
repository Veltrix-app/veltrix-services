import type { Metadata } from "next";
import { PublicLaunchSite } from "@/components/marketing/public-launch-site";

export const metadata: Metadata = {
  title: "Veltrix | Launch execution, community operations and member journeys",
  description:
    "Veltrix gives projects one system for campaigns, community execution, member journeys, bot activation and safety workflows.",
};

export default function LandingPage() {
  return <PublicLaunchSite />;
}
