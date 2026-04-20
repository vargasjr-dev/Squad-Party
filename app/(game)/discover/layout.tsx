import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Games",
  description: "Browse and join party games with your squad",
  openGraph: {
    title: "Discover Games | Squad Party",
    description: "Browse and join party games with your squad",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
