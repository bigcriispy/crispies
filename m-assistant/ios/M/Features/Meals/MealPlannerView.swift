import SwiftUI

struct MealPlannerView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = MealsViewModel()
    @State private var plannedDate = Date().addingTimeInterval(86400)
    @State private var mealType = "dinner"
    @State private var description = ""
    @State private var errorMessage: String?

    var body: some View {
        List {
            Section("Plan / meal prep") {
                DatePicker("Date", selection: $plannedDate, displayedComponents: .date)
                Picker("Type", selection: $mealType) {
                    Text("Breakfast").tag("breakfast")
                    Text("Lunch").tag("lunch")
                    Text("Dinner").tag("dinner")
                    Text("Snack").tag("snack")
                }
                TextField("Plan", text: $description, axis: .vertical)
                Button("Add to plan") { Task { await save() } }
                    .disabled(description.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("Upcoming") {
                ForEach(upcoming) { meal in
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
        .navigationTitle("Plan Meals")
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }

    private var upcoming: [Meal] {
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10).description
        return viewModel.meals.filter { $0.date >= today }.sorted { $0.date < $1.date }
    }

    private func save() async {
        let dateString = ISO8601DateFormatter().string(from: plannedDate).prefix(10).description
        do {
            try await SupabaseService().planMeal(date: dateString, mealType: mealType, description: description, appState: appState)
            description = ""
            await viewModel.load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { MealPlannerView() }.environment(AppState())
}
