import SwiftUI

struct RitualsListView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = RitualsViewModel()
    @State private var showingAdd = false

    var body: some View {
        NavigationStack {
            List {
                Section("Due now") {
                    ForEach(viewModel.dueRituals) { item in
                        Button {
                            Task { await viewModel.toggle(item, appState: appState) }
                        } label: {
                            HStack {
                                Image(systemName: item.log.done ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(item.log.done ? .green : .secondary)
                                VStack(alignment: .leading) {
                                    Text(item.ritual.name)
                                    Text(item.ritual.frequency.capitalized)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                NavigationLink(value: item.ritual) {
                                    Image(systemName: "chart.bar")
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                if let error = viewModel.errorMessage {
                    Text(error).foregroundStyle(.red)
                }
            }
            .navigationTitle("Rituals")
            .navigationDestination(for: Ritual.self) { ritual in
                RitualStatsView(ritual: ritual)
            }
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showingAdd = true } label: { Image(systemName: "plus") }
                }
            }
            .sheet(isPresented: $showingAdd) {
                addRitualSheet
            }
            .task { await viewModel.load(appState: appState) }
            .refreshable { await viewModel.load(appState: appState) }
        }
    }

    private var addRitualSheet: some View {
        NavigationStack {
            Form {
                TextField("Name", text: $viewModel.newRitualName)
                Picker("Frequency", selection: $viewModel.newRitualFrequency) {
                    Text("Daily").tag("daily")
                    Text("Weekly").tag("weekly")
                    Text("Monthly").tag("monthly")
                }
            }
            .navigationTitle("New Ritual")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        Task {
                            await viewModel.addRitual(appState: appState)
                            showingAdd = false
                        }
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showingAdd = false }
                }
            }
        }
    }
}

#Preview {
    RitualsListView().environment(AppState())
}
