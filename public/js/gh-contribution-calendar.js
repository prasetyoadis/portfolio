fetch('./public/contributions.json')
    .then(res => res.json())
    .then(data => {
    const weeks = data.weeks;
    const total = data.totalContributions;
    const grid = document.getElementById("grid");
    const months = document.getElementById("months");
    const totalDisplay = document.getElementById("total");

    totalDisplay.textContent = `${total} contributions in the last year`;

    let lastMonth = null;

    weeks.forEach((week, weekIndex) => {
        week.contributionDays.forEach((day) => {
        const div = document.createElement("div");
        div.className = "w-3 h-3 rounded-sm";
        div.title = `${day.date}: ${day.contributionCount} contributions`;
        div.style.backgroundColor = day.color || "#161b22";
        grid.appendChild(div);
        });

        const firstDay = new Date(week.contributionDays[0].date);
        const currentMonth = firstDay.getMonth();

        if (currentMonth !== lastMonth) {
            const label = document.createElement("div");
            label.className = "font-semibold text-xs text-light w-[12px] text-left";
            label.style.marginLeft = weekIndex === 0 ? "0" : "2px";
            label.textContent = firstDay.toLocaleString('default', { month: 'short' });
            months.appendChild(label);
            lastMonth = currentMonth;
        } else {
            const spacer = document.createElement("div");
            spacer.className = "w-[12px]";
            months.appendChild(spacer);
        }
    });
});