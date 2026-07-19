import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house") }

            ChatView()
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }

            PlanTabView()
                .tabItem { Label("Plan", systemImage: "target") }

            TrackTabView()
                .tabItem { Label("Track", systemImage: "chart.bar") }

            RitualsListView()
                .tabItem { Label("Rituals", systemImage: "repeat") }

            MoreTabView()
                .tabItem { Label("More", systemImage: "ellipsis.circle") }
        }
    }
}

private struct PlanTabView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Goals") { GoalsListView() }
                NavigationLink("Tasks") { TasksListView() }
                NavigationLink("Calendar") { CalendarView() }
            }
            .navigationTitle("Plan")
        }
    }
}

private struct TrackTabView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Workouts") { WorkoutTrackerView() }
                NavigationLink("Plan Workouts") { WorkoutPlannerView() }
                NavigationLink("Meals") { MealTrackerView() }
                NavigationLink("Plan Meals") { MealPlannerView() }
                NavigationLink("Sleep") { SleepView() }
                NavigationLink("Screen Time") { ScreenTimeView() }
            }
            .navigationTitle("Track")
        }
    }
}

private struct MoreTabView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("HIIT Timer") { HIITTimerView() }
                NavigationLink("Daily Digest") { NewsDigestView() }
                NavigationLink("Reading") { ExcerptsView() }
                NavigationLink("Settings") { SettingsView() }
            }
            .navigationTitle("More")
        }
    }
}

#Preview {
    RootTabView().environment(AppState())
}
