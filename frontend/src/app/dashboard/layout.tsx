import { EnhancedLayout } from "@/components/layout";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EnhancedLayout>{children}</EnhancedLayout>;
}
