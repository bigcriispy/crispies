import Foundation

@Observable
final class CalendarViewModel {
    var events: [CalendarEvent] = []
    var errorMessage: String?

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        do {
            events = try await supabase.fetchCalendarEvents(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func events(on day: Date) -> [CalendarEvent] {
        let calendar = Calendar.current
        return events.filter { calendar.isDate($0.startTime, inSameDayAs: day) }
    }

    func daysWithEvents(in month: Date) -> Set<Int> {
        let calendar = Calendar.current
        guard calendar.isDate(month, equalTo: month, toGranularity: .month) else { return [] }
        let daysInMonthEvents = events.filter { calendar.isDate($0.startTime, equalTo: month, toGranularity: .month) }
        return Set(daysInMonthEvents.map { calendar.component(.day, from: $0.startTime) })
    }
}
