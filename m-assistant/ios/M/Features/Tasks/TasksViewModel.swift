import Foundation

@Observable
final class TasksViewModel {
    var tasks: [TaskItem] = []
    var errorMessage: String?

    private let supabase = SupabaseService()

    func load(goalId: UUID? = nil, appState: AppState) async {
        do {
            tasks = try await supabase.fetchTasks(goalId: goalId, appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggle(_ task: TaskItem, appState: AppState) async {
        do {
            try await supabase.setTaskDone(id: task.id, done: !task.done, appState: appState)
            if let index = tasks.firstIndex(where: { $0.id == task.id }) {
                tasks[index].done.toggle()
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
