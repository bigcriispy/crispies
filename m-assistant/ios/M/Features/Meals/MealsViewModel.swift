import Foundation

@Observable
final class MealsViewModel {
    var meals: [Meal] = []
    var errorMessage: String?

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        do {
            meals = try await supabase.fetchMeals(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
