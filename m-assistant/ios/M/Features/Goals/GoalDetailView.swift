import SwiftUI

struct GoalDetailView: View {
    let goal: Goal
    let viewModel: GoalsViewModel
    @Environment(AppState.self) private var appState
    @State private var tasksViewModel = TasksViewModel()

    private let statuses = ["active", "on_track", "slipping", "done", "abandoned"]

    var body: some View {
        List {
            Section {
                if let description = goal.description {
                    Text(description)
                }
                Picker("Status", selection: Binding(
                    get: { goal.status },
                    set: { newValue in Task { await viewModel.setStatus(goal, status: newValue, appState: appState) } }
                )) {
                    ForEach(statuses, id: \.self) { Text($0.replacingOccurrences(of: "_", with: " ").capitalized).tag($0) }
                }
            }

            Section("Tasks") {
                ForEach(tasksViewModel.tasks) { task in
                    TaskRow(task: task) {
                        Task { await tasksViewModel.toggle(task, appState: appState) }
                    }
                }
            }
        }
        .navigationTitle(goal.title)
        .task { await tasksViewModel.load(goalId: goal.id, appState: appState) }
    }
}
