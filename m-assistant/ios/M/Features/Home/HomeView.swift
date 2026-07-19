import SwiftUI

struct HomeView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = HomeViewModel()
    @State private var showingCheckIn = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let quote = viewModel.quote?.quote {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("TODAY").font(.caption).foregroundStyle(.secondary)
                            Text(quote).font(.title3).fontWeight(.medium)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if let phrase = viewModel.phrase {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("PHRASE OF THE DAY · \(phrase.language.uppercased())")
                                .font(.caption).foregroundStyle(.secondary)
                            Text(phrase.phraseNative).font(.title2)
                            if let translit = phrase.phraseTransliteration {
                                Text(translit).font(.subheadline).foregroundStyle(.secondary)
                            }
                            Text(phrase.phraseEnglish).font(.body)
                            if let note = phrase.usageNote {
                                Text(note).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if let progress = viewModel.progress {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("LAST 7 DAYS").font(.caption).foregroundStyle(.secondary)
                            Text("\(progress.workoutsLogged) workouts logged")
                            if let avgSleep = progress.avgSleepHours {
                                Text("Avg sleep: \(avgSleep, specifier: "%.1f")h")
                            }
                            Text("Rituals: \(progress.ritualsDone)/\(progress.ritualsDue)")
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color(.secondarySystemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    Button {
                        showingCheckIn = true
                    } label: {
                        Label("Daily Check-In", systemImage: "checkmark.circle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)

                    if let error = viewModel.errorMessage {
                        Text(error).foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .navigationTitle("M")
            .sheet(isPresented: $showingCheckIn) {
                CheckInView().environment(appState)
            }
            .task { await viewModel.load(appState: appState) }
            .refreshable { await viewModel.load(appState: appState) }
        }
    }
}

#Preview {
    HomeView().environment(AppState())
}
