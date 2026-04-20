import Foundation

/// AuthService — talks to the shared better-auth backend.
///
/// The iOS app shares the same backend as the web app (Next.js).
/// Auth endpoints are at /api/auth/* via better-auth.
/// This service handles sign-in, sign-up, session validation,
/// and sign-out — storing tokens securely in Keychain.
///
/// Phase 5, Item 1 — iOS auth flow.
@MainActor
class AuthService: ObservableObject {
    @Published var isLoading = false
    @Published var error: String?

    private let baseURL: String

    init(baseURL: String) {
        self.baseURL = baseURL
    }

    // MARK: - Sign In

    func signIn(email: String, password: String) async -> AuthResult {
        isLoading = true
        error = nil
        defer { isLoading = false }

        let body: [String: String] = ["email": email, "password": password]

        guard let result = await post(path: "/api/auth/sign-in/email", body: body) else {
            return .failure("Could not reach the server")
        }

        if let token = result["token"] as? String,
           let user = result["user"] as? [String: Any] {
            KeychainHelper.save(key: KeychainHelper.Keys.sessionToken, value: token)
            if let userId = user["id"] as? String {
                KeychainHelper.save(key: KeychainHelper.Keys.userId, value: userId)
            }
            return .success(parseUser(from: user))
        }

        let msg = result["message"] as? String ?? "Sign in failed"
        error = msg
        return .failure(msg)
    }

    // MARK: - Sign Up

    func signUp(name: String, email: String, password: String) async -> AuthResult {
        isLoading = true
        error = nil
        defer { isLoading = false }

        let body: [String: String] = ["name": name, "email": email, "password": password]

        guard let result = await post(path: "/api/auth/sign-up/email", body: body) else {
            return .failure("Could not reach the server")
        }

        if let token = result["token"] as? String,
           let user = result["user"] as? [String: Any] {
            KeychainHelper.save(key: KeychainHelper.Keys.sessionToken, value: token)
            if let userId = user["id"] as? String {
                KeychainHelper.save(key: KeychainHelper.Keys.userId, value: userId)
            }
            return .success(parseUser(from: user))
        }

        let msg = result["message"] as? String ?? "Sign up failed"
        error = msg
        return .failure(msg)
    }

    // MARK: - Session

    func getSession() async -> AuthUser? {
        guard let token = KeychainHelper.read(key: KeychainHelper.Keys.sessionToken) else {
            return nil
        }

        guard let url = URL(string: "\(baseURL)/api/auth/get-session") else { return nil }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return nil
            }
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let user = json["user"] as? [String: Any] {
                return parseUser(from: user)
            }
        } catch {
            // Session expired or network error
        }

        return nil
    }

    // MARK: - Sign Out

    func signOut() {
        KeychainHelper.delete(key: KeychainHelper.Keys.sessionToken)
        KeychainHelper.delete(key: KeychainHelper.Keys.userId)
    }

    // MARK: - Helpers

    private func post(path: String, body: [String: String]) async -> [String: Any]? {
        guard let url = URL(string: "\(baseURL)\(path)") else { return nil }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = KeychainHelper.read(key: KeychainHelper.Keys.sessionToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    return json
                }
                return nil
            }
            return try JSONSerialization.jsonObject(with: data) as? [String: Any]
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    private func parseUser(from dict: [String: Any]) -> AuthUser {
        AuthUser(
            id: dict["id"] as? String ?? "",
            name: dict["name"] as? String ?? "",
            email: dict["email"] as? String ?? "",
            image: dict["image"] as? String
        )
    }
}

// MARK: - Types

struct AuthUser: Identifiable {
    let id: String
    let name: String
    let email: String
    let image: String?
}

enum AuthResult {
    case success(AuthUser)
    case failure(String)
}
