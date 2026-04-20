import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game History",
  description: "Review your past games and scores",
  openGraph: {
    title: "Game History | Squad Party",
    description: "Review your past games and scores",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
