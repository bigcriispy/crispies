import Foundation

@Observable
final class HomeViewModel {
    var quote: QuoteHistory?
    var phrase: DailyPhrase?
    var progress: ProgressSummary?
    var errorMessage: String?
    var isLoading = false

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        isLoading = true
        defer { isLoading = false }
        async let quoteResult = try? supabase.fetchTodayQuote(appState: appState)
        async let phraseResult = try? supabase.fetchTodayPhrase(appState: appState)
        async let progressResult = try? APIClient(appState: appState).getProgress(days: 7)

        quote = await quoteResult ?? nil
        phrase = await phraseResult ?? nil
        progress = await progressResult ?? nil
    }
}
