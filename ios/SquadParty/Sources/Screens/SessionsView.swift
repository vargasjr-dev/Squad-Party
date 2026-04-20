import SwiftUI

/// Sessions — active and past game sessions.
///
/// Shows current/active sessions the user has joined, past
/// session history with results, and a "Host Game" action.
///
/// Phase 5, Item 2 — Core screens ported.
struct SessionsView: View {
    @EnvironmentObject var appState: AppState
    @State private var sessions: [GameSession] = []
    @State private var isLoading = true
    @State private var filter: SessionFilter = .active

    enum SessionFilter: String, CaseIterable {
        case active = "Active"
        case history = "History"
    }

    var filteredSessions: [GameSession] {
        switch filter {
        case .active:
            return sessions.filter { $0.status == "active" || $0.status == "waiting" }
        case .history:
            return sessions.filter { $0.status == "finished" }
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("Filter", selection: $filter) {
                    ForEach(SessionFilter.allCases, id: \.self) { f in
                        Text(f.rawValue).tag(f)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                if isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if filteredSessions.isEmpty {
                    ContentUnavailableView(
                        filter == .active ? "No Active Sessions" : "No Past Games",
                        systemImage: filter == .active ? "gamecontroller" : "clock",
                        description: Text(filter == .active
                            ? "Host a game or join one from Discover!"
                            : "Your game history will appear here.")
                    )
                } else {
                    List(filteredSessions) { session in
                        SessionRow(session: session)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Sessions")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: {}) {
                        Label("Host", systemImage: "plus.circle.fill")
                    }
                    .tint(Color("Coral"))
                }
            }
            .refreshable { await loadSessions() }
            .task { await loadSessions() }
        }
    }

    private func loadSessions() async {
        isLoading = true
        defer { isLoading = false }

        guard let userId = appState.currentUser?.id,
              let url = URL(string: "\(appState.baseURL)/api/sessions?userId=\(userId)") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            sessions = try JSONDecoder().decode([GameSession].self, from: data)
        } catch {
            sessions = []
        }
    }
}

/// A session row in the list.
struct SessionRow: View {
    let session: GameSession

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(session.status == "active" ? Color.green : Color.gray)
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 4) {
                Text(session.gameName)
                    .font(.headline)
                Text("\(session.playerCount) players")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if session.status == "active" {
                Text("LIVE")
                    .font(.caption2)
                    .fontWeight(.bold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .foregroundStyle(.green)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 4)
    }
}

/// Game session model.
struct GameSession: Identifiable, Decodable {
    let id: String
    let gameName: String
    let status: String
    let playerCount: Int
    let createdAt: String
}
