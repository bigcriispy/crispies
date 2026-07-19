import Foundation

@Observable
final class CheckInViewModel {
    var sleepHours: String = ""
    var sleepQuality: Int = 3
    var mealType: String = "breakfast"
    var mealDescription: String = ""
    var workoutType: String = ""
    var workoutDuration: String = ""
    var workoutIntensity: Int = 3

    var isSaving = false
    var errorMessage: String?
    var savedSection: String?

    private let mealTypes = ["breakfast", "lunch", "dinner", "snack"]

    func submitSleep(appState: AppState) async {
        guard let hours = Double(sleepHours) else {
            errorMessage = "Enter sleep hours as a number."
            return
        }
        await run {
            try await APIClient(appState: appState).logSleep(date: nil, hours: hours, quality: self.sleepQuality, notes: nil)
        }
        savedSection = "sleep"
    }

    func submitMeal(appState: AppState) async {
        guard !mealDescription.isEmpty else {
            errorMessage = "Enter what you ate."
            return
        }
        await run {
            try await APIClient(appState: appState).logMeal(date: nil, mealType: self.mealType, description: self.mealDescription)
        }
        savedSection = "meal"
        mealDescription = ""
    }

    func submitWorkout(appState: AppState) async {
        let duration = Int(workoutDuration)
        await run {
            try await APIClient(appState: appState).logWorkout(
                date: nil,
                type: self.workoutType.isEmpty ? nil : self.workoutType,
                durationMinutes: duration,
                intensity: self.workoutIntensity,
                notes: nil
            )
        }
        savedSection = "workout"
        workoutType = ""
        workoutDuration = ""
    }

    private func run(_ action: () async throws -> Void) async {
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }
        do {
            try await action()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
