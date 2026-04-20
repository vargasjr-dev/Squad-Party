import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Sessions",
  description: "View your active and past game sessions",
  openGraph: {
    title: "My Sessions | Squad Party",
    description: "View your active and past game sessions",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
