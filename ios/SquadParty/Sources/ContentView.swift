import SwiftUI

/// Root view — tab-based navigation matching the web app.
struct ContentView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        if appState.isAuthenticated {
            MainTabView()
        } else {
            WelcomeView()
        }
    }
}

/// Main tab bar — 4 tabs matching the web nav.
struct MainTabView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            DiscoverTab()
                .tabItem {
                    Label("Discover", systemImage: "globe")
                }
                .tag(AppState.Tab.discover)

            CreateTab()
                .tabItem {
                    Label("Create", systemImage: "paintbrush")
                }
                .tag(AppState.Tab.create)

            SessionsTab()
                .tabItem {
                    Label("Sessions", systemImage: "gamecontroller")
                }
                .tag(AppState.Tab.sessions)

            ProfileTab()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(AppState.Tab.profile)
        }
        .tint(Color("Coral"))
    }
}

/// Welcome / sign-in screen for unauthenticated users.
struct WelcomeView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("🎮")
                .font(.system(size: 80))

            Text("Squad Party")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Create and play mini-games\nwith friends")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Spacer()

            Button(action: {
                // Auth flow wired in Phase 5 Item 1
            }) {
                Text("Sign In")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [Color("Coral"), Color("Coral").opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
            .padding(.horizontal, 32)

            Spacer()
                .frame(height: 40)
        }
    }
}

// MARK: - Tab Placeholders

struct DiscoverTab: View {
    var body: some View {
        NavigationStack {
            Text("Discover games from the community")
                .navigationTitle("Discover")
        }
    }
}

struct CreateTab: View {
    var body: some View {
        NavigationStack {
            Text("Create games with AI")
                .navigationTitle("Game Studio")
        }
    }
}

struct SessionsTab: View {
    var body: some View {
        NavigationStack {
            Text("Your active sessions")
                .navigationTitle("Sessions")
        }
    }
}

struct ProfileTab: View {
    var body: some View {
        NavigationStack {
            Text("Your profile and stats")
                .navigationTitle("Profile")
        }
    }
}
