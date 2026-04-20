import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Squad Party profile and game stats",
  openGraph: {
    title: "Profile | Squad Party",
    description: "Your Squad Party profile and game stats",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
