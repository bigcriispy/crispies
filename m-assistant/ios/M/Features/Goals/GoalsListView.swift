import SwiftUI

struct GoalsListView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = GoalsViewModel()

    var body: some View {
        List {
            Section {
                TextField("New goal (e.g. \"Run a 10k by June\")", text: $viewModel.newGoalTitle, axis: .vertical)
                Button {
                    Task { await viewModel.createGoal(appState: appState) }
                } label: {
                    if viewModel.isPlanning {
                        ProgressView()
                    } else {
                        Text("Plan it")
                    }
                }
                .disabled(viewModel.isPlanning || viewModel.newGoalTitle.trimmingCharacters(in: .whitespaces).isEmpty)
            }

            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }

            Section("Goals") {
                ForEach(viewModel.goals) { goal in
                    NavigationLink(value: goal) {
                        GoalRow(goal: goal)
                    }
                }
            }
        }
        .navigationTitle("Goals")
        .navigationDestination(for: Goal.self) { goal in
            GoalDetailView(goal: goal, viewModel: viewModel)
        }
        .refreshable { await viewModel.load(appState: appState) }
        .task { await viewModel.load(appState: appState) }
    }
}

private struct GoalRow: View {
    let goal: Goal

    var body: some View {
        HStack {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            VStack(alignment: .leading) {
                Text(goal.title)
                if let targetDate = goal.targetDate {
                    Text("Target: \(targetDate)").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }

    private var statusColor: Color {
        switch goal.status {
        case "done": return .green
        case "on_track": return .blue
        case "slipping": return .orange
        case "abandoned": return .gray
        default: return .primary
        }
    }
}

#Preview {
    NavigationStack { GoalsListView() }.environment(AppState())
}
