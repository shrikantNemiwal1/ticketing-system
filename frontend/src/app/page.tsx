import { AuthRedirect } from "@/components/auth/AuthRedirect";

/**
 * Root page - now a server component that delegates redirect logic to a client component
 * This improves performance by reducing the client bundle size for the root page
 */
export default function HomePage() {
  return <AuthRedirect />;
}
