import SwiftUI

struct MealTrackerView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = MealsViewModel()
    @State private var mealType = "breakfast"
    @State private var description = ""

    var body: some View {
        List {
            Section("Log a meal") {
                Picker("Type", selection: $mealType) {
                    Text("Breakfast").tag("breakfast")
                    Text("Lunch").tag("lunch")
                    Text("Dinner").tag("dinner")
                    Text("Snack").tag("snack")
                }
                TextField("What did you eat", text: $description, axis: .vertical)
                Button("Save") { Task { await save() } }
                    .disabled(description.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("History") {
                ForEach(viewModel.meals) { meal in
                    VStack(alignment: .leading) {
                        HStack {
                            Text(meal.mealType.capitalized)
                            Spacer()
                            Text(meal.date).foregroundStyle(.secondary)
                        }
                        if let description = meal.description {
                            Text(description).font(.caption)
                        }
                    }
                }
            }
        }
        .navigationTitle("Meals")
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }

    private func save() async {
        do {
            try await APIClient(appState: appState).logMeal(date: nil, mealType: mealType, description: description)
            description = ""
            await viewModel.load(appState: appState)
        } catch {
            viewModel.errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { MealTrackerView() }.environment(AppState())
}
