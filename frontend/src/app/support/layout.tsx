import { EnhancedLayout } from "@/components/layout";

export default function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EnhancedLayout>{children}</EnhancedLayout>;
}
