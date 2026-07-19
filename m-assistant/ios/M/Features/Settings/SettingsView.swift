import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @State private var activeLanguage: String = ""
    @State private var newLanguage: String = ""
    @State private var errorMessage: String?
    @State private var isSaving = false
    private let supabase = SupabaseService()

    var body: some View {
        @Bindable var appState = appState
        Form {
            Section("Backend") {
                TextField("Worker URL", text: $appState.backendBaseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Text("Example: https://m-backend.yourname.workers.dev")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("Supabase") {
                TextField("Project URL", text: $appState.supabaseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                SecureField("Anon key", text: $appState.supabaseAnonKey)
            }

            Section("Language") {
                if activeLanguage.isEmpty {
                    Text("Loading…").foregroundStyle(.secondary)
                } else {
                    Text("Active: \(activeLanguage)")
                }
                TextField("Switch to (e.g. Spanish)", text: $newLanguage)
                Button("Switch language") { Task { await switchLanguage() } }
                    .disabled(isSaving || newLanguage.trimmingCharacters(in: .whitespaces).isEmpty)
                Text("Tonight's phrase generation will use the new language.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
        }
        .navigationTitle("Settings")
        .task { await loadLanguage() }
    }

    private func loadLanguage() async {
        do {
            activeLanguage = try await supabase.fetchLanguageSettings(appState: appState)?.activeLanguage ?? "Farsi"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func switchLanguage() async {
        isSaving = true
        defer { isSaving = false }
        do {
            try await supabase.setActiveLanguage(newLanguage, appState: appState)
            activeLanguage = newLanguage
            newLanguage = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { SettingsView() }.environment(AppState())
}
