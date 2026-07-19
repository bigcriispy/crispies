import SwiftUI

struct TasksListView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = TasksViewModel()

    var body: some View {
        List {
            ForEach(viewModel.tasks) { task in
                TaskRow(task: task) {
                    Task { await viewModel.toggle(task, appState: appState) }
                }
            }
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
        }
        .navigationTitle("Tasks")
        .refreshable { await viewModel.load(appState: appState) }
        .task { await viewModel.load(appState: appState) }
    }
}

struct TaskRow: View {
    let task: TaskItem
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            HStack {
                Image(systemName: task.done ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(task.done ? .green : .secondary)
                VStack(alignment: .leading) {
                    Text(task.title)
                        .strikethrough(task.done)
                    if let due = task.dueDate {
                        Text("Due \(due)").font(.caption).foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationStack { TasksListView() }.environment(AppState())
}
