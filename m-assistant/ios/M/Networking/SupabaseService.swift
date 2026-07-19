import Foundation
import Supabase

/// Direct Supabase access for plain CRUD (goals, tasks, calendar, rituals,
/// reading, screen time, hiit, sleep/meal/workout lists). Chat, the fast-path
/// log endpoints, goal planning, and news digest go through the Worker
/// instead (see APIClient) so the Anthropic key never reaches the client.
@Observable
final class SupabaseService {
    private var cachedClient: SupabaseClient?
    private var cachedURL: String = ""
    private var cachedKey: String = ""

    func client(appState: AppState) -> SupabaseClient? {
        guard !appState.supabaseURL.isEmpty, !appState.supabaseAnonKey.isEmpty,
              let url = URL(string: appState.supabaseURL) else { return nil }
        if cachedClient == nil || cachedURL != appState.supabaseURL || cachedKey != appState.supabaseAnonKey {
            cachedClient = SupabaseClient(supabaseURL: url, supabaseKey: appState.supabaseAnonKey)
            cachedURL = appState.supabaseURL
            cachedKey = appState.supabaseAnonKey
        }
        return cachedClient
    }

    // MARK: - Goals

    func fetchGoals(appState: AppState) async throws -> [Goal] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("goals").select().order("created_at", ascending: false).execute().value
    }

    func createGoal(_ goal: [String: AnyJSON], appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("goals").insert(goal).execute()
    }

    func updateGoal(id: UUID, fields: [String: AnyJSON], appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("goals").update(fields).eq("id", value: id.uuidString).execute()
    }

    // MARK: - Tasks

    func fetchTasks(goalId: UUID? = nil, appState: AppState) async throws -> [TaskItem] {
        guard let client = client(appState: appState) else { return [] }
        var query = client.from("tasks").select()
        if let goalId {
            query = query.eq("goal_id", value: goalId.uuidString)
        }
        return try await query.order("due_date", ascending: true).execute().value
    }

    func setTaskDone(id: UUID, done: Bool, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("tasks").update(["done": done]).eq("id", value: id.uuidString).execute()
    }

    // MARK: - Calendar

    func fetchCalendarEvents(appState: AppState) async throws -> [CalendarEvent] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("calendar_events").select().order("start_time", ascending: true).execute().value
    }

    // MARK: - Workouts / Meals / Sleep / Screen Time

    func fetchWorkouts(appState: AppState) async throws -> [Workout] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("workouts").select().order("date", ascending: false).execute().value
    }

    /// Direct insert for planning a future workout. Actual same-day completions
    /// should go through APIClient.logWorkout instead, so check_ins stays accurate.
    func planWorkout(date: String, type: String?, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("workouts").insert([
            "date": AnyJSON.string(date),
            "type": type.map(AnyJSON.string) ?? AnyJSON.null,
        ]).execute()
    }

    func fetchMeals(appState: AppState) async throws -> [Meal] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("meals").select().order("date", ascending: false).execute().value
    }

    /// Direct insert for meal planning/prep on a future date. Same-day meal logging
    /// should go through APIClient.logMeal so check_ins stays accurate.
    func planMeal(date: String, mealType: String, description: String, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("meals").insert([
            "date": AnyJSON.string(date),
            "meal_type": AnyJSON.string(mealType),
            "description": AnyJSON.string(description),
        ]).execute()
    }

    func fetchSleepLogs(appState: AppState) async throws -> [SleepLog] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("sleep_logs").select().order("date", ascending: false).execute().value
    }

    func fetchScreenTimeLogs(appState: AppState) async throws -> [ScreenTimeLog] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("screen_time_logs").select().order("date", ascending: false).execute().value
    }

    func logScreenTime(date: String, totalMinutes: Int, topApp: String?, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("screen_time_logs").insert([
            "date": AnyJSON.string(date),
            "total_minutes": AnyJSON.double(Double(totalMinutes)),
            "top_app": topApp.map(AnyJSON.string) ?? AnyJSON.null,
        ]).execute()
    }

    // MARK: - Rituals

    func fetchRituals(appState: AppState) async throws -> [Ritual] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("rituals").select().order("name", ascending: true).execute().value
    }

    func createRitual(name: String, frequency: String, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("rituals").insert(["name": name, "frequency": frequency]).execute()
    }

    func fetchRitualLogs(since: String, appState: AppState) async throws -> [RitualLog] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("ritual_logs").select().gte("due_date", value: since).execute().value
    }

    func completeRitualLog(id: UUID, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("ritual_logs").update([
            "done": AnyJSON.bool(true),
            "completed_at": AnyJSON.string(ISO8601DateFormatter().string(from: Date())),
        ]).eq("id", value: id.uuidString).execute()
    }

    /// Finds this ritual's log row for the given period, creating one if it doesn't exist yet.
    /// There's no server-side scheduler for ritual occurrences, so the client creates them
    /// lazily the first time a period's list is viewed.
    func ensureRitualLog(ritualId: UUID, periodStart: String, dueDate: String, appState: AppState) async throws -> RitualLog {
        guard let client = client(appState: appState) else {
            throw APIError.notConfigured
        }
        let existing: [RitualLog] = try await client.from("ritual_logs").select()
            .eq("ritual_id", value: ritualId.uuidString)
            .eq("period_start", value: periodStart)
            .execute().value
        if let found = existing.first { return found }

        let inserted: [RitualLog] = try await client.from("ritual_logs").insert([
            "ritual_id": AnyJSON.string(ritualId.uuidString),
            "period_start": AnyJSON.string(periodStart),
            "due_date": AnyJSON.string(dueDate),
        ]).select().execute().value
        guard let row = inserted.first else {
            throw APIError.server(500, "Failed to create ritual log")
        }
        return row
    }

    // MARK: - Reading

    func fetchExcerpts(appState: AppState) async throws -> [BookExcerpt] {
        guard let client = client(appState: appState) else { return [] }
        return try await client.from("book_excerpts").select().order("date_added", ascending: false).execute().value
    }

    func saveExcerpt(bookTitle: String?, excerpt: String, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("book_excerpts").insert([
            "book_title": bookTitle.map(AnyJSON.string) ?? AnyJSON.null,
            "excerpt": AnyJSON.string(excerpt),
        ]).execute()
    }

    // MARK: - HIIT

    func logHIITSession(_ session: HIITSession, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        try await client.from("hiit_sessions").insert([
            "date": AnyJSON.string(session.date),
            "interval_work_sec": AnyJSON.double(Double(session.intervalWorkSec)),
            "interval_rest_sec": AnyJSON.double(Double(session.intervalRestSec)),
            "rounds": session.rounds.map { AnyJSON.double(Double($0)) } ?? AnyJSON.null,
        ]).execute()
    }

    // MARK: - Home: quote + phrase + language settings

    func fetchTodayQuote(appState: AppState) async throws -> QuoteHistory? {
        guard let client = client(appState: appState) else { return nil }
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
        let rows: [QuoteHistory] = try await client.from("quotes_history").select().eq("date", value: String(today)).execute().value
        return rows.first
    }

    func fetchTodayPhrase(appState: AppState) async throws -> DailyPhrase? {
        guard let client = client(appState: appState) else { return nil }
        let today = ISO8601DateFormatter().string(from: Date()).prefix(10)
        let rows: [DailyPhrase] = try await client.from("daily_phrases").select().eq("date", value: String(today)).execute().value
        return rows.first
    }

    func fetchLanguageSettings(appState: AppState) async throws -> LanguageSettings? {
        guard let client = client(appState: appState) else { return nil }
        let rows: [LanguageSettings] = try await client.from("language_settings").select().execute().value
        return rows.first
    }

    func setActiveLanguage(_ language: String, appState: AppState) async throws {
        guard let client = client(appState: appState) else { return }
        guard let existing = try await fetchLanguageSettings(appState: appState) else {
            try await client.from("language_settings").insert(["active_language": language]).execute()
            return
        }
        try await client.from("language_settings")
            .update(["active_language": language, "updated_at": ISO8601DateFormatter().string(from: Date())])
            .eq("id", value: existing.id.uuidString)
            .execute()
    }
}
