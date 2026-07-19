import Foundation

@Observable
final class ChatViewModel {
    var messages: [ChatMessage] = []
    var draft: String = ""
    var isSending = false
    var errorMessage: String?

    func send(appState: AppState) async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        messages.append(ChatMessage(role: "user", content: text))
        isSending = true
        errorMessage = nil
        defer { isSending = false }
        do {
            let reply = try await APIClient(appState: appState).sendChat(message: text)
            messages.append(ChatMessage(role: "assistant", content: reply))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
