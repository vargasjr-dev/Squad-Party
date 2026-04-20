import SwiftUI

/// AuthView — Sign in / Sign up screens.
///
/// Two-tab auth form with email/password. Shares the same
/// better-auth backend as the web app. On success, updates
/// AppState to flip to the main tab view.
///
/// Phase 5, Item 1 — iOS auth flow.
struct AuthView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var authService: AuthService
    @State private var mode: AuthMode = .signIn
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var showError = false

    init(baseURL: String) {
        _authService = StateObject(wrappedValue: AuthService(baseURL: baseURL))
    }

    enum AuthMode: String, CaseIterable {
        case signIn = "Sign In"
        case signUp = "Sign Up"
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 12) {
                Text("🎮")
                    .font(.system(size: 60))
                Text("Squad Party")
                    .font(.title)
                    .fontWeight(.bold)
            }
            .padding(.top, 60)
            .padding(.bottom, 32)

            // Mode picker
            Picker("", selection: $mode) {
                ForEach(AuthMode.allCases, id: \.self) { m in
                    Text(m.rawValue).tag(m)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 32)
            .padding(.bottom, 24)

            // Form
            VStack(spacing: 16) {
                if mode == .signUp {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                        .autocorrectionDisabled()
                        .textFieldStyle(AuthTextFieldStyle())
                }

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                    .autocorrectionDisabled()
                    .textFieldStyle(AuthTextFieldStyle())

                SecureField("Password", text: $password)
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .textFieldStyle(AuthTextFieldStyle())
            }
            .padding(.horizontal, 32)

            // Error
            if let error = authService.error, showError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.top, 8)
                    .padding(.horizontal, 32)
            }

            // Submit
            Button(action: submit) {
                Group {
                    if authService.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text(mode.rawValue)
                            .fontWeight(.semibold)
                    }
                }
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
            .disabled(!isValid || authService.isLoading)
            .opacity(isValid ? 1.0 : 0.5)
            .padding(.horizontal, 32)
            .padding(.top, 24)

            Spacer()
        }
    }

    private var isValid: Bool {
        let hasEmail = !email.trimmingCharacters(in: .whitespaces).isEmpty
        let hasPassword = password.count >= 6
        let hasName = mode == .signIn || !name.trimmingCharacters(in: .whitespaces).isEmpty
        return hasEmail && hasPassword && hasName
    }

    private func submit() {
        showError = false
        Task {
            let result: AuthResult
            if mode == .signUp {
                result = await authService.signUp(name: name, email: email, password: password)
            } else {
                result = await authService.signIn(email: email, password: password)
            }

            switch result {
            case .success(let user):
                appState.currentUser = User(
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image
                )
                appState.isAuthenticated = true
            case .failure:
                showError = true
            }
        }
    }
}

// MARK: - Custom text field style

struct AuthTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
