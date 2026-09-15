const OFFICE = "office@readywellpsych.com";
const SCALE = {
  0: "Not at all",
  1: "Several days",
  2: "More than half the days",
  3: "Nearly every day"
};
const ITEMS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];
const DIFF = {
  0: "Not difficult at all",
  1: "Somewhat difficult",
  2: "Very difficult",
  3: "Extremely difficult"
};

const partA = document.getElementById("partA");
ITEMS.forEach((text, i) => {
  const n = i + 1;
  const code = String(n).padStart(2, "0");
  partA.insertAdjacentHTML("beforeend", `
    <div class="item">
      <p><span class="code">${code}.</span> ${text}</p>
      <div class="scale four">
        ${[0,1,2,3].map(v => `<label><input type="radio" name="I${n}" value="${v}" required> ${v}<small>${SCALE[v]}</small></label>`).join("")}
      </div>
    </div>`);
});

const diffScale = document.getElementById("diffScale");
diffScale.innerHTML = [0,1,2,3].map(v =>
  `<label><input type="radio" name="DIFF" value="${v}"> ${v}<small>${DIFF[v]}</small></label>`
).join("");

document.getElementById("date").valueAsDate = new Date();

function clearDifficulty() {
  document.querySelectorAll('input[name="DIFF"]').forEach((el) => {
    el.checked = false;
    el.removeAttribute("required");
    el.required = false;
  });
}
clearDifficulty();
window.addEventListener("pageshow", clearDifficulty);

function val(name) {
  const el = document.querySelector(`[name="${name}"]:checked`);
  return el ? el.value : null;
}
function num(name) {
  const v = val(name);
  return v === null ? null : Number(v);
}
function bandFor(total) {
  if (total >= 15) return "15–21. Severe.";
  if (total >= 10) return "10–14. Moderate.";
  if (total >= 5) return "5–9. Mild.";
  return "0–4. Minimal.";
}
function bandClass(total) {
  if (total >= 15) return "pos";
  if (total >= 10) return "flag";
  if (total >= 5) return "flag";
  return "neg";
}

function score(opts) {
  opts = opts || {};
  const send = !!opts.send;
  const initialsCheck = document.getElementById("name").value.trim();
  if (!initialsCheck) {
    alert("Please enter initials.");
    document.getElementById("name").focus();
    return;
  }
  const ratings = ITEMS.map((_, i) => num("I" + (i + 1)));
  if (ratings.some(v => v === null)) {
    alert("Please answer every item (0–3).");
    return;
  }
  const difficulty = num("DIFF");
  const diffLabel = difficulty === null ? "n/a" : DIFF[difficulty];
  const total = ratings.reduce((s, n) => s + n, 0);
  const name = document.getElementById("name").value.trim();
  const date = document.getElementById("date").value || "";
  const visit = document.getElementById("visit").value || "not given";
  const age = document.getElementById("age").value || "n/a";
  const band = bandFor(total);

  let html = `
    <div class="score-row"><span>Initials</span><strong>${name}</strong></div>
    <div class="score-row"><span>Completed</span><strong>${date || "not dated"}</strong></div>
    <div class="score-row"><span>Age</span><strong>${age}</strong></div>
    <div class="score-row"><span>Next visit</span><strong>${visit}</strong></div>
    <div class="score-row"><span>Total (0–21)</span><strong>${total} / 21</strong></div>
    <div class="score-row"><span>Band</span><strong><span class="pill ${bandClass(total)}">${band}</span></strong></div>
    <div class="score-row"><span>Difficulty</span><strong>${diffLabel}</strong></div>
  `;
  document.getElementById("resultBody").innerHTML = html;

  const itemHtml = ITEMS.map((stem, i) => {
    const n = ratings[i];
    const code = String(i + 1).padStart(2, "0");
    return `<div class="item"><p><span class="code">${code}.</span> ${stem}</p><p class="ans">Answer: ${n} · ${SCALE[n]}</p></div>`;
  }).join("") + `<div class="item"><p><span class="code">08.</span> Difficulty</p><p class="ans">Answer: ${diffLabel}</p></div>`;
  document.getElementById("itemList").innerHTML = "<p class=\"hint\">Every item and the rating selected</p>" + itemHtml;

  const lines = [
    "GAD-7",
    "Initials: " + name,
    "Completed: " + (date || "n/a"),
    "Age: " + age,
    "Next visit: " + visit,
    "Score: " + total + " / 21",
    "Band: " + band,
    "Difficulty: " + diffLabel,
    "",
    "Item, rating, label"
  ];
  ITEMS.forEach((stem, i) => {
    const n = ratings[i];
    lines.push("");
    lines.push((i + 1) + ". " + stem);
    lines.push("Answer: " + n + "  " + SCALE[n]);
  });
  lines.push("");
  lines.push("8. If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?");
  lines.push("Answer: " + diffLabel);
  window._ocsSummary = lines.join("\n");
  window._meta = { name, date, visit, age, total, band, difficulty, diffLabel };
  const box = document.getElementById("summaryBox");
  if (box) box.value = window._ocsSummary;
  document.getElementById("results").classList.add("show");
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  if (send) sendOffice(true);
  return true;
}

function sendOffice(force) {
  if (!window._ocsSummary) return;
  if (window._sentOffice && !force) return;
  const m = window._meta || {};
  const subject = "FOR REVIEW : GAD-7 screener";
  fetch("https://formsubmit.co/ajax/" + OFFICE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      _subject: subject,
      _template: "box",
      _captcha: "false",
      initials: m.name || "",
      date: m.date || "",
      age: m.age || "",
      visit: m.visit || "",
      score: (m.total != null ? m.total + " / 21" : ""),
      band: m.band || "",
      difficulty: m.diffLabel || "n/a",
      message: window._ocsSummary
    })
  }).then(r => r.json()).then(d => {
    window._sentOffice = true;
    const status = document.getElementById("copyStatus");
    if (d && d.success) status.textContent = "Office copy sent. Gmail draft should also be open.";
    else status.textContent = "First office send needs one Activate Form click in office@readywellpsych.com. Then Score and Send again. Copy is the backup.";
  }).catch(() => {
    const status = document.getElementById("copyStatus");
    status.textContent = "Office send did not go through. Use the copied summary in the Gmail draft.";
  });
}

function copySummary() {
  if (!score({ send: false })) return false;
  const box = document.getElementById("summaryBox");
  const status = document.getElementById("copyStatus");
  box.value = window._ocsSummary;
  box.focus();
  box.select();
  box.setSelectionRange(0, box.value.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  if (!ok && navigator.clipboard) {
    navigator.clipboard.writeText(window._ocsSummary).then(() => {
      status.textContent = "Summary copied.";
    }).catch(() => {
      status.textContent = "Select the box and copy (Ctrl+C or Cmd+C).";
    });
    return true;
  }
  status.textContent = ok ? "Summary copied." : "Select the box and copy (Ctrl+C or Cmd+C).";
  return ok;
}

function openGmail() {
  if (!window._ocsSummary) return;
  const subject = "FOR REVIEW : GAD-7 screener";
  let body = window._ocsSummary;
  if (body.length > 1500) {
    body = body.slice(0, 1500) + "\n\n[Gmail cut the rest. Paste the copied summary.]";
  }
  const gmail = "https://mail.google.com/mail/?view=cm&fs=1&tf=1"
    + "&to=" + encodeURIComponent(OFFICE)
    + "&su=" + encodeURIComponent(subject)
    + "&body=" + encodeURIComponent(body);
  const a = document.createElement("a");
  a.href = gmail;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function scoreAndSend() {
  if (!score({ send: true })) return;
  openGmail();
}

document.getElementById("scoreBtn").onclick = scoreAndSend;
document.getElementById("copyBtn").onclick = copySummary;
document.getElementById("printBtn").onclick = () => {
  if (!score({ send: false })) return;
  window.print();
};
