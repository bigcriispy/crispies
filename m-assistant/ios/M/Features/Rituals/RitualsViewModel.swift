import Foundation

struct DueRitual: Identifiable {
    let ritual: Ritual
    var log: RitualLog

    var id: UUID { log.id }
}

@Observable
final class RitualsViewModel {
    var dueRituals: [DueRitual] = []
    var isLoading = false
    var errorMessage: String?
    var newRitualName = ""
    var newRitualFrequency = "daily"

    private let supabase = SupabaseService()
    private static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.calendar = Calendar(identifier: .gregorian)
        f.timeZone = TimeZone.current
        return f
    }()

    func load(appState: AppState) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let rituals = try await supabase.fetchRituals(appState: appState).filter { $0.active }
            var due: [DueRitual] = []
            for ritual in rituals {
                let (periodStart, dueDate) = Self.period(for: ritual.frequency, today: Date())
                let log = try await supabase.ensureRitualLog(
                    ritualId: ritual.id, periodStart: periodStart, dueDate: dueDate, appState: appState
                )
                due.append(DueRitual(ritual: ritual, log: log))
            }
            dueRituals = due
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggle(_ item: DueRitual, appState: AppState) async {
        guard !item.log.done else { return }
        do {
            try await supabase.completeRitualLog(id: item.log.id, appState: appState)
            if let index = dueRituals.firstIndex(where: { $0.id == item.id }) {
                dueRituals[index].log.done = true
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func addRitual(appState: AppState) async {
        let name = newRitualName.trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty else { return }
        do {
            try await supabase.createRitual(name: name, frequency: newRitualFrequency, appState: appState)
            newRitualName = ""
            await load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Computes the (period_start, due_date) window for a ritual's current occurrence.
    static func period(for frequency: String, today: Date) -> (String, String) {
        let calendar = Calendar(identifier: .gregorian)
        switch frequency {
        case "weekly":
            let weekInterval = calendar.dateInterval(of: .weekOfYear, for: today) ?? DateInterval(start: today, end: today)
            let end = calendar.date(byAdding: .day, value: -1, to: weekInterval.end) ?? today
            return (dateFormatter.string(from: weekInterval.start), dateFormatter.string(from: end))
        case "monthly":
            let monthInterval = calendar.dateInterval(of: .month, for: today) ?? DateInterval(start: today, end: today)
            let end = calendar.date(byAdding: .day, value: -1, to: monthInterval.end) ?? today
            return (dateFormatter.string(from: monthInterval.start), dateFormatter.string(from: end))
        default: // daily
            let day = dateFormatter.string(from: today)
            return (day, day)
        }
    }
}
