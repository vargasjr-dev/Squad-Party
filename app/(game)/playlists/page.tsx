import { redirect } from "next/navigation";

/**
 * /playlists — deprecated for now.
 * Game creation comes first; playlists are a later feature.
 * Send anyone landing here to the Game Studio.
 */
export default function PlaylistsPage() {
  redirect("/create");
}
