import SwiftUI

/// Squad Party Design System
/// Shared colors, typography, and component styles.
/// Matches the web Tailwind palette exactly.
enum Theme {
    // MARK: - Colors
    static let coral = Color("Coral")
    static let yellow = Color("Yellow")
    static let navy = Color("Navy")
    static let charcoal = Color("Charcoal")

    // MARK: - Gradients
    static let backgroundGradient = LinearGradient(
        colors: [navy, charcoal],
        startPoint: .top,
        endPoint: .bottom
    )

    static let coralGradient = LinearGradient(
        colors: [coral, coral.opacity(0.8)],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let heroGradient = LinearGradient(
        colors: [coral, yellow],
        startPoint: .leading,
        endPoint: .trailing
    )

    // MARK: - Spacing
    static let cornerRadius: CGFloat = 12
    static let cardPadding: CGFloat = 16
    static let sectionSpacing: CGFloat = 24

    // MARK: - Text Styles
    static func heading(_ text: String) -> some View {
        Text(text)
            .font(.title2)
            .fontWeight(.bold)
            .foregroundStyle(.white)
    }

    static func subheading(_ text: String) -> some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(.secondary)
    }
}

// MARK: - Reusable View Modifiers

struct CoralButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(Theme.coralGradient)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(Theme.cardPadding)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: Theme.cornerRadius))
    }
}

extension View {
    func card() -> some View {
        modifier(CardModifier())
    }
}

extension ButtonStyle where Self == CoralButtonStyle {
    static var coral: CoralButtonStyle { CoralButtonStyle() }
}
