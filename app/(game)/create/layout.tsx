import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Studio",
  description:
    "Create custom party games with AI — describe your game and watch it come to life",
  openGraph: {
    title: "Game Studio | Squad Party",
    description:
      "Create custom party games with AI — describe your game and watch it come to life",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
