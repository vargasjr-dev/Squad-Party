import SwiftUI

/// Squad Party iOS App — SwiftUI entry point.
///
/// The native iOS client for Squad Party. Shares the backend
/// with the web app (Next.js) and adds native features:
/// - Push notifications for session invites
/// - Native Game Studio chat UI
/// - Lua game execution
/// - Optimized for iOS gestures and haptics
///
/// Phase 5, Item 0 — project foundation.
@main
struct SquadPartyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

/// Global app state — auth, navigation, user preferences.
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User? = nil
    @Published var selectedTab: Tab = .discover

    enum Tab: String, CaseIterable {
        case discover = "Discover"
        case create = "Create"
        case sessions = "Sessions"
        case profile = "Profile"
    }

    /// Base URL for the shared backend.
    let baseURL: String = {
        #if DEBUG
        return "http://localhost:3000"
        #else
        return "https://squad-party.vercel.app"
        #endif
    }()
}

/// User model — mirrors the web app's auth schema.
struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let image: String?
}
