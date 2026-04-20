import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Browse curated game playlists for every occasion",
  openGraph: {
    title: "Playlists | Squad Party",
    description: "Browse curated game playlists for every occasion",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
