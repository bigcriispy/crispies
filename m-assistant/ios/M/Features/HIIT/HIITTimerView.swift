import SwiftUI

struct HIITTimerView: View {
    @Environment(AppState.self) private var appState
    @State private var engine = HIITTimerEngine()
    @State private var notes = ""
    @State private var didLog = false
    private let supabase = SupabaseService()

    var body: some View {
        VStack(spacing: 24) {
            Text(engine.phase.rawValue)
                .font(.title)
                .foregroundStyle(phaseColor)

            Text("\(engine.secondsRemaining)")
                .font(.system(size: 96, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(phaseColor)

            Text("Round \(min(engine.currentRound, engine.totalRounds)) of \(engine.totalRounds)")
                .foregroundStyle(.secondary)

            HStack(spacing: 20) {
                Button(engine.isRunning ? "Pause" : (engine.phase == .idle || engine.phase == .done ? "Start" : "Resume")) {
                    engine.isRunning ? engine.pause() : engine.start()
                }
                .buttonStyle(.borderedProminent)

                Button("Reset") { engine.reset(); didLog = false }
                    .buttonStyle(.bordered)
            }

            if engine.phase == .idle {
                configSection
            }

            if engine.phase == .done && !didLog {
                Section {
                    TextField("Notes (optional)", text: $notes)
                        .textFieldStyle(.roundedBorder)
                        .padding(.horizontal)
                    Button("Log session") {
                        Task { await logSession() }
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
            if didLog {
                Text("Session logged.").foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding()
        .navigationTitle("HIIT")
    }

    private var phaseColor: Color {
        switch engine.phase {
        case .work: return .red
        case .rest: return .blue
        case .done: return .green
        case .idle: return .primary
        }
    }

    private var configSection: some View {
        VStack {
            Stepper("Work: \(engine.workSeconds)s", value: $engine.workSeconds, in: 5...120, step: 5)
            Stepper("Rest: \(engine.restSeconds)s", value: $engine.restSeconds, in: 5...120, step: 5)
            Stepper("Rounds: \(engine.totalRounds)", value: $engine.totalRounds, in: 1...30)
        }
        .padding(.horizontal)
    }

    private func logSession() async {
        let session = HIITSession(
            id: UUID(),
            date: ISO8601DateFormatter().string(from: Date()).prefix(10).description,
            intervalWorkSec: engine.workSeconds,
            intervalRestSec: engine.restSeconds,
            rounds: engine.totalRounds,
            notes: notes.isEmpty ? nil : notes
        )
        try? await supabase.logHIITSession(session, appState: appState)
        didLog = true
    }
}

#Preview {
    NavigationStack { HIITTimerView() }.environment(AppState())
}
