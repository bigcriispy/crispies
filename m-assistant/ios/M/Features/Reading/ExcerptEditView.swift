import SwiftUI

struct ExcerptEditView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    let viewModel: ExcerptsViewModel

    @State private var bookTitle = ""
    @State private var excerpt = ""

    var body: some View {
        NavigationStack {
            Form {
                TextField("Book title (optional)", text: $bookTitle)
                TextField("Excerpt", text: $excerpt, axis: .vertical)
                    .lineLimit(5...20)
            }
            .navigationTitle("New Excerpt")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await viewModel.save(bookTitle: bookTitle, excerpt: excerpt, appState: appState)
                            dismiss()
                        }
                    }
                    .disabled(excerpt.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
