import Foundation

@Observable
final class GoalsViewModel {
    var goals: [Goal] = []
    var isLoading = false
    var errorMessage: String?
    var isPlanning = false
    var newGoalTitle = ""
    var lastPlan: GoalPlanResponse?

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        isLoading = true
        defer { isLoading = false }
        do {
            goals = try await supabase.fetchGoals(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Creates the goal via the Worker, which uses Sonnet to break it into
    /// tasks + calendar events and writes them all in one shot.
    func createGoal(appState: AppState) async {
        let title = newGoalTitle.trimmingCharacters(in: .whitespaces)
        guard !title.isEmpty else { return }
        isPlanning = true
        errorMessage = nil
        defer { isPlanning = false }
        do {
            let plan = try await APIClient(appState: appState).createGoal(title: title)
            lastPlan = plan
            newGoalTitle = ""
            await load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func setStatus(_ goal: Goal, status: String, appState: AppState) async {
        do {
            try await supabase.updateGoal(id: goal.id, fields: ["status": .string(status)], appState: appState)
            await load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
