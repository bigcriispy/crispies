import SwiftUI

struct CheckInView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = CheckInViewModel()

    var body: some View {
        NavigationStack {
            Form {
                Section("Sleep") {
                    TextField("Hours", text: $viewModel.sleepHours)
                        .keyboardType(.decimalPad)
                    Stepper("Quality: \(viewModel.sleepQuality)/5", value: $viewModel.sleepQuality, in: 1...5)
                    Button("Log sleep") { Task { await viewModel.submitSleep(appState: appState) } }
                }

                Section("Meal") {
                    Picker("Type", selection: $viewModel.mealType) {
                        Text("Breakfast").tag("breakfast")
                        Text("Lunch").tag("lunch")
                        Text("Dinner").tag("dinner")
                        Text("Snack").tag("snack")
                    }
                    TextField("What did you eat", text: $viewModel.mealDescription, axis: .vertical)
                    Button("Log meal") { Task { await viewModel.submitMeal(appState: appState) } }
                }

                Section("Workout") {
                    TextField("Type (e.g. run, lift, HIIT)", text: $viewModel.workoutType)
                    TextField("Duration (minutes)", text: $viewModel.workoutDuration)
                        .keyboardType(.numberPad)
                    Stepper("Intensity: \(viewModel.workoutIntensity)/5", value: $viewModel.workoutIntensity, in: 1...5)
                    Button("Log workout") { Task { await viewModel.submitWorkout(appState: appState) } }
                }

                if let error = viewModel.errorMessage {
                    Text(error).foregroundStyle(.red)
                }
                if let saved = viewModel.savedSection {
                    Text("Saved \(saved).").foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Check In")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
            .disabled(viewModel.isSaving)
        }
    }
}

#Preview {
    CheckInView().environment(AppState())
}
