import Foundation

enum HIITPhase: String {
    case idle = "Ready"
    case work = "Work"
    case rest = "Rest"
    case done = "Done"
}

@Observable
final class HIITTimerEngine {
    var workSeconds: Int = 20
    var restSeconds: Int = 20
    var totalRounds: Int = 8

    var phase: HIITPhase = .idle
    var secondsRemaining: Int = 0
    var currentRound: Int = 0
    var isRunning: Bool = false

    private var tickTask: Task<Void, Never>?

    func start() {
        guard phase == .idle || phase == .done else { resume(); return }
        currentRound = 1
        phase = .work
        secondsRemaining = workSeconds
        isRunning = true
        runLoop()
    }

    func resume() {
        guard !isRunning, phase != .idle, phase != .done else { return }
        isRunning = true
        runLoop()
    }

    func pause() {
        isRunning = false
        tickTask?.cancel()
    }

    func reset() {
        pause()
        phase = .idle
        secondsRemaining = 0
        currentRound = 0
    }

    private func runLoop() {
        tickTask?.cancel()
        tickTask = Task { [weak self] in
            while let self, self.isRunning {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                guard !Task.isCancelled else { return }
                await MainActor.run { self.tick() }
            }
        }
    }

    private func tick() {
        guard secondsRemaining > 0 else { advancePhase(); return }
        secondsRemaining -= 1
        if secondsRemaining == 0 {
            advancePhase()
        }
    }

    private func advancePhase() {
        switch phase {
        case .work:
            if currentRound >= totalRounds {
                finish()
            } else {
                phase = .rest
                secondsRemaining = restSeconds
            }
        case .rest:
            currentRound += 1
            phase = .work
            secondsRemaining = workSeconds
        case .idle, .done:
            break
        }
    }

    private func finish() {
        phase = .done
        isRunning = false
        tickTask?.cancel()
    }
}
