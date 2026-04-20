import SwiftUI

/// Discover — browse community-published games.
///
/// Fetches published games from the backend and displays them
/// in a scrollable grid. Users can preview and join sessions.
///
/// Phase 5, Item 2 — Core screens ported.
struct DiscoverView: View {
    @EnvironmentObject var appState: AppState
    @State private var games: [PublishedGame] = []
    @State private var isLoading = true
    @State private var searchText = ""

    var filteredGames: [PublishedGame] {
        if searchText.isEmpty { return games }
        return games.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Loading games...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if filteredGames.isEmpty {
                    ContentUnavailableView(
                        "No Games Yet",
                        systemImage: "gamecontroller",
                        description: Text("Be the first to create a game in the Studio!")
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            ForEach(filteredGames) { game in
                                GameCard(game: game)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Discover")
            .searchable(text: $searchText, prompt: "Search games")
            .refreshable { await loadGames() }
            .task { await loadGames() }
        }
    }

    private func loadGames() async {
        isLoading = true
        defer { isLoading = false }

        guard let url = URL(string: "\(appState.baseURL)/api/games/published") else { return }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            games = try JSONDecoder().decode([PublishedGame].self, from: data)
        } catch {
            games = []
        }
    }
}

/// A published game card in the discover grid.
struct GameCard: View {
    let game: PublishedGame

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color("Coral").opacity(0.15))
                .frame(height: 100)
                .overlay {
                    Text("🎮")
                        .font(.system(size: 36))
                }

            Text(game.title)
                .font(.headline)
                .lineLimit(1)

            Text(game.description)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)

            HStack {
                Label("\(game.playerCount)", systemImage: "person.2")
                    .font(.caption2)
                Spacer()
                Text(game.category)
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color("Coral").opacity(0.2))
                    .clipShape(Capsule())
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

/// Published game model.
struct PublishedGame: Identifiable, Decodable {
    let id: String
    let title: String
    let description: String
    let playerCount: Int
    let category: String
    let createdBy: String
}
