import SwiftUI

struct ExcerptsView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = ExcerptsViewModel()
    @State private var showingAdd = false

    var body: some View {
        List {
            if let error = viewModel.errorMessage {
                Text(error).foregroundStyle(.red)
            }
            ForEach(viewModel.excerpts) { excerpt in
                VStack(alignment: .leading, spacing: 4) {
                    if let title = excerpt.bookTitle, !title.isEmpty {
                        Text(title).font(.headline)
                    }
                    Text(excerpt.excerpt)
                }
            }
        }
        .navigationTitle("Reading")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showingAdd = true } label: { Image(systemName: "plus") }
            }
        }
        .sheet(isPresented: $showingAdd) {
            ExcerptEditView(viewModel: viewModel)
                .environment(appState)
        }
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }
}

#Preview {
    NavigationStack { ExcerptsView() }.environment(AppState())
}
