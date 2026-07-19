import SwiftUI

struct NewsDigestView: View {
    @Environment(AppState.self) private var appState
    @State private var digest: NewsDigest?
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        List {
            if isLoading {
                ProgressView()
            }
            if let error = errorMessage {
                Text(error).foregroundStyle(.red)
            }
            if let digest {
                section("World News", digest.worldNews)
                section("US News", digest.usNews)
                section("US Politics", digest.usPolitics)
                section("Stock Market", digest.stockMarket)
            }
        }
        .navigationTitle("Daily Digest")
        .task { await load() }
        .refreshable { await load() }
    }

    @ViewBuilder
    private func section(_ title: String, _ content: String?) -> some View {
        if let content, !content.isEmpty {
            Section(title) {
                Text(content)
            }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            digest = try await APIClient(appState: appState).getNewsDigest()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack { NewsDigestView() }.environment(AppState())
}
