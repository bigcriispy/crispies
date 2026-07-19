import SwiftUI

struct ChatView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = ChatViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.messages) { message in
                                bubble(for: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: viewModel.messages.count) {
                        if let last = viewModel.messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                if let error = viewModel.errorMessage {
                    Text(error).font(.footnote).foregroundStyle(.red).padding(.horizontal)
                }

                HStack {
                    TextField("Message M", text: $viewModel.draft, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                    Button {
                        Task { await viewModel.send(appState: appState) }
                    } label: {
                        Image(systemName: "arrow.up.circle.fill").font(.title2)
                    }
                    .disabled(viewModel.isSending || viewModel.draft.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding()
            }
            .navigationTitle("M")
        }
    }

    @ViewBuilder
    private func bubble(for message: ChatMessage) -> some View {
        let isUser = message.role == "user"
        HStack {
            if isUser { Spacer(minLength: 40) }
            Text(message.content)
                .padding(10)
                .background(isUser ? Color.accentColor.opacity(0.2) : Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            if !isUser { Spacer(minLength: 40) }
        }
    }
}

#Preview {
    ChatView().environment(AppState())
}
