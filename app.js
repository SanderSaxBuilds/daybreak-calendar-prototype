const initialEvents = [
  { id: 1, title: "Morning review", start: "08:15", duration: 35, calendar: "personal", protected: false },
  { id: 2, title: "Product direction", start: "09:10", duration: 45, calendar: "work", protected: false },
  { id: 3, title: "Deep focus: prototype", start: "10:05", duration: 90, calendar: "work", protected: true },
  { id: 4, title: "Lunch with Mia", start: "12:00", duration: 45, calendar: "family", protected: false },
  { id: 5, title: "Walking reset", start: "13:00", duration: 30, calendar: "personal", protected: false }
]

let events = [...initialEvents]
let selectedDate = new Date(2026, 8, 22)
let timerSeconds = 50 * 60
let timerId = null
let breathingId = null

const eventLayer = document.querySelector("#eventLayer")
const dateLabel = document.querySelector("#dateLabel")
const weekdayLabel = document.querySelector("#weekdayLabel")
const modal = document.querySelector("#eventModal")
const eventForm = document.querySelector("#eventForm")
const toast = document.querySelector("#toast")
const focusTime = document.querySelector("#focusTime")
const focusStart = document.querySelector("#focusStart")
const breathingPrompt = document.querySelector("#breathingPrompt")
const breathingOrb = document.querySelector("#breathingOrb")

function minutesFromStart(time) {
  const [hours, minutes] = time.split(":").map(Number)
  return (hours - 8) * 60 + minutes
}

function formatTime(time) {
  const [hour, minute] = time.split(":").map(Number)
  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`
}

function renderEvents() {
  const activeCalendars = [...document.querySelectorAll("[data-calendar]:checked")].map(input => input.dataset.calendar)
  eventLayer.innerHTML = ""
  events
    .filter(event => activeCalendars.includes(event.calendar))
    .sort((a, b) => a.start.localeCompare(b.start))
    .forEach(event => {
      const top = Math.max(0, minutesFromStart(event.start) / 360 * 100)
      const height = Math.max(7, event.duration / 360 * 100)
      const card = document.createElement("button")
      card.className = `event-card ${event.calendar}`
      card.style.top = `${top}%`
      card.style.height = `${height}%`
      card.dataset.id = event.id
      card.setAttribute("aria-label", `${event.title}, ${formatTime(event.start)}, ${event.duration} minutes`)
      card.innerHTML = `
        <strong>${escapeHtml(event.title)}</strong>
        <span>${formatTime(event.start)} · ${event.duration} min</span>
        ${event.protected ? '<svg class="protected" viewBox="0 0 24 24" aria-label="Protected time"><path d="M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z"/></svg>' : ""}
      `
      card.addEventListener("click", () => showToast(`${event.title} is ready to edit`))
      eventLayer.append(card)
    })
}

function escapeHtml(value) {
  const element = document.createElement("div")
  element.textContent = value
  return element.innerHTML
}

function updateDate() {
  weekdayLabel.textContent = selectedDate.toLocaleDateString("en-US", { weekday: "long" })
  dateLabel.textContent = selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })
}

function showToast(message) {
  toast.textContent = message
  toast.classList.add("is-visible")
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => toast.classList.remove("is-visible"), 2600)
}

function openModal() {
  modal.hidden = false
  document.body.style.overflow = "hidden"
  setTimeout(() => document.querySelector("#eventTitle").focus(), 0)
}

function closeModal() {
  modal.hidden = true
  document.body.style.overflow = ""
  document.querySelector("#addEventButton").focus()
}

document.querySelector("#addEventButton").addEventListener("click", openModal)
document.querySelector("#modalClose").addEventListener("click", closeModal)
modal.addEventListener("click", event => { if (event.target === modal) closeModal() })
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modal.hidden) closeModal() })

eventForm.addEventListener("submit", event => {
  event.preventDefault()
  const title = document.querySelector("#eventTitle").value.trim()
  const start = document.querySelector("#eventTime").value
  const duration = Number(document.querySelector("#eventDuration").value)
  const calendar = document.querySelector("[name=eventCalendar]:checked").value
  const protectedTime = document.querySelector("#focusProtect").checked
  events.push({ id: Date.now(), title, start, duration, calendar, protected: protectedTime })
  renderEvents()
  eventForm.reset()
  document.querySelector("#eventTime").value = "13:15"
  document.querySelector("#eventDuration").value = "60"
  closeModal()
  showToast("Time block added to your day")
})

document.querySelectorAll("[data-calendar]").forEach(input => input.addEventListener("change", renderEvents))

document.querySelector("#previousDay").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() - 1)
  updateDate()
  showToast("Previous day loaded")
})

document.querySelector("#nextDay").addEventListener("click", () => {
  selectedDate.setDate(selectedDate.getDate() + 1)
  updateDate()
  showToast("Next day loaded")
})

document.querySelector("#todayButton").addEventListener("click", () => {
  selectedDate = new Date(2026, 8, 22)
  updateDate()
  showToast("Back to today")
})

document.querySelectorAll(".view-switch button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".view-switch button").forEach(item => item.classList.remove("is-active"))
    button.classList.add("is-active")
    showToast(button.dataset.range === "week" ? "Week view mapped for the next prototype pass" : "Day view active")
  })
})

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("is-active"))
    button.classList.add("is-active")
    showToast(`${button.dataset.view} workspace selected`)
  })
})

document.querySelectorAll(".focus-presets button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".focus-presets button").forEach(item => item.classList.remove("is-active"))
    button.classList.add("is-active")
    clearInterval(timerId)
    timerId = null
    timerSeconds = Number(button.dataset.minutes) * 60
    focusStart.textContent = "Start focus session"
    updateTimer()
  })
})

function updateTimer() {
  const minutes = Math.floor(timerSeconds / 60)
  const seconds = timerSeconds % 60
  focusTime.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

focusStart.addEventListener("click", () => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
    focusStart.textContent = "Resume focus session"
    showToast("Focus session paused")
    return
  }
  focusStart.textContent = "Pause session"
  showToast("Notifications muted for this prototype session")
  timerId = setInterval(() => {
    timerSeconds -= 1
    updateTimer()
    if (timerSeconds <= 0) {
      clearInterval(timerId)
      timerId = null
      focusStart.textContent = "Start another session"
      showToast("Focus session complete")
    }
  }, 1000)
})

document.querySelector("#breathingButton").addEventListener("click", event => {
  if (breathingId) {
    clearInterval(breathingId)
    breathingId = null
    breathingOrb.classList.remove("is-breathing")
    breathingPrompt.textContent = "A brief pause before your next block."
    event.currentTarget.textContent = "Begin breathing"
    return
  }
  const prompts = ["Breathe in slowly", "Hold with ease", "Breathe out fully", "Rest for a moment"]
  let index = 0
  breathingOrb.classList.add("is-breathing")
  breathingPrompt.textContent = prompts[0]
  event.currentTarget.textContent = "End exercise"
  breathingId = setInterval(() => {
    index = (index + 1) % prompts.length
    breathingPrompt.textContent = prompts[index]
  }, 4000)
})

document.querySelector("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("high-contrast")
  showToast(document.body.classList.contains("high-contrast") ? "Higher contrast enabled" : "Soft contrast enabled")
})

document.querySelector("#mobileMenu").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("is-open"))

renderEvents()
updateDate()
updateTimer()
