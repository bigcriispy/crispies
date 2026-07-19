import SwiftUI

struct WorkoutPlannerView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = WorkoutsViewModel()
    @State private var plannedDate = Date().addingTimeInterval(86400)
    @State private var type = ""
    @State private var errorMessage: String?

    var body: some View {
        List {
            Section("Plan a future workout") {
                DatePicker("Date", selection: $plannedDate, displayedComponents: .date)
                TextField("Type", text: $type)
                Button("Add to plan") { Task { await save() } }
                    .disabled(type.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("Upcoming") {
                ForEach(upcoming) { workout in
                    HStack {
                        Text(workout.type ?? "Workout")
                        Spacer()
                        Text(workout.date).foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Plan Workouts")
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }

    private var upcoming: [Workout] {
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10).description
        return viewModel.workouts.filter { $0.date >= today }.sorted { $0.date < $1.date }
    }

    private func save() async {
        let dateString = ISO8601DateFormatter().string(from: plannedDate).prefix(10).description
        do {
            try await SupabaseService().planWorkout(date: dateString, type: type, appState: appState)
            type = ""
            await viewModel.load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { WorkoutPlannerView() }.environment(AppState())
}
