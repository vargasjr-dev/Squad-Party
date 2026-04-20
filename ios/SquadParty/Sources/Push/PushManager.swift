import Foundation
import UserNotifications

/// PushManager — handles push notification registration and routing.
///
/// Manages the full lifecycle: request permission → register device
/// token with backend → handle incoming notifications → route to
/// the correct screen.
///
/// Notification types:
///   - session_invite: Someone invited you to a game session
///   - game_ready: Your session is about to start
///   - turn_notification: It's your turn in an async game
///   - game_published: A game you follow was updated
///
/// Phase 5, Item 4 — Push notifications.
@MainActor
class PushManager: NSObject, ObservableObject {
    @Published var hasPermission = false
    @Published var deviceToken: String?
    @Published var pendingRoute: PushRoute?

    private let baseURL: String

    init(baseURL: String) {
        self.baseURL = baseURL
        super.init()
    }

    // MARK: - Permission

    /// Request notification permission from the user.
    func requestPermission() async -> Bool {
        let center = UNUserNotificationCenter.current()

        do {
            let granted = try await center.requestAuthorization(
                options: [.alert, .badge, .sound]
            )
            hasPermission = granted
            return granted
        } catch {
            hasPermission = false
            return false
        }
    }

    /// Check current permission status.
    func checkPermission() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        hasPermission = settings.authorizationStatus == .authorized
    }

    // MARK: - Device Token Registration

    /// Register device token with the backend for targeted push.
    func registerToken(_ tokenData: Data) async {
        let token = tokenData.map { String(format: "%02.2hhx", $0) }.joined()
        deviceToken = token

        guard let userId = KeychainHelper.read(key: KeychainHelper.Keys.userId),
              let url = URL(string: "\(baseURL)/api/push/register") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let sessionToken = KeychainHelper.read(key: KeychainHelper.Keys.sessionToken) {
            request.setValue("Bearer \(sessionToken)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: String] = [
            "userId": userId,
            "deviceToken": token,
            "platform": "ios"
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let _ = try await URLSession.shared.data(for: request)
        } catch {
            // Silent fail — token registration is best-effort
        }
    }

    // MARK: - Notification Handling

    /// Parse an incoming push notification and determine routing.
    func handleNotification(userInfo: [AnyHashable: Any]) -> PushRoute? {
        guard let type = userInfo["type"] as? String else { return nil }

        switch type {
        case "session_invite":
            if let sessionId = userInfo["sessionId"] as? String {
                return .session(id: sessionId)
            }
        case "game_ready":
            if let sessionId = userInfo["sessionId"] as? String {
                return .session(id: sessionId)
            }
        case "turn_notification":
            if let sessionId = userInfo["sessionId"] as? String {
                return .session(id: sessionId)
            }
        case "game_published":
            if let gameId = userInfo["gameId"] as? String {
                return .game(id: gameId)
            }
        default:
            break
        }

        return nil
    }

    /// Schedule a local notification (for testing / offline).
    func scheduleLocal(title: String, body: String, delay: TimeInterval = 1) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: delay,
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - Push Routes

/// Deep link routes from push notifications.
enum PushRoute: Equatable {
    /// Navigate to a specific game session.
    case session(id: String)
    /// Navigate to a specific published game.
    case game(id: String)
    /// Navigate to the Game Studio.
    case studio
}

// MARK: - UNUserNotificationCenterDelegate

extension PushManager: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .badge, .sound]
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        await MainActor.run {
            pendingRoute = handleNotification(userInfo: userInfo)
        }
    }
}
