import SwiftUI

struct ScreenTimeView: View {
    @Environment(AppState.self) private var appState
    @State private var logs: [ScreenTimeLog] = []
    @State private var totalMinutes = ""
    @State private var topApp = ""
    @State private var errorMessage: String?
    private let supabase = SupabaseService()

    var body: some View {
        List {
            Section("Log today") {
                TextField("Total minutes", text: $totalMinutes).keyboardType(.numberPad)
                TextField("Top app (optional)", text: $topApp)
                Button("Save") { Task { await save() } }
                    .disabled(Int(totalMinutes) == nil)
            }
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("History") {
                ForEach(logs) { log in
                    HStack {
                        Text(log.date)
                        Spacer()
                        Text("\(log.totalMinutes ?? 0) min")
                        if let app = log.topApp, !app.isEmpty {
                            Text("· \(app)").foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Screen Time")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        do { logs = try await supabase.fetchScreenTimeLogs(appState: appState) }
        catch { errorMessage = error.localizedDescription }
    }

    private func save() async {
        guard let minutes = Int(totalMinutes) else { return }
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10).description
        do {
            try await supabase.logScreenTime(date: today, totalMinutes: minutes, topApp: topApp.isEmpty ? nil : topApp, appState: appState)
            totalMinutes = ""
            topApp = ""
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { ScreenTimeView() }.environment(AppState())
}
