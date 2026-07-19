import SwiftUI

struct WorkoutTrackerView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = WorkoutsViewModel()
    @State private var type = ""
    @State private var duration = ""
    @State private var intensity = 3

    var body: some View {
        List {
            Section("Log a completed workout") {
                TextField("Type", text: $type)
                TextField("Duration (minutes)", text: $duration).keyboardType(.numberPad)
                Stepper("Intensity: \(intensity)/5", value: $intensity, in: 1...5)
                Button("Save") { Task { await save() } }
            }
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("History") {
                ForEach(viewModel.workouts) { workout in
                    VStack(alignment: .leading) {
                        HStack {
                            Text(workout.type ?? "Workout")
                            Spacer()
                            Text(workout.date).foregroundStyle(.secondary)
                        }
                        HStack {
                            if let duration = workout.durationMinutes {
                                Text("\(duration) min")
                            }
                            if let intensity = workout.intensity {
                                Text("· intensity \(intensity)/5")
                            }
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .navigationTitle("Workouts")
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }

    private func save() async {
        do {
            try await APIClient(appState: appState).logWorkout(
                date: nil,
                type: type.isEmpty ? nil : type,
                durationMinutes: Int(duration),
                intensity: intensity,
                notes: nil
            )
            type = ""
            duration = ""
            await viewModel.load(appState: appState)
        } catch {
            viewModel.errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { WorkoutTrackerView() }.environment(AppState())
}
