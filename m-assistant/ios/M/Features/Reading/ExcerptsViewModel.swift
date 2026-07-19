import Foundation

@Observable
final class ExcerptsViewModel {
    var excerpts: [BookExcerpt] = []
    var errorMessage: String?

    private let supabase = SupabaseService()

    func load(appState: AppState) async {
        do {
            excerpts = try await supabase.fetchExcerpts(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func save(bookTitle: String, excerpt: String, appState: AppState) async {
        guard !excerpt.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        do {
            try await supabase.saveExcerpt(bookTitle: bookTitle.isEmpty ? nil : bookTitle, excerpt: excerpt, appState: appState)
            await load(appState: appState)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
