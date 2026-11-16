/* =========================================================
   PRESSURE // OFF
   COMPLETE SCRIPT - PROFILE + ADMIN + ROUTING FIX
========================================================= */

const SUPABASE_URL = "https://zssnupcdrgbgjtdtelgl.supabase.co";
const SUPABASE_KEY = "sb_publishable_1pD5veoyvfR1uSOWRuPjew_j-r3rmzp";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentProfile = null;
let currentTasks = [];
let adminUsers = [];
let authMode = "login";
let editingTaskId = null;
let accountGuardTimer = null;

function $(id) {
    return document.getElementById(id);
}

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

const profilePage = $("profilePage");
const profileButton = $("profileButton");
const backToDashboard = $("backToDashboard");
const profilePageLogout = $("profilePageLogout");
const profileAvatarLetter = $("profileAvatarLetter");
const profileName = $("profileName");
const profileUsername = $("profileUsername");
const profileRole = $("profileRole");
const profileMemberSince = $("profileMemberSince");
const profileTaskCount = $("profileTaskCount");
const profileHours = $("profileHours");
const profileNextDeadline = $("profileNextDeadline");
const profilePressureStatus = $("profilePressureStatus");
const profileDetailUsername = $("profileDetailUsername");
const profileDetailName = $("profileDetailName");
const profileDetailRole = $("profileDetailRole");
const profileDetailEmail = $("profileDetailEmail");
const profileDetailJoined = $("profileDetailJoined");
const profileCategoryBars = $("profileCategoryBars");
const profileCategoryEmpty = $("profileCategoryEmpty");
const profileRecentTasks = $("profileRecentTasks");
const profileTasksEmpty = $("profileTasksEmpty");
const profileAddTaskButton = $("profileAddTaskButton");

const adminButton = $("adminButton");
const adminPage = $("adminPage");
const backFromAdmin = $("backFromAdmin");
const adminLogoutButton = $("adminLogoutButton");
const adminTotalUsers = $("adminTotalUsers");
const adminTotalAdmins = $("adminTotalAdmins");
const adminTotalTasks = $("adminTotalTasks");
const refreshAdminUsers = $("refreshAdminUsers");
const adminUserSearch = $("adminUserSearch");
const adminUsersList = $("adminUsersList");

const aiForm = $("aiForm");
const aiInput = $("aiInput");
const aiMessages = $("aiMessages");

function usernameToEmail(username) {
    return `${username}@pressure-off.internal`;
}

function showAuthMessage(message) {
    if (authError) authError.textContent = message || "";
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";
    if (authTitle) authTitle.textContent = signup ? "Create your account" : "Welcome back";
    if (authSubtitle) authSubtitle.textContent = signup ? "Start understanding your workload." : "See the pressure before it piles up.";
    if (authButton) authButton.textContent = signup ? "Create account" : "Log in";
    if (nameField) nameField.classList.toggle("hidden", !signup);
    if (loginTab) loginTab.classList.toggle("active", !signup);
    if (signupTab) signupTab.classList.toggle("active", signup);
    showAuthMessage("");
}

if (loginTab) loginTab.addEventListener("click", () => setAuthMode("login"));
if (signupTab) signupTab.addEventListener("click", () => setAuthMode("signup"));

function showApp() {
    if (authScreen) authScreen.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    if (profilePage) profilePage.classList.add("hidden");
    if (adminPage) adminPage.classList.add("hidden");
}

function showAuth() {
    if (app) app.classList.add("hidden");
    if (profilePage) profilePage.classList.add("hidden");
    if (adminPage) adminPage.classList.add("hidden");
    if (authScreen) authScreen.classList.remove("hidden");
}

if (authForm) {
    authForm.addEventListener("submit", async event => {
        event.preventDefault();
        const username = authUsername ? authUsername.value.trim().toLowerCase() : "";
        const password = authPassword ? authPassword.value : "";
        const name = authName ? authName.value.trim() : "";

        if (!username || !password) {
            showAuthMessage("Please enter a username and password.");
            return;
        }
        if (authMode === "signup" && !name) {
            showAuthMessage("Please enter your name.");
            return;
        }

        if (authButton) authButton.disabled = true;
        showAuthMessage(authMode === "login" ? "Logging in..." : "Creating your account...");

        if (authMode === "signup") {
            try {
                const email = usernameToEmail(username);
                const { data: existingProfile } = await supabaseClient.from("profiles").select("id").eq("username", username).maybeSingle();
                if (existingProfile) {
                    showAuthMessage("Username already exists.");
                    return;
                }
                const { data, error } = await supabaseClient.auth.signUp({ email, password, options: { data: { username, name } } });
                if (error) { showAuthMessage(error.message); return; }
                if (data.session) await finishAuthentication();
                else {
                    showAuthMessage("Account created. Please log in.");
                    setAuthMode("login");
                }
            } catch (err) {
                showAuthMessage("Something went wrong.");
            } finally {
                if (authButton) authButton.disabled = false;
            }
            return;
        }

        try {
            const { data: loginEmail, error: rpcError } = await supabaseClient.rpc("get_login_email", { login_username: username });
            if (rpcError || !loginEmail) {
                showAuthMessage("Username not found.");
                return;
            }
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email: loginEmail, password });
            if (error) { showAuthMessage(error.message); return; }
            currentUser = data.user;
            await finishAuthentication();
        } catch (err) {
            showAuthMessage("Login failed.");
        } finally {
            if (authButton) authButton.disabled = false;
        }
    });
}

async function finishAuthentication() {
    await loadProfile();
    await loadTasks();
    showApp();
    renderDashboard();
    updateProfileUI();
    updateAdminVisibility();
}

async function loadTasks() {
    if (!currentUser) { currentTasks = []; return; }
    const { data } = await supabaseClient.from("tasks").select("*").eq("user_id", currentUser.id);
    currentTasks = data || [];
}

async function loadProfile() {
    if (!currentUser) return;
    const { data } = await supabaseClient.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
    currentProfile = data || null;
    if (!currentProfile) {
        const username = currentUser.user_metadata?.username || currentUser.email.split("@")[0];
        const { data: newProf } = await supabaseClient.from("profiles").insert([{ id: currentUser.id, username, name: username, role: "student" }]).select().single();
        currentProfile = newProf;
    }
    updateProfileUI();
    updateAdminVisibility();
}

function updateProfileUI() {
    if (!currentUser) return;
    const name = currentProfile?.name || currentUser.user_metadata?.name || "Student";
    if (usernameDisplay) usernameDisplay.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    updateRealProfilePage();
    updateAdminVisibility();
}

function updateRealProfilePage() {
    if (!currentUser) return;
    const name = currentProfile?.name || "Student";
    const username = currentProfile?.username || "student";
    if (profileName) profileName.textContent = name;
    if (profileUsername) profileUsername.textContent = `@${username}`;
    if (profileDetailName) profileDetailName.textContent = name;
    if (profileDetailUsername) profileDetailUsername.textContent = `@${username}`;
    if (profileDetailEmail) profileDetailEmail.textContent = currentUser.email || "-";
    renderProfileStats();
    renderProfileCategories();
    renderProfileRecentTasks();
}

function renderProfileStats() {
    const totalHours = currentTasks.reduce((sum, t) => sum + (Number(t.effort) || 0), 0);
    if (profileTaskCount) profileTaskCount.textContent = currentTasks.length;
    if (profileHours) profileHours.textContent = `${totalHours}h`;
}

function renderProfileCategories() {
    if (!profileCategoryBars) return;
    profileCategoryBars.innerHTML = currentTasks.length ? "" : "";
    if (profileCategoryEmpty) profileCategoryEmpty.style.display = currentTasks.length ? "none" : "block";
}

function renderProfileRecentTasks() {
    if (!profileRecentTasks) return;
    profileRecentTasks.innerHTML = "";
    if (profileTasksEmpty) profileTasksEmpty.style.display = currentTasks.length ? "none" : "block";
    currentTasks.slice(0, 5).forEach(task => {
        const div = document.createElement("div");
        div.className = "profile-recent-task";
        div.innerHTML = `<strong>${escapeHtml(task.name)}</strong><span>${task.effort}h</span>`;
        profileRecentTasks.appendChild(div);
    });
}

function getLocalDate(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
}

function getTaskDate(task) { return task?.date || task?.due_date || ""; }
function daysUntil(dateString) {
    if (!dateString) return 999;
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateString + "T00:00:00");
    return Math.round((target - today) / 86400000);
}
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
}

function getWeekData() {
    const week = [];
    for (let i = 0; i < 7; i++) {
        const date = getLocalDate(i);
        const tasks = currentTasks.filter(t => getTaskDate(t) === date);
        const hours = tasks.reduce((sum, t) => sum + (Number(t.effort) || 0), 0);
        week.push({ date, tasks, hours });
    }
    return week;
}

function getDayStatus(hours) {
    if (hours >= 5) return { className: "overloaded", label: "Overloaded" };
    if (hours >= 3) return { className: "busy", label: "Busy" };
    return { className: "manageable", label: "Manageable" };
}

function calculateWeeklyScore() {
    if (!currentTasks.length) return 1;
    const total = currentTasks.reduce((sum, t) => sum + (Number(t.effort) || 0), 0);
    return Math.max(1, Math.min(10, Math.round(1 + total * 0.5)));
}

function renderDashboard() {
    const score = calculateWeeklyScore();
    if ($("score")) $("score").textContent = score;
    if ($("totalHours")) $("totalHours").textContent = `${currentTasks.reduce((s, t) => s + Number(t.effort||0), 0)}h planned`;
    renderRadar();
    renderWeek();
    renderTasks();
}

function renderRadar() {
    const container = $("radarBars");
    if (!container) return;
    container.innerHTML = "";
    const week = getWeekData();
    const max = Math.max(...week.map(d => d.hours), 1);
    week.forEach(d => {
        const col = document.createElement("div");
        col.className = "radar-column";
        const status = getDayStatus(d.hours);
        col.innerHTML = `<span class="radar-value">${d.hours}h</span><div class="radar-bar ${status.className}" style="height:${Math.max(10, (d.hours/max)*100)}%"></div><span class="radar-day">${new Date(d.date+"T00:00:00").toLocaleDateString(undefined,{weekday:'short'})}</span>`;
        container.appendChild(col);
    });
}

function renderWeek() {
    const container = $("weekGrid");
    if (!container) return;
    container.innerHTML = "";
    getWeekData().forEach(d => {
        const status = getDayStatus(d.hours);
        const div = document.createElement("div");
        div.className = `day ${status.className}`;
        div.innerHTML = `<div class="day-header"><span class="day-name">${new Date(d.date+"T00:00:00").toLocaleDateString(undefined,{weekday:'short'})}</span><span class="day-number">${new Date(d.date+"T00:00:00").getDate()}</span></div><div class="day-hours">${d.hours}h planned</div>`;
        container.appendChild(div);
    });
}

function renderTasks() {
    const container = $("taskList");
    if (!container) return;
    container.innerHTML = currentTasks.length ? "" : '<div class="empty-tasks">No tasks yet.</div>';
    currentTasks.forEach(task => {
        const row = document.createElement("div");
        row.className = "task-row";
        row.innerHTML = `<span class="task-icon">${task.category?.[0]||"T"}</span><div class="task-info"><strong>${escapeHtml(task.name)}</strong><small>${escapeHtml(task.category)} - Due ${getTaskDate(task)}</small></div><span class="effort">${task.effort}h</span>`;
        container.appendChild(row);
    });
}

function openAddTask() {
    if (taskModal) taskModal.classList.remove("hidden");
}
function closeTaskModal() {
    if (taskModal) taskModal.classList.add("hidden");
}
window.openAddTask = openAddTask;

if (addTaskTop) addTaskTop.addEventListener("click", openAddTask);
if (addTaskButton) addTaskButton.addEventListener("click", openAddTask);
if (closeModalButton) closeModalButton.addEventListener("click", closeTaskModal);
if (cancelModalButton) closeModalButton.addEventListener("click", closeTaskModal);

if (taskForm) {
    taskForm.addEventListener("submit", async e => {
        e.preventDefault();
        const name = taskName.value.trim();
        const category = taskCategory.value;
        const effort = Number(taskEffort.value);
        const date = taskDate.value;
        if (!name || !date) return;
        await supabaseClient.from("tasks").insert([{ user_id: currentUser.id, name, category, effort, date, due_date: date }]);
        closeTaskModal();
        await loadTasks();
        renderDashboard();
    });
}

function isCurrentUserAdmin() { return !!currentUser && currentProfile?.is_admin === true; }
function updateAdminVisibility() {
    if (adminButton) adminButton.style.display = isCurrentUserAdmin() ? "inline-flex" : "none";
}

if (profileButton) profileButton.addEventListener("click", () => {
    if (app) app.classList.add("hidden");
    if (profilePage) profilePage.classList.remove("hidden");
});
if (backToDashboard) backToDashboard.addEventListener("click", () => {
    if (profilePage) profilePage.classList.add("hidden");
    if (app) app.classList.remove("hidden");
});
if (adminButton) adminButton.addEventListener("click", () => {
    if (app) app.classList.add("hidden");
    if (adminPage) adminPage.classList.remove("hidden");
    loadAdminUsers();
});
if (backFromAdmin) backFromAdmin.addEventListener("click", () => {
    if (adminPage) adminPage.classList.add("hidden");
    if (app) app.classList.remove("hidden");
});

async function loadAdminUsers() {
    if (!isCurrentUserAdmin()) return;
    const { data } = await supabaseClient.from("profiles").select("*");
    adminUsers = data || [];
    if ($("adminTotalUsers")) $("adminTotalUsers").textContent = adminUsers.length;
    if ($("adminTotalAdmins")) $("adminTotalAdmins").textContent = adminUsers.filter(u => u.is_admin).length;
    if (adminUsersList) {
        adminUsersList.innerHTML = adminUsers.map(u => `<div class="admin-user-row"><div class="admin-user-avatar">${(u.name||"U")[0]}</div><div class="admin-user-info"><strong>${escapeHtml(u.name)}</strong><span>@${escapeHtml(u.username)}</span></div></div>`).join("");
    }
}

async function performLogout() {
    await supabaseClient.auth.signOut();
    currentUser = null; currentProfile = null; currentTasks = [];
    showAuth();
}
if (logoutButton) logoutButton.addEventListener("click", performLogout);
if (profilePageLogout) profilePageLogout.addEventListener("click", performLogout);
if (adminLogoutButton) logoutButton.addEventListener("click", performLogout);

/* Routing & Panels Handler */
window.poOpenSettings = () => {
    if (profilePage) profilePage.classList.remove("hidden");
    if (app) app.classList.add("hidden");
};
window.poSocial = () => {
    alert("Social features coming online.");
};

document.addEventListener("click", e => {
    const target = e.target.closest("#profileAppearanceButton, #socialButton");
    if (!target) return;
    e.preventDefault();
    if (target.id === "profileAppearanceButton") window.poOpenSettings();
    if (target.id === "socialButton") window.poSocial();
}, true);

async function checkSession() {
    const { data } = await supabaseClient.auth.getSession();
    if (data?.session) {
        currentUser = data.session.user;
        await finishAuthentication();
    } else {
        showAuth();
    }
}

checkSession();
