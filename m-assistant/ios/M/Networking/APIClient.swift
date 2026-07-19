import Foundation

/// Talks to the Cloudflare Worker for the 7 backend endpoints: AI reasoning
/// (chat, goal planning), the fast-path log endpoints, and read-only
/// aggregation/passthrough (progress, news digest).
struct APIClient {
    let appState: AppState

    private var baseURL: URL? { URL(string: appState.backendBaseURL) }

    private func post(_ path: String, body: [String: Any]) async throws -> Data {
        guard let base = baseURL else { throw APIError.notConfigured }
        var request = URLRequest(url: base.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)
        try Self.checkStatus(response, data: data)
        return data
    }

    private func get(_ path: String, query: [String: String] = [:]) async throws -> Data {
        guard let base = baseURL else { throw APIError.notConfigured }
        var components = URLComponents(url: base.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        let (data, response) = try await URLSession.shared.data(from: components.url!)
        try Self.checkStatus(response, data: data)
        return data
    }

    private static func checkStatus(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw APIError.server(http.statusCode, message ?? "Request failed")
        }
    }

    // MARK: - Chat

    func sendChat(message: String, mode: String = "default") async throws -> String {
        let data = try await post("chat", body: ["message": message, "mode": mode])
        let decoded = try JSONDecoder().decode(ChatReply.self, from: data)
        return decoded.reply
    }

    // MARK: - Fast-path logging

    func logSleep(date: String?, hours: Double, quality: Int?, notes: String?) async throws {
        var body: [String: Any] = ["hours": hours]
        if let date { body["date"] = date }
        if let quality { body["quality"] = quality }
        if let notes { body["notes"] = notes }
        _ = try await post("log-sleep", body: body)
    }

    func logMeal(date: String?, mealType: String, description: String) async throws {
        var body: [String: Any] = ["meal_type": mealType, "description": description]
        if let date { body["date"] = date }
        _ = try await post("log-meal", body: body)
    }

    func logWorkout(date: String?, type: String?, durationMinutes: Int?, intensity: Int?, notes: String?) async throws {
        var body: [String: Any] = [:]
        if let date { body["date"] = date }
        if let type { body["type"] = type }
        if let durationMinutes { body["duration_minutes"] = durationMinutes }
        if let intensity { body["intensity"] = intensity }
        if let notes { body["notes"] = notes }
        _ = try await post("log-workout", body: body)
    }

    // MARK: - Goal planning

    func createGoal(title: String) async throws -> GoalPlanResponse {
        let data = try await post("create-goal", body: ["title": title])
        return try JSONDecoder().decode(GoalPlanResponse.self, from: data)
    }

    // MARK: - Progress

    func getProgress(days: Int = 7) async throws -> ProgressSummary {
        let data = try await get("get-progress", query: ["days": String(days)])
        return try JSONDecoder().decode(ProgressSummary.self, from: data)
    }

    // MARK: - News digest

    func getNewsDigest(date: String? = nil) async throws -> NewsDigest {
        var query: [String: String] = [:]
        if let date { query["date"] = date }
        let data = try await get("get-news-digest", query: query)
        let wrapper = try JSONDecoder().decode(NewsDigestResponse.self, from: data)
        return wrapper.digest
    }
}

enum APIError: LocalizedError {
    case notConfigured
    case server(Int, String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Backend URL not configured. Set it in Settings."
        case .server(let code, let message):
            return "\(message) (\(code))"
        }
    }
}

private struct ChatReply: Codable {
    let reply: String
}

private struct NewsDigestResponse: Codable {
    let digest: NewsDigest
}

struct GoalPlanResponse: Codable {
    let goal: Goal
    let tasks: [TaskItem]
    let calendarEvents: [CalendarEvent]

    enum CodingKeys: String, CodingKey {
        case goal, tasks
        case calendarEvents = "calendar_events"
    }
}

struct ProgressSummary: Codable {
    let periodDays: Int
    let workoutsLogged: Int
    let avgSleepHours: Double?
    let ritualsDue: Int
    let ritualsDone: Int

    enum CodingKeys: String, CodingKey {
        case periodDays = "period_days"
        case workoutsLogged = "workouts_logged"
        case avgSleepHours = "avg_sleep_hours"
        case ritualsDue = "rituals_due"
        case ritualsDone = "rituals_done"
    }
}
