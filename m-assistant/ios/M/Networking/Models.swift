import Foundation

struct Goal: Codable, Identifiable, Hashable {
    let id: UUID
    var title: String
    var description: String?
    var targetDate: String?
    var status: String
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, title, description, status
        case targetDate = "target_date"
        case createdAt = "created_at"
    }
}

struct TaskItem: Codable, Identifiable, Hashable {
    let id: UUID
    var goalId: UUID?
    var title: String
    var dueDate: String?
    var done: Bool
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, title, done
        case goalId = "goal_id"
        case dueDate = "due_date"
        case createdAt = "created_at"
    }
}

struct CalendarEvent: Codable, Identifiable, Hashable {
    let id: UUID
    var goalId: UUID?
    var title: String
    var startTime: Date
    var endTime: Date?
    var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, title, notes
        case goalId = "goal_id"
        case startTime = "start_time"
        case endTime = "end_time"
    }
}

struct Workout: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var type: String?
    var durationMinutes: Int?
    var intensity: Int?
    var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, date, type, notes
        case durationMinutes = "duration_minutes"
        case intensity
    }
}

struct Meal: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var mealType: String
    var description: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, date, description
        case mealType = "meal_type"
        case createdAt = "created_at"
    }
}

struct SleepLog: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var hours: Double?
    var quality: Int?
    var notes: String?
}

struct ScreenTimeLog: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var totalMinutes: Int?
    var topApp: String?

    enum CodingKeys: String, CodingKey {
        case id, date
        case totalMinutes = "total_minutes"
        case topApp = "top_app"
    }
}

struct Ritual: Codable, Identifiable, Hashable {
    let id: UUID
    var name: String
    var frequency: String
    var active: Bool
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, name, frequency, active
        case createdAt = "created_at"
    }
}

struct RitualLog: Codable, Identifiable, Hashable {
    let id: UUID
    var ritualId: UUID
    var periodStart: String
    var dueDate: String
    var done: Bool
    var completedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, done
        case ritualId = "ritual_id"
        case periodStart = "period_start"
        case dueDate = "due_date"
        case completedAt = "completed_at"
    }
}

struct BookExcerpt: Codable, Identifiable, Hashable {
    let id: UUID
    var bookTitle: String?
    var excerpt: String
    var dateAdded: Date?

    enum CodingKeys: String, CodingKey {
        case id, excerpt
        case bookTitle = "book_title"
        case dateAdded = "date_added"
    }
}

struct QuoteHistory: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var quote: String?
}

struct CheckIn: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var sleepLogged: Bool
    var mealLogged: Bool
    var workoutLogged: Bool

    enum CodingKeys: String, CodingKey {
        case id, date
        case sleepLogged = "sleep_logged"
        case mealLogged = "meal_logged"
        case workoutLogged = "workout_logged"
    }
}

struct HIITSession: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var intervalWorkSec: Int
    var intervalRestSec: Int
    var rounds: Int?
    var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, date, rounds, notes
        case intervalWorkSec = "interval_work_sec"
        case intervalRestSec = "interval_rest_sec"
    }
}

struct NewsDigest: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var worldNews: String?
    var usNews: String?
    var usPolitics: String?
    var stockMarket: String?

    enum CodingKeys: String, CodingKey {
        case id, date
        case worldNews = "world_news"
        case usNews = "us_news"
        case usPolitics = "us_politics"
        case stockMarket = "stock_market"
    }
}

struct LanguageSettings: Codable, Identifiable, Hashable {
    let id: UUID
    var activeLanguage: String

    enum CodingKeys: String, CodingKey {
        case id
        case activeLanguage = "active_language"
    }
}

struct DailyPhrase: Codable, Identifiable, Hashable {
    let id: UUID
    var date: String
    var language: String
    var phraseNative: String
    var phraseTransliteration: String?
    var phraseEnglish: String
    var usageNote: String?

    enum CodingKeys: String, CodingKey {
        case id, date, language
        case phraseNative = "phrase_native"
        case phraseTransliteration = "phrase_transliteration"
        case phraseEnglish = "phrase_english"
        case usageNote = "usage_note"
    }
}

struct ChatMessage: Codable, Identifiable, Hashable {
    var id: UUID = UUID()
    var role: String
    var content: String
}
