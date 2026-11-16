/* =========================================================
   PRESSURE // OFF
   COMPLETE SCRIPT - PROFILE + ADMIN VERSION
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://zssnupcdrgbgjtdtelgl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_1pD5veoyvfR1uSOWRuPjew_j-r3rmzp";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let currentTasks = [];

let adminUsers = [];

let authMode = "login";
let editingTaskId = null;
let accountGuardTimer = null;

function getCompletedTaskIds() {
    const ids = currentProfile?.preferences?.completedTaskIds;
    return Array.isArray(ids) ? ids.map(String) : [];
}

function isTaskComplete(task) {
    return getCompletedTaskIds().includes(String(task.id));
}

function getChatAccess() {
    const score = typeof calculateWeeklyScore === "function" ? calculateWeeklyScore() : 1;
    const allTasksComplete = currentTasks.length > 0 && currentTasks.every(isTaskComplete);
    const mode = score >= 8 ? "locked" : score >= 4 ? "limited" : "full";
    return {
        score, mode, allTasksComplete,
        allowed: mode !== "locked" && allTasksComplete,
        message: !allTasksComplete ? "Complete every task first to unlock chat." :
            mode === "locked" ? "Chat is paused at pressure 8-10. Finish tasks and bring your pressure down." :
            mode === "limited" ? "Limited chat is available while pressure is 4-7." :
            "Full chat is available while pressure is 1-3."
    };
}
window.pressureChatAccess = getChatAccess;

async function setTaskCompleted(taskId, completed) {
    if (!currentUser || !currentProfile) return;
    const ids = new Set(getCompletedTaskIds());
    if (completed) ids.add(String(taskId)); else ids.delete(String(taskId));
    const preferences = { ...(currentProfile.preferences || {}), completedTaskIds: [...ids] };
    const { error } = await supabaseClient.from("profiles").update({ preferences }).eq("id", currentUser.id);
    if (error) return alert("Could not update task status: " + error.message);
    currentProfile = { ...currentProfile, preferences };
    renderDashboard();
    window.poRenderSocial?.();
}

async function enforceAccountStillExists() {
    if (!currentUser) return;
    const { data, error } = await supabaseClient.from("profiles").select("id").eq("id", currentUser.id).maybeSingle();
    if (error || data) return;
    clearInterval(accountGuardTimer);
    accountGuardTimer = null;
    await supabaseClient.auth.signOut();
    currentUser = null; currentProfile = null; currentTasks = [];
    showAuth();
    alert("This account is no longer available. You have been signed out.");
}

function startAccountGuard() {
    clearInterval(accountGuardTimer);
    accountGuardTimer = setInterval(enforceAccountStillExists, 15000);
    document.addEventListener("visibilitychange", enforceAccountStillExists);
}



/* =========================================================
   SHORT DOM HELPER
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   DOM
========================================================= */

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

const notificationButton = $("notificationButton");
const notificationButton2 = $("notificationButton2");

const aiForm = $("aiForm");
const aiInput = $("aiInput");
const aiMessages = $("aiMessages");


/* =========================================================
   REAL PROFILE PAGE DOM
========================================================= */

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


/* =========================================================
   ADMIN DOM
========================================================= */

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


/* =========================================================
   EXTRA CSS
========================================================= */

function injectExtraStyles() {
    if ($("pressureExtraStyles")) return;

    const style = document.createElement("style");
    style.id = "pressureExtraStyles";
    style.textContent = `
        .task-row {
            position: relative;
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            text-align: left;
            cursor: pointer;
        }
        .task-row .task-info {
            flex: 1;
            min-width: 0;
        }
        .task-actions {
            display: flex;
            gap: 6px;
            flex-shrink: 0;
        }
        .task-action {
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.05);
            color: inherit;
            border-radius: 8px;
            padding: 6px 9px;
            font-size: 11px;
            cursor: pointer;
        }
        .task-action:hover {
            background: rgba(255,255,255,.10);
        }
        .task-action.delete {
            color: #ff6975;
        }
        .mini-task {
            cursor: pointer;
            width: 100%;
            border: 0;
            text-align: left;
            color: inherit;
        }
        .suggestion p {
            margin: 4px 0 0;
        }
        .profile-page.hidden {
            display: none;
        }
        .profile-page {
            min-height: 100vh;
        }
    `;
    document.head.appendChild(style);
}


/* =========================================================
   USERNAME TO INTERNAL EMAIL
========================================================= */

function usernameToEmail(username) {
    return `${username}@pressure-off.internal`;
}


/* =========================================================
   AUTH UI
========================================================= */

function showAuthMessage(message) {
    if (authError) {
        authError.textContent = message || "";
    }
}

function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === "signup";

    if (authTitle) {
        authTitle.textContent = signup ? "Create your account" : "Welcome back";
    }
    if (authSubtitle) {
        authSubtitle.textContent = signup ? "Start understanding your workload." : "See the pressure before it piles up.";
    }
    if (authButton) {
        authButton.textContent = signup ? "Create account" : "Log in";
    }
    if (nameField) {
        nameField.classList.toggle("hidden", !signup);
    }
    if (loginTab) {
        loginTab.classList.toggle("active", !signup);
    }
    if (signupTab) {
        signupTab.classList.toggle("active", signup);
    }
    showAuthMessage("");
}

if (loginTab) {
    loginTab.addEventListener("click", () => setAuthMode("login"));
}
if (signupTab) {
    signupTab.addEventListener("click", () => setAuthMode("signup"));
}


/* =========================================================
   SHOW / HIDE APP
========================================================= */

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


/* =========================================================
   SIGNUP / LOGIN
========================================================= */

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
                const { data: existingProfile, error: profileCheckError } = await supabaseClient
                    .from("profiles")
                    .select("id")
                    .eq("username", username)
                    .maybeSingle();

                if (profileCheckError) {
                    showAuthMessage("Could not check username: " + profileCheckError.message);
                    return;
                }

                if (existingProfile) {
                    showAuthMessage("Username already exists.");
                    return;
                }

                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: { data: { username, name } }
                });

                if (error) {
                    showAuthMessage(error.message);
                    return;
                }

                if (!data || !data.user) {
                    showAuthMessage("Account could not be created.");
                    return;
                }

                currentUser = data.user;
                if (data.session) {
                    await finishAuthentication();
                } else {
                    showAuthMessage("Account created. Please log in.");
                    setAuthMode("login");
                    if (authUsername) authUsername.value = username;
                    if (authPassword) authPassword.value = "";
                }
            } catch (error) {
                showAuthMessage("Something went wrong while creating your account.");
            } finally {
                if (authButton) authButton.disabled = false;
            }
            return;
        }

        try {
            const { data: loginEmail, error: rpcError } = await supabaseClient.rpc("get_login_email", {
                login_username: username
            });

            if (rpcError || !loginEmail) {
                showAuthMessage("Username not found or login failed.");
                return;
            }

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: loginEmail,
                password
            });

            if (error) {
                showAuthMessage(error.message);
                return;
            }

            currentUser = data.user;
            await finishAuthentication();
        } catch (error) {
            showAuthMessage("Something went wrong while logging in.");
        } finally {
            if (authButton) authButton.disabled = false;
        }
    });
}


/* =========================================================
   FINISH AUTHENTICATION
========================================================= */

async function finishAuthentication() {
    await loadProfile();
    await loadTasks();
    showApp();
    renderDashboard();
    updateProfileUI();
    updateNotificationButtons();
    updateAdminVisibility();
    startAccountGuard();
}


/* =========================================================
   LOAD TASKS & PROFILE
========================================================= */

async function loadTasks() {
    if (!currentUser) {
        currentTasks = [];
        return;
    }
    try {
        const { data, error } = await supabaseClient
            .from("tasks")
            .select("*")
            .eq("user_id", currentUser.id);

        currentTasks = error ? [] : (data || []);
    } catch (error) {
        currentTasks = [];
    }
}

async function loadProfile() {
    if (!currentUser) return;
    try {
        const { data, error } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        currentProfile = error ? null : (data || null);
    } catch (error) {
        currentProfile = null;
    }

    if (!currentProfile) {
        try {
            const metadata = currentUser.user_metadata || {};
            const username = metadata.username || currentUser.email?.split("@")[0] || "student";
            const name = metadata.name || username;

            const { data, error } = await supabaseClient
                .from("profiles")
                .insert([{ id: currentUser.id, username, name, role: "student" }])
                .select()
                .single();

            if (!error) currentProfile = data;
        } catch (error) {}
    }
    updateProfileUI();
    updateAdminVisibility();
}

function getDisplayName() {
    const metadata = currentUser?.user_metadata || {};
    return currentProfile?.name || metadata.name || currentProfile?.username || metadata.username || currentUser?.email?.split("@")[0] || "Student";
}

function getUsername() {
    const metadata = currentUser?.user_metadata || {};
    return currentProfile?.username || metadata.username || currentUser?.email?.split("@")[0] || "student";
}

function getRole() {
    return currentProfile?.role || "student";
}

function getMemberSince() {
    return currentProfile?.created_at || currentUser?.created_at || "";
}

function updateProfileUI() {
    if (!currentUser) return;
    const name = getDisplayName();
    if (usernameDisplay) usernameDisplay.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    document.title = `PRESSURE // OFF - ${name}`;
    updateRealProfilePage();
    updateAdminVisibility();
}

function updateRealProfilePage() {
    if (!currentUser) return;
    const name = getDisplayName();
    const username = getUsername();
    const role = getRole();
    const joined = getMemberSince();

    if (profileAvatarLetter) profileAvatarLetter.textContent = name.charAt(0).toUpperCase();
    if (profileName) profileName.textContent = name;
    if (profileUsername) profileUsername.textContent = `@${username}`;
    if (profileRole) profileRole.textContent = role.toUpperCase();
    if (profileMemberSince) profileMemberSince.textContent = joined ? `SINCE ${formatMemberDate(joined)}` : "MEMBER";
    if (profileDetailUsername) profileDetailUsername.textContent = `@${username}`;
    if (profileDetailName) profileDetailName.textContent = name;
    if (profileDetailRole) profileDetailRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    if (profileDetailEmail) profileDetailEmail.textContent = currentUser.email || "-";
    if (profileDetailJoined) profileDetailJoined.textContent = joined ? readableDateFromTimestamp(joined) : "-";

    renderProfileStats();
    renderProfileCategories();
    renderProfileRecentTasks();
}

function renderProfileStats() {
    const totalHours = currentTasks.reduce((sum, task) => sum + (Number(task.effort) || 0), 0);
    const upcoming = [...currentTasks]
        .filter(task => daysUntil(getTaskDate(task)) >= 0)
        .sort((a, b) => daysUntil(getTaskDate(a)) - daysUntil(getTaskDate(b)));
    const nextTask = upcoming[0];
    const score = calculateWeeklyScore();

    let status = "CALM";
    if (score >= 8) status = "HIGH";
    else if (score >= 6) status = "WATCH";
    else if (score >= 4) status = "BUSY";

    if (profileTaskCount) profileTaskCount.textContent = currentTasks.length;
    if (profileHours) profileHours.textContent = formatHours(totalHours);
    if (profileNextDeadline) profileNextDeadline.textContent = nextTask ? readableShortDate(getTaskDate(nextTask)) : "-";
    if (profilePressureStatus) profilePressureStatus.textContent = status;
}

function renderProfileCategories() {
    if (!profileCategoryBars) return;
    profileCategoryBars.innerHTML = "";

    if (!currentTasks.length) {
        if (profileCategoryEmpty) profileCategoryEmpty.style.display = "block";
        return;
    }
    if (profileCategoryEmpty) profileCategoryEmpty.style.display = "none";

    const categories = {};
    currentTasks.forEach(task => {
        const cat = task.category || "Other";
        categories[cat] = (categories[cat] || 0) + (Number(task.effort) || 0);
    });

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...sorted.map(item => item[1]), 1);

    sorted.forEach(([category, hours]) => {
        const item = document.createElement("div");
        item.className = "profile-category-item";
        const percentage = (hours / max) * 100;
        item.innerHTML = `
            <div class="profile-category-head">
                <span>${escapeHtml(category)}</span>
                <span>${formatHours(hours)}</span>
            </div>
            <div class="profile-category-track">
                <div class="profile-category-fill" style="width:${percentage}%"></div>
            </div>
        `;
        profileCategoryBars.appendChild(item);
    });
}

function renderProfileRecentTasks() {
    if (!profileRecentTasks) return;
    profileRecentTasks.innerHTML = "";

    if (!currentTasks.length) {
        if (profileTasksEmpty) profileTasksEmpty.style.display = "block";
        return;
    }
    if (profileTasksEmpty) profileTasksEmpty.style.display = "none";

    const sorted = [...currentTasks]
        .sort((a, b) => new Date(getTaskDate(a)) - new Date(getTaskDate(b)))
        .slice(0, 6);

    sorted.forEach(task => {
        const element = document.createElement("div");
        element.className = "profile-recent-task";
        const date = getTaskDate(task);
        const days = daysUntil(date);
        let deadline = days < 0 ? "Overdue" : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due ${readableShortDate(date)}`;

        element.innerHTML = `
            <span class="profile-recent-task-icon">${getCategoryIcon(task.category)}</span>
            <span class="profile-recent-task-info">
                <strong>${escapeHtml(task.name)}</strong>
                <span>${escapeHtml(task.category || "Other")} - ${escapeHtml(deadline)}</span>
            </span>
            <span class="profile-recent-task-effort">${formatHours(task.effort)}</span>
        `;
        element.addEventListener("click", () => openEditTask(task.id));
        profileRecentTasks.appendChild(element);
    });
}

function openProfilePage() {
    if (!currentUser) return;
    if (app) app.classList.add("hidden");
    if (adminPage) adminPage.classList.add("hidden");
    if (profilePage) profilePage.classList.remove("hidden");
    updateRealProfilePage();
    window.scrollTo(0, 0);
}

function closeProfilePage() {
    if (profilePage) profilePage.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    window.scrollTo(0, 0);
}

if (profileButton) profileButton.addEventListener("click", openProfilePage);
if (backToDashboard) backToDashboard.addEventListener("click", closeProfilePage);
if (profileAddTaskButton) profileAddTaskButton.addEventListener("click", () => { closeProfilePage(); openAddTask(); });


/* =========================================================
   LOGOUT
========================================================= */

async function performLogout() {
    clearInterval(accountGuardTimer);
    accountGuardTimer = null;

    try {
        await supabaseClient.auth.signOut();
    } catch (e) {}

    currentUser = null;
    currentProfile = null;
    currentTasks = [];
    adminUsers = [];
    editingTaskId = null;

    closeTaskModal();
    showAuth();
    if (authForm) authForm.reset();
    setAuthMode("login");
}

if (logoutButton) logoutButton.addEventListener("click", performLogout);
if (profilePageLogout) profilePageLogout.addEventListener("click", performLogout);
if (adminLogoutButton) adminLogoutButton.addEventListener("click", performLogout);


/* =========================================================
   DATE HELPERS & UTILITIES
========================================================= */

function getLocalDate(offset = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getTaskDate(task) {
    return task?.date || task?.due_date || "";
}

function readableDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function readableShortDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function readableDateFromTimestamp(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatMemberDate(timestamp) {
    if (!timestamp) return "MEMBER";
    return new Date(timestamp).toLocaleDateString(undefined, { month: "short", year: "numeric" }).toUpperCase();
}

function getDayName(dateString) {
    if (!dateString) return "";
    return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, { weekday: "long" });
}

function daysUntil(dateString) {
    if (!dateString) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString + "T00:00:00");
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatHours(value) {
    const number = Number(value) || 0;
    return `${number.toFixed(1).replace(".0", "")}h`;
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}


/* =========================================================
   DASHBOARD & WEEK DATA
========================================================= */

function getWeekData() {
    const week = [];
    for (let i = 0; i < 7; i++) {
        const date = getLocalDate(i);
        const tasks = currentTasks.filter(task => getTaskDate(task) === date);
        const hours = tasks.reduce((sum, task) => sum + (Number(task.effort) || 0), 0);
        week.push({ date, tasks, hours });
    }
    return week;
}

function getDayStatus(hours) {
    if (hours >= 5) return { className: "overloaded", label: "Overloaded" };
    if (hours >= 3) return { className: "busy", label: "Busy" };
    return { className: "manageable", label: "Manageable" };
}

function renderDashboard() {
    renderScore();
    renderRadar();
    renderAlert();
    renderWeek();
    renderTasks();
    renderSuggestions();
    renderReminders();
    updateRealProfilePage();
}

function calculateWeeklyScore() {
    if (!currentTasks.length) return 1;
    const totalEffort = currentTasks.reduce((sum, task) => sum + (Number(task.effort) || 0), 0);
    const urgentTasks = currentTasks.filter(task => {
        const days = daysUntil(getTaskDate(task));
        return days <= 2 && days >= 0;
    }).length;
    const overdueTasks = currentTasks.filter(task => daysUntil(getTaskDate(task)) < 0).length;
    const overloadedDays = getWeekData().filter(day => day.hours >= 5).length;

    let score = 1 + totalEffort * 0.55 + urgentTasks * 0.9 + overdueTasks * 1.5 + overloadedDays * 1.2;
    return Math.max(1, Math.min(10, Math.round(score)));
}

function renderScore() {
    const scoreElement = $("score");
    const scoreRing = $("scoreRing");
    const scoreLabel = $("scoreLabel");
    const totalHours = $("totalHours");
    const score = calculateWeeklyScore();
    const total = currentTasks.reduce((sum, task) => sum + (Number(task.effort) || 0), 0);

    if (scoreElement) scoreElement.textContent = score;
    if (totalHours) totalHours.textContent = `${formatHours(total)} planned`;
    if (scoreLabel) {
        if (score <= 3) scoreLabel.textContent = "Calm week";
        else if (score <= 5) scoreLabel.textContent = "Manageable";
        else if (score <= 7) scoreLabel.textContent = "Getting busy";
        else scoreLabel.textContent = "High pressure";
    }
    if (scoreRing) {
        const percentage = score * 10;
        scoreRing.style.background = `conic-gradient(var(--blue) ${percentage}%, rgba(91,140,255,.08) ${percentage}%)`;
    }
}

function renderRadar() {
    const container = $("radarBars");
    const empty = $("radarEmpty");
    if (!container) return;

    const week = getWeekData();
    container.innerHTML = "";
    if (empty) empty.style.display = currentTasks.length ? "none" : "block";
    if (!currentTasks.length) return;

    const maxHours = Math.max(...week.map(day => day.hours), 1);

    week.forEach(day => {
        const column = document.createElement("div");
        column.className = "radar-column";
        const status = getDayStatus(day.hours);
        const bar = document.createElement("div");
        bar.className = `radar-bar ${status.className}`;
        const height = Math.max(5, (day.hours / maxHours) * 100);
        bar.style.height = `${height}%`;

        const value = document.createElement("span");
        value.className = "radar-value";
        value.textContent = formatHours(day.hours);

        const dayLabel = document.createElement("span");
        dayLabel.className = "radar-day";
        dayLabel.textContent = new Date(day.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });

        column.appendChild(value);
        column.appendChild(bar);
        column.appendChild(dayLabel);
        container.appendChild(column);
    });
}

function renderAlert() {
    const alertCard = $("alert");
    const alertTitle = $("alertTitle");
    const alertText = $("alertText");
    if (!alertCard) return;

    const week = getWeekData();
    const overloaded = week.filter(day => day.hours >= 5);

    if (!overloaded.length) {
        alertCard.classList.add("hidden");
        return;
    }

    const worstDay = [...overloaded].sort((a, b) => b.hours - a.hours)[0];
    alertCard.classList.remove("hidden");
    if (alertTitle) alertTitle.textContent = `${getDayName(worstDay.date)} looks overloaded.`;
    if (alertText) alertText.textContent = `${formatHours(worstDay.hours)} are planned. Consider starting one of these tasks earlier.`;
}

function renderWeek() {
    const container = $("weekGrid");
    if (!container) return;
    const week = getWeekData();
    container.innerHTML = "";

    week.forEach(day => {
        const status = getDayStatus(day.hours);
        const element = document.createElement("div");
        element.className = `day ${status.className}`;
        const date = new Date(day.date + "T00:00:00");
        const dayName = date.toLocaleDateString(undefined, { weekday: "short" });

        element.innerHTML = `
            <div class="day-header">
                <span class="day-name">${dayName}</span>
                <span class="day-number">${date.getDate()}</span>
            </div>
            <div class="day-status"><span class="status-dot"></span>${status.label}</div>
            <div class="day-tasks">
                ${day.tasks.length ? day.tasks.map(task => `
                    <button type="button" class="mini-task" data-task-id="${task.id}">
                        <span class="mini-dot"></span>
                        <span>
                            <strong>${escapeHtml(task.name)}</strong>
                            <small>${formatHours(task.effort)}</small>
                        </span>
                    </button>
                `).join("") : `<span class="empty-day">No tasks</span>`}
            </div>
            <div class="day-hours">${day.hours > 0 ? `${formatHours(day.hours)} planned` : "Free"}</div>
        `;

        element.querySelectorAll(".mini-task").forEach(button => {
            button.addEventListener("click", event => {
                event.stopPropagation();
                openEditTask(button.dataset.taskId);
            });
        });
        container.appendChild(element);
    });
}

function getCategoryIcon(category) {
    const icons = { Test: "T", Homework: "H", Project: "P", Assignment: "A", Tuition: "U", Other: "-" };
    return icons[category] || "-";
}

function renderTasks() {
    const container = $("taskList");
    if (!container) return;
    container.innerHTML = "";

    if (!currentTasks.length) {
        container.innerHTML = `<div class="empty-tasks">No tasks yet.<br>Add your first task to start seeing your workload.</div>`;
        return;
    }

    const sortedTasks = [...currentTasks].sort((a, b) => new Date(getTaskDate(a)) - new Date(getTaskDate(b)));

    sortedTasks.forEach(task => {
        const row = document.createElement("div");
        row.className = "task-row";
        const date = getTaskDate(task);
        const days = daysUntil(date);
        let deadlineText = days < 0 ? "Overdue" : days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due ${readableShortDate(date)}`;

        row.innerHTML = `
            <label class="task-complete" title="Mark task complete">
                <input type="checkbox" ${isTaskComplete(task) ? "checked" : ""} aria-label="Mark ${escapeHtml(task.name)} complete">
                <span class="task-checkmark"></span>
            </label>
            <span class="task-icon">${getCategoryIcon(task.category)}</span>
            <span class="task-info">
                <strong>${escapeHtml(task.name)}</strong>
                <small>${escapeHtml(task.category || "Other")} - ${deadlineText}</small>
            </span>
            <span class="effort">${formatHours(task.effort)}</span>
            <span class="task-actions">
                <button type="button" class="task-action edit">Edit</button>
                <button type="button" class="task-action delete">Delete</button>
            </span>
        `;

        const completionInput = row.querySelector(".task-complete input");
        completionInput.addEventListener("click", event => event.stopPropagation());
        completionInput.addEventListener("change", event => {
            setTaskCompleted(task.id, event.target.checked);
        });

        row.querySelector(".edit").addEventListener("click", event => {
            event.stopPropagation();
            openEditTask(task.id);
        });
        row.querySelector(".delete").addEventListener("click", async event => {
            event.stopPropagation();
            await deleteTask(task.id);
        });
        row.addEventListener("click", () => openEditTask(task.id));

        container.appendChild(row);
    });
}

function renderSuggestions() {
    const container = $("suggestions");
    if (!container) return;
    container.innerHTML = "";
    const suggestions = [];

    if (!currentTasks.length) {
        suggestions.push({
            title: "Add your first task",
            text: "Add homework, tests, projects or assignments and I'll start analysing your workload."
        });
    } else {
        suggestions.push({
            title: "Use focused sessions",
            text: "Finish one high-priority task before jumping between several smaller ones."
        });
    }

    suggestions.slice(0, 4).forEach((suggestion, index) => {
        const element = document.createElement("div");
        element.className = "suggestion";
        element.innerHTML = `
            <span class="suggestion-number">${index + 1}</span>
            <div>
                <strong>${escapeHtml(suggestion.title)}</strong>
                <p>${escapeHtml(suggestion.text)}</p>
            </div>
        `;
        container.appendChild(element);
    });
}

function renderReminders() {
    const container = $("reminderList");
    if (!container) return;
    container.innerHTML = "";

    const reminders = [...currentTasks]
        .filter(task => daysUntil(getTaskDate(task)) <= 3)
        .sort((a, b) => daysUntil(getTaskDate(a)) - daysUntil(getTaskDate(b)));

    if (!reminders.length) {
        container.innerHTML = `<div class="no-reminders">You're clear for the next few days.<br>No urgent deadlines detected.</div>`;
        return;
    }

    reminders.slice(0, 5).forEach(task => {
        const element = document.createElement("div");
        element.className = "reminder";
        element.innerHTML = `
            <span class="reminder-icon">!</span>
            <div>
                <strong>${escapeHtml(task.name)}</strong>
                <p>Upcoming deadline in ${daysUntil(getTaskDate(task))} days.</p>
            </div>
        `;
        container.appendChild(element);
    });
}


/* =========================================================
   TASK MODAL & ACTIONS
========================================================= */

function openAddTask() {
    editingTaskId = null;
    if (taskForm) taskForm.reset();
    if (taskCategory) taskCategory.value = "Homework";
    if (taskEffort) taskEffort.value = "1";
    if (taskDate) taskDate.value = getLocalDate(0);
    if (modalTitle) modalTitle.textContent = "Add a task";
    if (saveTaskButton) saveTaskButton.textContent = "Add Task";
    if (deleteTaskButton) deleteTaskButton.classList.add("hidden");
    if (taskModal) taskModal.classList.remove("hidden");
}

function openEditTask(id) {
    const task = currentTasks.find(item => String(item.id) === String(id));
    if (!task) return;
    editingTaskId = task.id;
    if (taskName) taskName.value = task.name || "";
    if (taskCategory) taskCategory.value = task.category || "Homework";
    if (taskEffort) taskEffort.value = task.effort || 1;
    if (taskDate) taskDate.value = getTaskDate(task);
    if (modalTitle) modalTitle.textContent = "Edit task";
    if (saveTaskButton) saveTaskButton.textContent = "Save changes";
    if (deleteTaskButton) deleteTaskButton.classList.remove("hidden");
    if (taskModal) taskModal.classList.remove("hidden");
}

window.openAddTask = openAddTask;
window.openEditTask = openEditTask;

function closeTaskModal() {
    if (taskModal) taskModal.classList.add("hidden");
    editingTaskId = null;
}
window.closeTaskModal = closeTaskModal;

if (addTaskTop) addTaskTop.addEventListener("click", openAddTask);
if (addTaskButton) addTaskButton.addEventListener("click", openAddTask);
if (closeModalButton) closeModalButton.addEventListener("click", closeTaskModal);
if (cancelModalButton) cancelModalButton.addEventListener("click", closeTaskModal);

if (taskForm) {
    taskForm.addEventListener("submit", async event => {
        event.preventDefault();
        const name = taskName ? taskName.value.trim() : "";
        const category = taskCategory ? taskCategory.value : "Other";
        const effort = taskEffort ? Number(taskEffort.value) : 0;
        const date = taskDate ? taskDate.value : "";

        if (!name || !date || !effort || effort <= 0) {
            alert("Please fill in all required task fields correctly.");
            return;
        }
        if (!currentUser) return;

        if (saveTaskButton) saveTaskButton.disabled = true;

        try {
            if (editingTaskId !== null) {
                const { data, error } = await supabaseClient
                    .from("tasks")
                    .update({ name, category, effort, date, due_date: date })
                    .eq("id", editingTaskId)
                    .eq("user_id", currentUser.id)
                    .select()
                    .single();

                if (error) {
                    alert("Could not update task: " + error.message);
                    return;
                }
                const index = currentTasks.findIndex(task => String(task.id) === String(editingTaskId));
                if (index !== -1) currentTasks[index] = data;
            } else {
                const { data, error } = await supabaseClient
                    .from("tasks")
                    .insert([{ user_id: currentUser.id, name, category, effort, date, due_date: date }])
                    .select()
                    .single();

                if (error) {
                    alert("Could not create task: " + error.message);
                    return;
                }
                currentTasks.push(data);
            }
            closeTaskModal();
            renderDashboard();
        } catch (error) {
            alert("Something went wrong while saving the task.");
        } finally {
            if (saveTaskButton) saveTaskButton.disabled = false;
        }
    });
}

async function deleteTask(id) {
    if (!currentUser) return;
    const task = currentTasks.find(item => String(item.id) === String(id));
    if (!task || !confirm(`Delete "${task.name}"?`)) return;

    try {
        const { error } = await supabaseClient
            .from("tasks")
            .delete()
            .eq("id", id)
            .eq("user_id", currentUser.id);

        if (error) {
            alert("Could not delete task: " + error.message);
            return;
        }
        currentTasks = currentTasks.filter(item => String(item.id) !== String(id));
        closeTaskModal();
        renderDashboard();
    } catch (error) {
        alert("Something went wrong while deleting the task.");
    }
}
window.deleteTask = deleteTask;


/* =========================================================
   ADMIN PANEL FUNCTIONS
========================================================= */

function isCurrentUserAdmin() {
    return !!currentUser && currentProfile?.is_admin === true;
}

function updateAdminVisibility() {
    const admin = isCurrentUserAdmin();
    if (adminButton) adminButton.style.display = admin ? "inline-flex" : "none";
    if (!admin && adminPage) adminPage.classList.add("hidden");
}

async function openAdminPage() {
    if (!currentUser || !isCurrentUserAdmin()) {
        alert("Admin access required.");
        return;
    }
    if (app) app.classList.add("hidden");
    if (profilePage) profilePage.classList.add("hidden");
    if (adminPage) adminPage.classList.remove("hidden");
    window.scrollTo(0, 0);
    await loadAdminUsers();
}

function closeAdminPage() {
    if (adminPage) adminPage.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    window.scrollTo(0, 0);
}

if (adminButton) adminButton.addEventListener("click", openAdminPage);
if (backFromAdmin) backFromAdmin.addEventListener("click", closeAdminPage);
if (refreshAdminUsers) refreshAdminUsers.addEventListener("click", loadAdminUsers);

async function getAdminSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    return error ? null : (data?.session || null);
}

async function loadAdminUsers() {
    const list = $("adminUsersList");
    if (!list) return;

    list.innerHTML = `<div class="admin-empty-state"><strong>Loading users...</strong><p>Please wait.</p></div>`;

    try {
        if (!currentUser || !currentProfile?.is_admin) {
            list.innerHTML = `<div class="admin-empty-state"><strong>Access denied</strong><p>Administrator access is required.</p></div>`;
            return;
        }

        const session = await getAdminSession();
        if (!session) throw new Error("Your session has expired.");

        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-list-users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            }
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load users.");

        adminUsers = result.users || [];
        renderAdminUsers(adminUsers);

        if ($("adminTotalUsers")) $("adminTotalUsers").textContent = result.total || adminUsers.length;
        if ($("adminTotalAdmins")) $("adminTotalAdmins").textContent = adminUsers.filter(u => u.is_admin).length;
        if ($("adminTotalTasks")) $("adminTotalTasks").textContent = adminUsers.reduce((sum, u) => sum + (Number(u.task_count) || 0), 0);
    } catch (error) {
        list.innerHTML = `<div class="admin-empty-state"><strong>Could not load users</strong><p>${escapeHtml(error.message)}</p></div>`;
    }
}
window.loadAdminUsers = loadAdminUsers;

function renderAdminUsers(users) {
    const list = $("adminUsersList");
    if (!list) return;

    if (!users.length) {
        list.innerHTML = `<div class="admin-empty-state"><strong>No users found</strong><p>There are currently no registered users.</p></div>`;
        return;
    }

    list.innerHTML = users.map(user => {
        const initials = (user.name || user.username || "?").trim().charAt(0).toUpperCase();
        const created = user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown";
        const adminBadge = user.is_admin ? `<span class="admin-badge">ADMIN</span>` : "";
        const deleteButton = user.id === currentUser.id || user.is_admin ? "" : `
            <button class="admin-delete-button" type="button" onclick="adminDeleteUser('${user.id}')">Delete</button>
        `;

        return `
            <article class="admin-user-row">
                <div class="admin-user-avatar">${escapeHtml(initials)}</div>
                <div class="admin-user-info">
                    <strong>${escapeHtml(user.name || "Unnamed")} ${adminBadge}</strong>
                    <span>@${escapeHtml(user.username || "unknown")}</span>
                    <small>Joined ${escapeHtml(created)}</small>
                </div>
                <div class="admin-user-meta">
                    <span>${escapeHtml(user.role || "student")}</span>
                    ${deleteButton}
                </div>
            </article>
        `;
    }).join("");
}

async function adminDeleteUser(userId) {
    if (!currentUser || !isCurrentUserAdmin()) {
        alert("Admin access required.");
        return;
    }
    if (!userId || String(userId) === String(currentUser.id)) {
        alert("Invalid user selection or you cannot delete your own admin account.");
        return;
    }

    if (!confirm("Permanently delete this user account?")) return;

    try {
        const session = await getAdminSession();
        if (!session) {
            alert("Your session has expired.");
            return;
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete-user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ user_id: userId })
        });

        const result = await response.json();
        if (!response.ok) {
            alert(result.error || "Could not delete user.");
            return;
        }

        alert("User deleted successfully.");
        await loadAdminUsers();
    } catch (error) {
        alert("Something went wrong while deleting the user.");
    }
}
window.adminDeleteUser = adminDeleteUser;


/* =========================================================
   SESSION & INITIALIZATION
========================================================= */

async function checkSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data?.session) {
            showAuth();
            return;
        }
        currentUser = data.session.user;
        await finishAuthentication();
    } catch (error) {
        showAuth();
    }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
        currentUser = null;
        currentProfile = null;
        currentTasks = [];
        adminUsers = [];
        updateAdminVisibility();
        showAuth();
    } else if (event === "SIGNED_IN" && session) {
        currentUser = session.user;
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeTaskModal();
        if (profilePage && !profilePage.classList.contains("hidden")) closeProfilePage();
        if (adminPage && !adminPage.classList.contains("hidden")) closeAdminPage();
    }
});

injectExtraStyles();
setAuthMode("login");
updateNotificationButtons?.();
updateAdminVisibility();
checkSession();

/* =========================================================
   PRESSURE // OFF
   STUDY COACH AI ASSISTANT
========================================================= */

function addAIMessage(message, type = "assistant") {
    if (!aiMessages) return;
    const element = document.createElement("div");
    element.className = `ai-message ${type}`;

    if (type === "assistant") {
        element.innerHTML = `<span class="message-icon">*</span><p>${escapeHtml(message)}</p>`;
    } else {
        element.innerHTML = `<p>${escapeHtml(message)}</p>`;
    }

    aiMessages.appendChild(element);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

function analyseWorkload() {
    const totalHours = currentTasks.reduce((sum, task) => sum + (Number(task.effort) || 0), 0);
    const week = getWeekData();
    const busiestDay = [...week].sort((a, b) => b.hours - a.hours)[0];
    const overdue = currentTasks.filter(task => daysUntil(getTaskDate(task)) < 0);
    const urgent = currentTasks.filter(task => {
        const days = daysUntil(getTaskDate(task));
        return days >= 0 && days <= 2;
    });
    const nextTask = [...currentTasks]
        .filter(task => daysUntil(getTaskDate(task)) >= 0)
        .sort((a, b) => getTaskPressure(b) - getTaskPressure(a))[0];

    return { totalHours, busiestDay, overdue, urgent, nextTask, week };
}

function generateAIResponse(question) {
    const q = question.toLowerCase().trim();
    const analysis = analyseWorkload();

    if (q.includes("quiz") || q.includes("test me")) {
        return "Study coach mode: choose one topic, answer one question without notes, then check your work. Tell me the subject and topic and I'll make a short practice quiz.";
    }
    if (q.includes("explain") || q.includes("teach") || q.includes("understand")) {
        return "Study coach mode: tell me the exact subject and topic. I'll break it into a simple explanation, a worked example, and one practice question.";
    }
    if (q.includes("how do i study") || q.includes("study plan")) {
        return "Use a 25-minute focus block: review the idea, practise from memory, check mistakes, then write one sentence about what you still need to revisit.";
    }
    if (!currentTasks.length) {
        return "You don't have any tasks yet. Add your homework, tests, projects or assignments and I'll analyse your deadlines, effort and busy days.";
    }
    if (q.includes("today") || q.includes("now") || q.includes("start")) {
        const todayTasks = currentTasks
            .filter(task => daysUntil(getTaskDate(task)) === 0)
            .sort((a, b) => getTaskPressure(b) - getTaskPressure(a));

        if (todayTasks.length) {
            const top = todayTasks[0];
            return `Start with "${top.name}". It is due today and needs about ${formatHours(top.effort)}. Finish this before moving to lower-pressure work.`;
        }
        if (analysis.nextTask) {
            return `I'd start with "${analysis.nextTask.name}". It is due ${readableDate(getTaskDate(analysis.nextTask))} and needs about ${formatHours(analysis.nextTask.effort)}.`;
        }
    }
    if (q.includes("priority") || q.includes("important") || q.includes("first")) {
        if (analysis.nextTask) {
            return `Your highest-priority task is "${analysis.nextTask.name}" due ${readableDate(getTaskDate(analysis.nextTask))}, needing about ${formatHours(analysis.nextTask.effort)}.`;
        }
    }
    if (q.includes("hours") || q.includes("workload")) {
        return `You currently have ${formatHours(analysis.totalHours)} planned across ${currentTasks.length} task(s). Busiest day: ${analysis.busiestDay ? getDayName(analysis.busiestDay.date) : "None"}.`;
    }
    return `I've analysed your workload: ${currentTasks.length} task(s), ${formatHours(analysis.totalHours)} planned, ${analysis.urgent.length} urgent. Try asking "What should I work on today?" or "Plan my week".`;
}

if (aiForm) {
    aiForm.addEventListener("submit", event => {
        event.preventDefault();
        const question = aiInput ? aiInput.value.trim() : "";
        if (!question) return;
        addAIMessage(question, "user");
        if (aiInput) aiInput.value = "";
        setTimeout(() => {
            addAIMessage(generateAIResponse(question), "assistant");
        }, 250);
    });
}

document.querySelectorAll(".quick-prompts button").forEach(button => {
    button.addEventListener("click", () => {
        const question = button.dataset.prompt;
        if (!question) return;
        addAIMessage(question, "user");
        setTimeout(() => {
            addAIMessage(generateAIResponse(question), "assistant");
        }, 250);
    });
});


/* =========================================================
   PRESSURE SOCIAL & SETTINGS UPGRADE MODULE
========================================================= */

(() => {
    const P = {
        friends: [],
        requests: [],
        selectedFriend: null,
        messages: [],
        realtime: null,
        preferences: {
            theme: "midnight",
            accent: "#5B8CFF",
            density: "comfortable",
            reducedMotion: false,
            pressureAnimations: true,
            notifications: true
        }
    };

    const esc = v => String(v ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
    const me = () => window.currentUser || currentUser;
    const profile = () => window.currentProfile || currentProfile;

    function ensureUI() {
        if (document.getElementById("pressureSocialModal")) return;
        const modal = document.createElement("div");
        modal.id = "pressureSocialModal";
        modal.className = "pressure-social-modal hidden";
        modal.innerHTML = `
          <div class="pressure-social-backdrop" data-close-pressure></div>
          <section class="pressure-social-panel" role="dialog" aria-modal="true">
            <header class="pressure-social-head">
              <div><span class="pressure-kicker">YOUR SPACE</span><h2>Profile & Social</h2><p>Personalize Pressure // Off, connect with friends, and chat live.</p></div>
              <button class="pressure-icon-btn" data-close-pressure aria-label="Close">x</button>
            </header>
            <nav class="pressure-social-tabs">
              <button class="pressure-social-tab active" data-tab="appearance">Appearance</button>
              <button class="pressure-social-tab" data-tab="friends">Friends</button>
              <button class="pressure-social-tab" data-tab="chat">Chat</button>
              <button class="pressure-social-tab" data-tab="account">Account</button>
            </nav>
            <div class="pressure-social-body">
              <div class="pressure-social-view active" data-view="appearance">
                <div class="pressure-setting-grid">
                  <label><span>Theme</span><select id="pressureTheme"><option value="midnight">Midnight</option><option value="light">Light</option></select></label>
                  <label><span>Accent</span><input id="pressureAccent" type="color"></label>
                  <label><span>Dashboard density</span><select id="pressureDensity"><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="cozy">Cozy</option></select></label>
                  <label class="pressure-switch"><span>Reduced motion</span><input id="pressureReducedMotion" type="checkbox"><i></i></label>
                  <label class="pressure-switch"><span>Pressure animations</span><input id="pressurePressureAnimations" type="checkbox"><i></i></label>
                  <label class="pressure-switch"><span>Notifications</span><input id="pressureNotifications" type="checkbox"><i></i></label>
                </div>
                <div class="pressure-save-row"><span id="pressurePrefStatus">Changes save to your profile.</span><button class="pressure-primary" id="pressureSavePrefs">Save preferences</button></div>
              </div>
              <div class="pressure-social-view" data-view="friends">
                <div class="pressure-search-row"><input id="pressurePeopleSearch" placeholder="Search username..." autocomplete="off"><button class="pressure-primary" id="pressurePeopleSearchBtn">Search</button></div>
                <div id="pressurePeopleResults" class="pressure-list"></div>
                <div class="pressure-section-title">Friend requests</div><div id="pressureRequests" class="pressure-list"></div>
                <div class="pressure-section-title">Your friends</div><div id="pressureFriends" class="pressure-list"></div>
              </div>
              <div class="pressure-social-view" data-view="chat">
                <div class="pressure-chat-layout"><aside id="pressureChatFriends" class="pressure-chat-friends"></aside><div class="pressure-chat-main"><div id="pressureChatTitle" class="pressure-chat-title">Select a friend</div><div id="pressureMessages" class="pressure-messages"><div class="pressure-empty">Choose a friend to start chatting.</div></div><form id="pressureMessageForm" class="pressure-message-form"><input id="pressureMessageInput" maxlength="2000" placeholder="Write a message..." autocomplete="off"><button class="pressure-primary">Send</button></form></div></div>
              </div>
              <div class="pressure-social-view" data-view="account">
                <div class="pressure-account-card"><div><span>Display name</span><input id="pressureDisplayName" maxlength="80"></div><button class="pressure-primary" id="pressureSaveName">Save name</button></div>
                <div class="pressure-danger-card"><div><strong>Delete my account</strong><p>Permanently deletes your profile, tasks, and messages.</p></div><button class="pressure-danger" id="pressureDeleteAccount">Delete account</button></div>
              </div>
            </div>
          </section>`;
        document.body.appendChild(modal);

        modal.querySelectorAll("[data-close-pressure]").forEach(x => x.addEventListener("click", closePressurePanel));
        modal.querySelectorAll(".pressure-social-tab").forEach(x => x.addEventListener("click", () => openPressurePanel(x.dataset.tab)));
        document.getElementById("pressureSavePrefs").addEventListener("click", savePreferences);
        document.getElementById("pressurePeopleSearchBtn").addEventListener("click", searchPeople);
        document.getElementById("pressureMessageForm").addEventListener("submit", sendMessage);
        document.getElementById("pressureSaveName").addEventListener("click", saveDisplayName);
        document.getElementById("pressureDeleteAccount").addEventListener("click", deleteOwnAccount);
    }

    function applyPreferences() {
        const p = P.preferences;
        document.documentElement.style.setProperty("--blue", p.accent || "#5B8CFF");
        document.body.dataset.pressureTheme = p.theme || "midnight";
        document.body.dataset.pressureDensity = p.density || "comfortable";
    }

    async function loadPreferences() {
        const p = profile();
        P.preferences = { ...P.preferences, ...(p?.preferences || {}) };
        const t = document.getElementById("pressureTheme"); if (t) t.value = P.preferences.theme;
        const a = document.getElementById("pressureAccent"); if (a) a.value = P.preferences.accent;
        const d = document.getElementById("pressureDensity"); if (d) d.value = P.preferences.density;
        const dn = document.getElementById("pressureDisplayName"); if (dn) dn.value = p?.name || "";
        applyPreferences();
    }

    async function savePreferences() {
        const next = {
            theme: document.getElementById("pressureTheme").value,
            accent: document.getElementById("pressureAccent").value,
            density: document.getElementById("pressureDensity").value,
            reducedMotion: document.getElementById("pressureReducedMotion").checked,
            pressureAnimations: document.getElementById("pressurePressureAnimations").checked,
            notifications: document.getElementById("pressureNotifications").checked
        };
        const { error } = await supabaseClient.from("profiles").update({ preferences: next }).eq("id", me().id);
        if (error) return alert(error.message);
        P.preferences = next; if (currentProfile) currentProfile.preferences = next; applyPreferences();
        document.getElementById("pressurePrefStatus").textContent = "Saved ✓";
        setTimeout(() => document.getElementById("pressurePrefStatus").textContent = "Changes save to your profile.", 1800);
    }

    function openPressurePanel(tab = "appearance") {
        ensureUI();
        const modal = document.getElementById("pressureSocialModal");
        modal.classList.remove("hidden");
        modal.querySelectorAll(".pressure-social-tab").forEach(x => x.classList.toggle("active", x.dataset.tab === tab));
        modal.querySelectorAll(".pressure-social-view").forEach(x => x.classList.toggle("active", x.dataset.view === tab));
        if (tab === "friends" || tab === "chat") loadSocial();
        loadPreferences();
    }

    function closePressurePanel() { 
        document.getElementById("pressureSocialModal")?.classList.add("hidden"); 
    }

    async function loadSocial() {
        if (!me()) return;
        const [f, r] = await Promise.all([
            supabaseClient.from("friendships").select("*").or(`requester_id.eq.${me().id},addressee_id.eq.${me().id}`).order("updated_at", { ascending: false }),
            supabaseClient.from("friendships").select("*").eq("addressee_id", me().id).eq("status", "pending")
        ]);
        if (!f.error) {
            const ids = [...new Set(f.data.flatMap(x => [x.requester_id, x.addressee_id]).filter(x => x !== me().id))];
            let people = [];
            if (ids.length) { const res = await supabaseClient.from("profiles").select("id,username,name,role").in("id", ids); people = res.data || []; }
            const map = new Map(people.map(x => [x.id, x]));
            P.friends = f.data.filter(x => x.status === "accepted").map(x => ({ ...x, person: map.get(x.requester_id === me().id ? x.addressee_id : x.requester_id) })).filter(x => x.person);
            P.requests = r.data.map(x => ({ ...x, person: map.get(x.requester_id) })).filter(x => x.person);
        }
        renderFriends(); renderRequests(); renderChatFriends();
    }

    async function searchPeople() {
        const term = document.getElementById("pressurePeopleSearch").value.trim().toLowerCase();
        const box = document.getElementById("pressurePeopleResults");
        if (term.length < 2) { box.innerHTML = '<div class="pressure-empty">Type at least 2 characters.</div>'; return; }
        const { data, error } = await supabaseClient.from("profiles").select("id,username,name,role").ilike("username", `%${term}%`).neq("id", me().id).limit(12);
        if (error) { box.innerHTML = `<div class="pressure-empty">${esc(error.message)}</div>`; return; }
        box.innerHTML = data?.length ? data.map(person => `<div class="pressure-person"><div class="pressure-person-avatar">${esc((person.name || person.username || "?")[0].toUpperCase())}</div><div><strong>${esc(person.name || person.username)}</strong><span>@${esc(person.username)}</span></div><button class="pressure-primary pressure-small" onclick="window.sendFriendRequest('${person.id}')">Add</button></div>`).join("") : '<div class="pressure-empty">No users found.</div>';
    }

    async function sendFriendRequest(id) {
        const { error } = await supabaseClient.from("friendships").insert({ requester_id: me().id, addressee_id: id, status: "pending" });
        if (error) return alert(error.message);
        loadSocial(); searchPeople();
    }
    window.sendFriendRequest = sendFriendRequest;

    function renderRequests() {
        const box = document.getElementById("pressureRequests");
        if (!box) return;
        box.innerHTML = P.requests.length ? P.requests.map(x => `<div class="pressure-person"><div class="pressure-person-avatar">${esc((x.person.name || x.person.username || "?")[0].toUpperCase())}</div><div><strong>${esc(x.person.name || x.person.username)}</strong><span>@${esc(x.person.username)}</span></div><button class="pressure-primary pressure-small" onclick="window.acceptRequest('${x.id}')">Accept</button></div>`).join("") : '<div class="pressure-empty">No pending requests.</div>';
    }

    async function acceptRequest(id) {
        await supabaseClient.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", id);
        loadSocial();
    }
    window.acceptRequest = acceptRequest;

    function renderFriends() {
        const box = document.getElementById("pressureFriends");
        if (!box) return;
        box.innerHTML = P.friends.length ? P.friends.map(x => `<div class="pressure-person pressure-clickable" onclick="window.openChatWith('${x.person.id}')"><div class="pressure-person-avatar">${esc((x.person.name || x.person.username || "?")[0].toUpperCase())}</div><div><strong>${esc(x.person.name || x.person.username)}</strong><span>@${esc(x.person.username)}</span></div></div>`).join("") : '<div class="pressure-empty">No friends yet.</div>';
    }

    function renderChatFriends() {
        const box = document.getElementById("pressureChatFriends");
        if (!box) return;
        box.innerHTML = P.friends.length ? P.friends.map(x => `<button class="pressure-chat-friend" onclick="window.openChatWith('${x.person.id}')"><span><strong>${esc(x.person.name || x.person.username)}</strong></span></button>`).join("") : '<div class="pressure-empty">Add a friend first.</div>';
    }

    async function openChatWith(id) {
        const found = P.friends.find(x => x.person.id === id)?.person;
        if (!found) return;
        P.selectedFriend = found;
        document.getElementById("pressureChatTitle").textContent = `${found.name || found.username} - @${found.username}`;
        const { data } = await supabaseClient.from("messages").select("*").or(`and(sender_id.eq.${me().id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${me().id})`).order("created_at", { ascending: true }).limit(200);
        P.messages = data || [];
        renderMessages();
    }
    window.openChatWith = openChatWith;

    function renderMessages() {
        const box = document.getElementById("pressureMessages");
        if (!box) return;
        box.innerHTML = P.messages.length ? P.messages.map(m => `<div class="pressure-message ${m.sender_id === me().id ? "mine" : "theirs"}">${esc(m.body)}</div>`).join("") : '<div class="pressure-empty">Say hello 👋</div>';
        box.scrollTop = box.scrollHeight;
    }

    async function sendMessage(e) {
        e.preventDefault();
        const input = document.getElementById("pressureMessageInput");
        const body = input.value.trim();
        if (!body || !P.selectedFriend) return;
        await supabaseClient.from("messages").insert({ sender_id: me().id, receiver_id: P.selectedFriend.id, body });
        input.value = "";
        openChatWith(P.selectedFriend.id);
    }

    async function saveDisplayName() {
        const name = document.getElementById("pressureDisplayName").value.trim();
        await supabaseClient.from("profiles").update({ name }).eq("id", me().id);
        if (currentProfile) currentProfile.name = name;
        updateProfileUI();
        alert("Name saved.");
    }

    async function deleteOwnAccount() {
        if (!confirm("Permanently delete your account?")) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;
        await fetch(`${SUPABASE_URL}/functions/v1/delete-my-account`, { method: "POST", headers: { "Authorization": `Bearer ${session.access_token}` } });
        await supabaseClient.auth.signOut();
        location.reload();
    }

    window.openPressurePanel = openPressurePanel;
    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("socialButton")?.addEventListener("click", () => openPressurePanel("friends"));
    });
})();
