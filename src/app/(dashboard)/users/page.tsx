import type { Metadata } from "next";
import { UsersScreen } from "@/features/users/components/users/users-screen";

export const metadata: Metadata = { title: "Quản lý tài khoản" };

export default function UsersPage() {
  return <UsersScreen />;
}
