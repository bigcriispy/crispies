import SwiftUI

struct CalendarView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = CalendarViewModel()
    @State private var selectedDate = Date()
    @State private var mode: Mode = .month

    enum Mode: String, CaseIterable { case month = "Month", week = "Week" }

    var body: some View {
        VStack {
            Picker("Mode", selection: $mode) {
                ForEach(Mode.allCases, id: \.self) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            if mode == .month {
                MonthGridView(selectedDate: $selectedDate, viewModel: viewModel)
            } else {
                WeekStripView(selectedDate: $selectedDate, viewModel: viewModel)
            }

            List(viewModel.events(on: selectedDate)) { event in
                VStack(alignment: .leading) {
                    Text(event.title).font(.headline)
                    Text(event.startTime.formatted(date: .omitted, time: .shortened))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let notes = event.notes {
                        Text(notes).font(.caption)
                    }
                }
            }
            .listStyle(.plain)
        }
        .navigationTitle("Calendar")
        .task { await viewModel.load(appState: appState) }
        .refreshable { await viewModel.load(appState: appState) }
    }
}

private struct MonthGridView: View {
    @Binding var selectedDate: Date
    let viewModel: CalendarViewModel

    private var calendar: Calendar { Calendar.current }
    private var monthDays: [Date] {
        guard let monthInterval = calendar.dateInterval(of: .month, for: selectedDate),
              let firstWeek = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start) else { return [] }
        var days: [Date] = []
        var current = firstWeek.start
        while current < monthInterval.end || days.count % 7 != 0 {
            days.append(current)
            guard let next = calendar.date(byAdding: .day, value: 1, to: current) else { break }
            current = next
            if days.count > 42 { break }
        }
        return days
    }

    private let columns = Array(repeating: GridItem(.flexible()), count: 7)

    var body: some View {
        VStack {
            HStack {
                Button {
                    selectedDate = calendar.date(byAdding: .month, value: -1, to: selectedDate) ?? selectedDate
                } label: { Image(systemName: "chevron.left") }
                Spacer()
                Text(selectedDate.formatted(.dateTime.month(.wide).year()))
                Spacer()
                Button {
                    selectedDate = calendar.date(byAdding: .month, value: 1, to: selectedDate) ?? selectedDate
                } label: { Image(systemName: "chevron.right") }
            }
            .padding(.horizontal)

            LazyVGrid(columns: columns) {
                ForEach(monthDays, id: \.self) { day in
                    let dayNumber = calendar.component(.day, from: day)
                    let hasEvents = !viewModel.events(on: day).isEmpty
                    let inMonth = calendar.isDate(day, equalTo: selectedDate, toGranularity: .month)
                    Button {
                        selectedDate = day
                    } label: {
                        VStack(spacing: 2) {
                            Text("\(dayNumber)")
                                .foregroundStyle(inMonth ? .primary : .secondary)
                                .frame(maxWidth: .infinity)
                            Circle().fill(hasEvents ? Color.accentColor : .clear).frame(width: 4, height: 4)
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

private struct WeekStripView: View {
    @Binding var selectedDate: Date
    let viewModel: CalendarViewModel

    private var calendar: Calendar { Calendar.current }
    private var weekDays: [Date] {
        guard let interval = calendar.dateInterval(of: .weekOfYear, for: selectedDate) else { return [] }
        return (0..<7).compactMap { calendar.date(byAdding: .day, value: $0, to: interval.start) }
    }

    var body: some View {
        HStack {
            ForEach(weekDays, id: \.self) { day in
                let hasEvents = !viewModel.events(on: day).isEmpty
                Button {
                    selectedDate = day
                } label: {
                    VStack {
                        Text(day.formatted(.dateTime.weekday(.abbreviated)))
                            .font(.caption2)
                        Text("\(calendar.component(.day, from: day))")
                            .fontWeight(calendar.isDate(day, inSameDayAs: selectedDate) ? .bold : .regular)
                        Circle().fill(hasEvents ? Color.accentColor : .clear).frame(width: 4, height: 4)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding()
    }
}

#Preview {
    NavigationStack { CalendarView() }.environment(AppState())
}
