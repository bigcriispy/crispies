import SwiftUI
import Charts

struct RitualStatsView: View {
    let ritual: Ritual
    @Environment(AppState.self) private var appState
    @State private var logs: [RitualLog] = []
    @State private var errorMessage: String?

    private let supabase = SupabaseService()
    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        List {
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            Section("Completion") {
                ForEach([7, 30, 90], id: \.self) { window in
                    HStack {
                        Text("\(window)-day")
                        Spacer()
                        Text(completionText(window: window))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            Section("Streak") {
                Text("\(currentStreak()) in a row")
            }
            Section("Last 30 days") {
                Chart(recentDaily(days: 30)) { point in
                    BarMark(x: .value("Day", point.date, unit: .day), y: .value("Done", point.done ? 1 : 0))
                        .foregroundStyle(point.done ? Color.accentColor : Color.secondary.opacity(0.3))
                }
                .frame(height: 140)
            }
        }
        .navigationTitle(ritual.name)
        .task { await load() }
    }

    private func load() async {
        do {
            let since = Self.dateFormatter.string(from: Calendar.current.date(byAdding: .day, value: -90, to: Date()) ?? Date())
            let all = try await supabase.fetchRitualLogs(since: since, appState: appState)
            logs = all.filter { $0.ritualId == ritual.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func completionText(window: Int) -> String {
        let cutoff = Calendar.current.date(byAdding: .day, value: -window, to: Date()) ?? Date()
        let inWindow = logs.filter { (Self.dateFormatter.date(from: $0.dueDate) ?? .distantPast) >= cutoff }
        guard !inWindow.isEmpty else { return "no data" }
        let done = inWindow.filter { $0.done }.count
        let pct = Int((Double(done) / Double(inWindow.count) * 100).rounded())
        return "\(done)/\(inWindow.count) (\(pct)%)"
    }

    private func currentStreak() -> Int {
        let sorted = logs.sorted { $0.dueDate > $1.dueDate }
        var streak = 0
        for log in sorted {
            if log.done { streak += 1 } else { break }
        }
        return streak
    }

    private struct DailyPoint: Identifiable {
        let date: Date
        let done: Bool
        var id: Date { date }
    }

    private func recentDaily(days: Int) -> [DailyPoint] {
        logs
            .compactMap { log -> DailyPoint? in
                guard let date = Self.dateFormatter.date(from: log.dueDate) else { return nil }
                return DailyPoint(date: date, done: log.done)
            }
            .sorted { $0.date < $1.date }
    }
}
