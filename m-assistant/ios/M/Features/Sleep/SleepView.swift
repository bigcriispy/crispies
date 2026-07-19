import SwiftUI
import Charts

struct SleepView: View {
    @Environment(AppState.self) private var appState
    @State private var logs: [SleepLog] = []
    @State private var hours = ""
    @State private var quality = 3
    @State private var errorMessage: String?
    private let supabase = SupabaseService()

    var body: some View {
        List {
            Section("Log tonight") {
                TextField("Hours", text: $hours).keyboardType(.decimalPad)
                Stepper("Quality: \(quality)/5", value: $quality, in: 1...5)
                Button("Save") { Task { await save() } }
                    .disabled(Double(hours) == nil)
            }
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            if !logs.isEmpty {
                Section("Last 14 nights") {
                    Chart(logs.prefix(14).reversed(), id: \.id) { log in
                        BarMark(x: .value("Date", log.date), y: .value("Hours", log.hours ?? 0))
                    }
                    .frame(height: 160)
                }
            }
            Section("History") {
                ForEach(logs) { log in
                    HStack {
                        Text(log.date)
                        Spacer()
                        Text("\(log.hours ?? 0, specifier: "%.1f")h")
                        if let quality = log.quality {
                            Text("· \(quality)/5").foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Sleep")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        do { logs = try await supabase.fetchSleepLogs(appState: appState) }
        catch { errorMessage = error.localizedDescription }
    }

    private func save() async {
        guard let hoursValue = Double(hours) else { return }
        do {
            try await APIClient(appState: appState).logSleep(date: nil, hours: hoursValue, quality: quality, notes: nil)
            hours = ""
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { SleepView() }.environment(AppState())
}
