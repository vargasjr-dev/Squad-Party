import SwiftUI

/// Profile — user info, stats, and sign out.
///
/// Displays the signed-in user's profile, game stats, and
/// provides sign-out functionality.
///
/// Phase 5, Item 2 — Core screens ported.
struct ProfileView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                // Profile header
                Section {
                    HStack(spacing: 16) {
                        if let image = appState.currentUser?.image,
                           let url = URL(string: image) {
                            AsyncImage(url: url) { img in
                                img.resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                profilePlaceholder
                            }
                            .frame(width: 64, height: 64)
                            .clipShape(Circle())
                        } else {
                            profilePlaceholder
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(appState.currentUser?.name ?? "Player")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text(appState.currentUser?.email ?? "")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }

                // Stats
                Section("Stats") {
                    StatRow(label: "Games Played", value: "—", icon: "gamecontroller")
                    StatRow(label: "Games Created", value: "—", icon: "paintbrush")
                    StatRow(label: "Win Rate", value: "—", icon: "trophy")
                }

                // Settings
                Section("Settings") {
                    NavigationLink {
                        Text("Notifications settings")
                    } label: {
                        Label("Notifications", systemImage: "bell")
                    }

                    NavigationLink {
                        Text("Appearance settings")
                    } label: {
                        Label("Appearance", systemImage: "paintpalette")
                    }
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        let auth = AuthService(baseURL: appState.baseURL)
                        auth.signOut()
                        appState.isAuthenticated = false
                        appState.currentUser = nil
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }

    private var profilePlaceholder: some View {
        Circle()
            .fill(Color("Coral").opacity(0.2))
            .frame(width: 64, height: 64)
            .overlay {
                Text(String((appState.currentUser?.name.first ?? "?")).uppercased())
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundStyle(Color("Coral"))
            }
    }
}

/// Stat row helper.
struct StatRow: View {
    let label: String
    let value: String
    let icon: String

    var body: some View {
        HStack {
            Label(label, systemImage: icon)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
        }
    }
}
