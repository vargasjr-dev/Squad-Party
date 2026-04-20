import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play",
  description: "Join a game session and play with your squad",
  openGraph: {
    title: "Play | Squad Party",
    description: "Join a game session and play with your squad",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
