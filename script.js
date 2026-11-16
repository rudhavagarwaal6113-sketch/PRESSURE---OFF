const SUPABASE_URL = "https://zssnupcdrgbgjtdtelgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_1pD5veoyvfR1uSOWRuPjew_j-r3rmzp";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentTasks = [];
let authMode = "login";
let editingTaskId = null;

function $(id) { return document.getElementById(id); }

const authScreen = $("authScreen");
const app = $("app");
const authForm = $("authForm");
const authUsername = $("authUsername");
const authPassword = $("authPassword");
const authName = $("authName");
const nameField = $("nameField");
const authButton = $("authButton");
const authError = $("authError");
const authTitle = $("authTitle");
const authSubtitle = $("authSubtitle");
const loginTab = $("loginTab");
const signupTab = $("signupTab");
const logoutButton = $("logoutButton");
const usernameDisplay = $("username");
const avatar = $("avatar");

const taskModal = $("taskModal");
const modalTitle = $("modalTitle");
const taskForm = $("taskForm");
const taskName = $("taskName");
const taskCategory = $("taskCategory");
const taskEffort = $("taskEffort");
const taskDate = $("taskDate");
const saveTaskButton = $("saveTask");
const deleteTaskButton = $("deleteTask");
const closeModalButton = $("closeModal");
const cancelModalButton = $("cancelModal");
const addTaskTop = $("addTaskTop");
const addTaskButton = $("addTaskButton");

const aiForm = $("aiForm");
const aiInput = $("aiInput");
const aiMessages = $("aiMessages");

function setAuthMode(mode) {
    authMode = mode;
    if (mode === "signup") {
        authTitle.textContent = "Create account";
        authSubtitle.textContent = "Start tracking your workload.";
        authButton.textContent = "Sign up";
        nameField.classList.remove("hidden");
        loginTab.classList.remove("active");
        signupTab.classList.add("active");
    } else {
        authTitle.textContent = "Welcome back";
        authSubtitle.textContent = "See the pressure before it piles up.";
        authButton.textContent = "Log in";
        nameField.classList.add("hidden");
        signupTab.classList.remove("active");
        loginTab.classList.add("active");
    }
    authError.textContent = "";
}

loginTab.addEventListener("click", () => setAuthMode("login"));
signupTab.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = authUsername.value.trim().toLowerCase();
    const password = authPassword.value;
    const name = authName.value.trim();

    if (!username || !password) return;

    if (authMode === "signup") {
        if (!name) { authError.textContent = "Name is required."; return; }
        const email = `${username}@pressure-off.internal`;
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username, name } }
        });
        if (error) { authError.textContent = error.message; return; }
        currentUser = data.user;
    } else {
        const { data: emailData, error: rpcError } = await supabaseClient.rpc("get_login_email", { login_username: username });
        if (rpcError || !emailData) { authError.textContent = "User not found."; return; }
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email: emailData, password });
        if (error) { authError.textContent = error.message; return; }
        currentUser = data.user;
    }
    await finishAuth();
});

async function finishAuth() {
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    await loadTasks();
    updateUI();
}

async function loadTasks() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient.from("tasks").select("*").eq("user_id", currentUser.id);
    currentTasks = error ? [] : data;
}

function updateUI() {
    const meta = currentUser.user_metadata || {};
    const name = meta.name || meta.username || "User";
    usernameDisplay.textContent = name;
    avatar.textContent = name.charAt(0).toUpperCase();
    renderDashboard();
}

function renderDashboard() {
    renderScore();
    renderRadar();
    renderWeek();
    renderTasks();
}

function renderScore() {
    const totalHours = currentTasks.reduce((acc, t) => acc + Number(t.effort || 0), 0);
    $("score").textContent = Math.min(10, Math.max(1, Math.round(1 + totalHours * 0.4)));
    $("totalHours").textContent = `${totalHours}h planned`;
}

function renderRadar() {
    const container = $("radarBars");
    container.innerHTML = "";
    if (!currentTasks.length) {
        container.innerHTML = `<div style="color:#94a3b8;font-size:12px;margin:auto;">No tasks</div>`;
        return;
    }
    const max = Math.max(...currentTasks.map(t => Number(t.effort || 1)));
    currentTasks.slice(0, 5).forEach(t => {
        const col = document.createElement("div");
        col.className = "radar-column";
        const height = Math.max(10, (Number(t.effort) / max) * 100);
        col.innerHTML = `<div class="radar-bar" style="height:${height}%"></div><span style="font-size:10px;color:#94a3b8;">${t.effort}h</span>`;
        container.appendChild(col);
    });
}

function renderWeek() {
    const grid = $("weekGrid");
    grid.innerHTML = "";
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const dayTasks = currentTasks.filter(t => (t.date || t.due_date) === dateStr);

        const dayEl = document.createElement("div");
        dayEl.className = "day";
        dayEl.innerHTML = `<strong style="font-size:12px;color:#94a3b8;">${d.toLocaleDateString(undefined, {weekday:'short'})}</strong>` +
            dayTasks.map(t => `<div style="font-size:11px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">• ${t.name}</div>`).join("");
        grid.appendChild(dayEl);
    }
}

function renderTasks() {
    const list = $("taskList");
    list.innerHTML = "";
    if (!currentTasks.length) {
        list.innerHTML = `<div style="color:#94a3b8;font-size:13px;">No tasks added yet.</div>`;
        return;
    }
    currentTasks.forEach(t => {
        const row = document.createElement("div");
        row.className = "task-row";
        row.innerHTML = `<span><strong>${t.name}</strong> <small style="color:#94a3b8;">(${t.category})</small></span><span>${t.effort}h</span>`;
        list.appendChild(row);
    });
}

function openAddTask() {
    editingTaskId = null;
    taskForm.reset();
    modalTitle.textContent = "Add a task";
    deleteTaskButton.classList.add("hidden");
    taskModal.classList.remove("hidden");
}

function closeTaskModal() {
    taskModal.classList.add("hidden");
}

addTaskTop.addEventListener("click", openAddTask);
addTaskButton.addEventListener("click", openAddTask);
closeModalButton.addEventListener("click", closeTaskModal);
cancelModalButton.addEventListener("click", closeTaskModal);

taskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = taskName.value.trim();
    const category = taskCategory.value;
    const effort = Number(taskEffort.value);
    const date = taskDate.value;

    if (!name || !date) return;

    await supabaseClient.from("tasks").insert([{
        user_id: currentUser.id,
        name,
        category,
        effort,
        date,
        due_date: date
    }]);

    closeTaskModal();
    await loadTasks();
    renderDashboard();
});

aiForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = aiInput.value.trim();
    if (!q) return;
    const userMsg = document.createElement("div");
    userMsg.className = "ai-message";
    userMsg.style.textAlign = "right";
    userMsg.textContent = q;
    aiMessages.appendChild(userMsg);
    aiInput.value = "";

    setTimeout(() => {
        const reply = document.createElement("div");
        reply.className = "ai-message assistant";
        reply.textContent = "Focus on your upcoming deadlines and break large tasks into smaller effort blocks.";
        aiMessages.appendChild(reply);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }, 300);
});

logoutButton.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    currentUser = null;
    currentTasks = [];
    app.classList.add("hidden");
    authScreen.classList.remove("hidden");
});

async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
        currentUser = data.session.user;
        await finishAuth();
    }
}

checkSession();
