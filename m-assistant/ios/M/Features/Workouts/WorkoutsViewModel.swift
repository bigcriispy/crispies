import Foundation

@Observable
final class WorkoutsViewModel {
    var workouts: [Workout] = []
    var errorMessage: String?

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        do {
            workouts = try await supabase.fetchWorkouts(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
