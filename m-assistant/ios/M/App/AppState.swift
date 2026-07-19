import Foundation

@Observable
final class AppState {
    var backendBaseURL: String {
        get { UserDefaults.standard.string(forKey: "backendBaseURL") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "backendBaseURL") }
    }

    var supabaseURL: String {
        get { UserDefaults.standard.string(forKey: "supabaseURL") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "supabaseURL") }
    }

    var supabaseAnonKey: String {
        get { UserDefaults.standard.string(forKey: "supabaseAnonKey") ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: "supabaseAnonKey") }
    }
}
