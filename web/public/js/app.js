async function update() {
  const res = await fetch("/api/data");
  const d = await res.json();
  people.innerText = d.people;
  tables.innerText = d.tables;
  food.innerText = d.food;
  occupancy.innerText = d.occupancy + "%";
  bar.style.width = d.occupancy + "%";
}

async function analyze() {
  result.innerText = "AI analyzing...";
  const res = await fetch("/api/analyze");
  const d = await res.json();
  result.innerText = d.analysis || "AI error";
}

setInterval(update, 1000);
update();
