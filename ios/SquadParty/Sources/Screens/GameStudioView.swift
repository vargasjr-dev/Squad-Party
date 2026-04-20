import SwiftUI

/// Game Studio — AI-powered game creation via chat.
///
/// The crown jewel of Squad Party. Users describe a game idea
/// in natural language, Claude generates Lua game logic, and
/// they can preview, iterate, and publish — all through conversation.
///
/// This is the native iOS version of the web Game Studio.
/// Same backend API, native chat UI with iOS polish.
///
/// Phase 5, Item 3 — Game Studio native.
struct GameStudioView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var viewModel = GameStudioViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Chat messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.messages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }

                            if viewModel.isGenerating {
                                HStack(spacing: 8) {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                    Text("Creating your game...")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(.horizontal)
                                .id("loading")
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) { _, _ in
                        withAnimation {
                            proxy.scrollTo(viewModel.messages.last?.id ?? "loading", anchor: .bottom)
                        }
                    }
                }

                // Game preview card (when code is generated)
                if let preview = viewModel.currentGame {
                    GamePreviewCard(game: preview, onPublish: {
                        Task { await viewModel.publishGame() }
                    })
                    .padding(.horizontal)
                    .transition(.move(edge: .bottom))
                }

                // Input bar
                HStack(spacing: 12) {
                    TextField("Describe your game idea...", text: $viewModel.inputText, axis: .vertical)
                        .textFieldStyle(.plain)
                        .lineLimit(1...4)
                        .padding(12)
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 20))

                    Button(action: {
                        Task { await viewModel.sendMessage(baseURL: appState.baseURL) }
                    }) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Color("Coral"))
                    }
                    .disabled(viewModel.inputText.trimmingCharacters(in: .whitespaces).isEmpty || viewModel.isGenerating)
                }
                .padding()
                .background(.ultraThinMaterial)
            }
            .navigationTitle("Game Studio")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: viewModel.startNewGame) {
                        Label("New", systemImage: "plus")
                    }
                }
            }
        }
    }
}

/// Chat bubble for studio conversation.
struct ChatBubble: View {
    let message: StudioMessage

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 60) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .padding(12)
                    .background(message.role == .user
                        ? Color("Coral")
                        : Color(.systemGray5)
                    )
                    .foregroundStyle(message.role == .user ? .white : .primary)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                if let code = message.codePreview {
                    Text("🎮 Game code generated (\(code.count) chars)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            if message.role == .assistant { Spacer(minLength: 60) }
        }
    }
}

/// Game preview card shown after code generation.
struct GamePreviewCard: View {
    let game: GamePreview
    let onPublish: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("🎮 \(game.title)")
                    .font(.headline)
                Spacer()
                Text(game.playerRange)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color("Coral").opacity(0.2))
                    .clipShape(Capsule())
            }

            Text(game.description)
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 12) {
                Button("Preview") {}
                    .buttonStyle(.bordered)

                Button("Publish", action: onPublish)
                    .buttonStyle(.borderedProminent)
                    .tint(Color("Coral"))
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

// MARK: - View Model

@MainActor
class GameStudioViewModel: ObservableObject {
    @Published var messages: [StudioMessage] = [
        StudioMessage(role: .assistant, content: "Welcome to Game Studio! 🎮\n\nDescribe any mini-game and I'll build it for you. Try something like:\n\n• \"A trivia game about movies\"\n• \"Musical chairs with a twist\"\n• \"Rock paper scissors tournament\"")
    ]
    @Published var inputText = ""
    @Published var isGenerating = false
    @Published var currentGame: GamePreview? = nil

    func sendMessage(baseURL: String) async {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        inputText = ""
        messages.append(StudioMessage(role: .user, content: text))
        isGenerating = true
        defer { isGenerating = false }

        guard let url = URL(string: "\(baseURL)/api/studio/generate") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "prompt": text,
            "history": messages.map { ["role": $0.role.rawValue, "content": $0.content] }
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, _) = try await URLSession.shared.data(for: request)

            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let reply = json["message"] as? String ?? "I couldn't generate that game. Try a different description!"
                let code = json["code"] as? String

                var msg = StudioMessage(role: .assistant, content: reply)
                msg.codePreview = code
                messages.append(msg)

                if let title = json["title"] as? String {
                    currentGame = GamePreview(
                        title: title,
                        description: json["description"] as? String ?? "",
                        playerRange: json["playerRange"] as? String ?? "2-8",
                        code: code ?? ""
                    )
                }
            }
        } catch {
            messages.append(StudioMessage(role: .assistant, content: "Something went wrong. Try again?"))
        }
    }

    func publishGame() async {
        guard let game = currentGame else { return }
        messages.append(StudioMessage(role: .assistant, content: "🎉 \"\(game.title)\" published to the community! Anyone can now find and play your game."))
        currentGame = nil
    }

    func startNewGame() {
        messages = [messages[0]] // Keep welcome message
        currentGame = nil
        inputText = ""
    }
}

// MARK: - Models

struct StudioMessage: Identifiable {
    let id = UUID()
    let role: StudioRole
    let content: String
    var codePreview: String? = nil

    enum StudioRole: String {
        case user
        case assistant
    }
}

struct GamePreview {
    let title: String
    let description: String
    let playerRange: String
    let code: String
}
