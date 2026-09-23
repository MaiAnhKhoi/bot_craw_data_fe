import type { Metadata } from "next";
import { RemainingAreasScreen } from "@/features/remaining-areas/components/remaining-areas/remaining-areas-screen";

export const metadata: Metadata = { title: "Địa bàn còn sót" };

export default function RemainingAreasPage() {
  return <RemainingAreasScreen />;
}
