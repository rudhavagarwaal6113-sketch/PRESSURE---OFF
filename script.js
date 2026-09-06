/* =========================================================
   PRESSURE // OFF
   COMPLETE SCRIPT — CLEAN VERSION
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

let authMode = "login";
let editingTaskId = null;


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
   EXTRA CSS
   Adds controls that the original CSS doesn't provide.
========================================================= */

function injectExtraStyles() {

    if ($("pressureExtraStyles")) {
        return;
    }

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

        .pressure-profile-panel {
            position: fixed;
            top: 78px;
            right: 24px;
            width: min(350px, calc(100vw - 32px));
            z-index: 200;
            padding: 20px;
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 18px;
            background: rgba(15,18,30,.97);
            box-shadow: 0 20px 60px rgba(0,0,0,.40);
            backdrop-filter: blur(20px);
        }

        .pressure-profile-panel.hidden {
            display: none;
        }

        .profile-top {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
        }

        .profile-big-avatar {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: rgba(91,140,255,.15);
            font-weight: 700;
            font-size: 20px;
        }

        .profile-name {
            font-weight: 700;
            font-size: 17px;
        }

        .profile-username {
            opacity: .60;
            font-size: 12px;
            margin-top: 3px;
        }

        .profile-stat-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 16px;
        }

        .profile-stat {
            padding: 12px;
            border-radius: 12px;
            background: rgba(255,255,255,.04);
        }

        .profile-stat strong {
            display: block;
            font-size: 18px;
        }

        .profile-stat span {
            font-size: 11px;
            opacity: .60;
        }

        .profile-email {
            font-size: 12px;
            opacity: .60;
            word-break: break-all;
            margin-bottom: 15px;
        }

        .profile-close {
            width: 100%;
            border: 1px solid rgba(255,255,255,.10);
            background: rgba(255,255,255,.05);
            color: inherit;
            border-radius: 10px;
            padding: 9px;
            cursor: pointer;
        }

        @media (max-width: 600px) {
            .pressure-profile-panel {
                top: 70px;
                right: 12px;
            }

            .task-actions {
                gap: 3px;
            }

            .task-action {
                padding: 5px 6px;
            }
        }

    `;

    document.head.appendChild(style);
}


/* =========================================================
   USERNAME → INTERNAL EMAIL
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
        authTitle.textContent =
            signup
                ? "Create your account"
                : "Welcome back";
    }

    if (authSubtitle) {
        authSubtitle.textContent =
            signup
                ? "Start understanding your workload."
                : "See the pressure before it piles up.";
    }

    if (authButton) {
        authButton.textContent =
            signup
                ? "Create account"
                : "Log in";
    }

    if (nameField) {
        nameField.classList.toggle(
            "hidden",
            !signup
        );
    }

    if (loginTab) {
        loginTab.classList.toggle(
            "active",
            !signup
        );
    }

    if (signupTab) {
        signupTab.classList.toggle(
            "active",
            signup
        );
    }

    showAuthMessage("");

}


if (loginTab) {

    loginTab.addEventListener(
        "click",
        () => setAuthMode("login")
    );

}


if (signupTab) {

    signupTab.addEventListener(
        "click",
        () => setAuthMode("signup")
    );

}


/* =========================================================
   SHOW / HIDE APP
========================================================= */

function showApp() {

    if (authScreen) {
        authScreen.classList.add("hidden");
    }

    if (app) {
        app.classList.remove("hidden");
    }

}


function showAuth() {

    if (app) {
        app.classList.add("hidden");
    }

    if (authScreen) {
        authScreen.classList.remove("hidden");
    }

}


/* =========================================================
   SIGNUP / LOGIN
========================================================= */

if (authForm) {

    authForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const username =
                authUsername
                    ? authUsername.value.trim().toLowerCase()
                    : "";

            const password =
                authPassword
                    ? authPassword.value
                    : "";

            const name =
                authName
                    ? authName.value.trim()
                    : "";


            if (!username || !password) {

                showAuthMessage(
                    "Please enter a username and password."
                );

                return;
            }


            if (
                authMode === "signup" &&
                !name
            ) {

                showAuthMessage(
                    "Please enter your name."
                );

                return;
            }


            if (authButton) {
                authButton.disabled = true;
            }


            showAuthMessage(
                authMode === "login"
                    ? "Logging in..."
                    : "Creating your account..."
            );


            /* =================================================
               SIGNUP
            ================================================= */

            if (authMode === "signup") {

                try {

                    const email =
                        usernameToEmail(username);


                    const {
                        data: existingProfile,
                        error: profileCheckError
                    } =
                        await supabaseClient
                            .from("profiles")
                            .select("id")
                            .eq("username", username)
                            .maybeSingle();


                    if (profileCheckError) {

                        console.error(
                            "PROFILE CHECK ERROR:",
                            profileCheckError
                        );

                        showAuthMessage(
                            "Could not check username: " +
                            profileCheckError.message
                        );

                        return;
                    }


                    if (existingProfile) {

                        showAuthMessage(
                            "Username already exists."
                        );

                        return;
                    }


                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth.signUp({

                            email,

                            password,

                            options: {
                                data: {
                                    username,
                                    name
                                }
                            }

                        });


                    if (error) {

                        console.error(
                            "SIGNUP ERROR:",
                            error
                        );

                        showAuthMessage(
                            error.message
                        );

                        return;
                    }


                    if (!data || !data.user) {

                        showAuthMessage(
                            "Account could not be created."
                        );

                        return;
                    }


                    currentUser = data.user;


                    /*
                       If Supabase returns a session,
                       continue directly into the app.
                    */

                    if (data.session) {

                        await finishAuthentication();

                    } else {

                        /*
                           This usually means email confirmation
                           is enabled in Supabase.
                        */

                        showAuthMessage(
                            "Account created. Please log in."
                        );

                        setAuthMode("login");

                        if (authUsername) {
                            authUsername.value = username;
                        }

                        if (authPassword) {
                            authPassword.value = "";
                        }

                    }

                } catch (error) {

                    console.error(
                        "SIGNUP CRASH:",
                        error
                    );

                    showAuthMessage(
                        "Something went wrong while creating your account."
                    );

                } finally {

                    if (authButton) {
                        authButton.disabled = false;
                    }

                }

                return;
            }


            /* =================================================
               LOGIN
            ================================================= */

            try {

                const {
                    data: loginEmail,
                    error: rpcError
                } =
                    await supabaseClient.rpc(
                        "get_login_email",
                        {
                            login_username: username
                        }
                    );


                if (rpcError) {

                    console.error(
                        "LOGIN RPC ERROR:",
                        rpcError
                    );

                    showAuthMessage(
                        "Login failed: " +
                        rpcError.message
                    );

                    return;
                }


                if (!loginEmail) {

                    showAuthMessage(
                        "Username not found."
                    );

                    return;
                }


                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({

                        email: loginEmail,

                        password

                    });


                if (error) {

                    console.error(
                        "LOGIN ERROR:",
                        error
                    );

                    showAuthMessage(
                        error.message
                    );

                    return;
                }


                if (!data || !data.user) {

                    showAuthMessage(
                        "Login succeeded but no user was returned."
                    );

                    return;
                }


                currentUser =
                    data.user;


                await finishAuthentication();


            } catch (error) {

                console.error(
                    "LOGIN CRASH:",
                    error
                );

                showAuthMessage(
                    "Something went wrong while logging in."
                );

            } finally {

                if (authButton) {
                    authButton.disabled = false;
                }

            }

        }
    );

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

}


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .maybeSingle();


        if (error) {

            console.warn(
                "PROFILE LOAD WARNING:",
                error
            );

            currentProfile = null;

        } else {

            currentProfile =
                data || null;

        }

    } catch (error) {

        console.warn(
            "PROFILE LOAD CRASH:",
            error
        );

        currentProfile = null;

    }


    updateProfileUI();

}


function getDisplayName() {

    const metadata =
        currentUser?.user_metadata || {};


    return (
        currentProfile?.name ||
        metadata.name ||
        currentProfile?.username ||
        metadata.username ||
        currentUser?.email?.split("@")[0] ||
        "Student"
    );

}


function getUsername() {

    const metadata =
        currentUser?.user_metadata || {};


    return (
        currentProfile?.username ||
        metadata.username ||
        "student"
    );

}


function updateProfileUI() {

    if (!currentUser) {
        return;
    }


    const name =
        getDisplayName();


    const username =
        getUsername();


    if (usernameDisplay) {

        usernameDisplay.textContent =
            name;

    }


    if (avatar) {

        avatar.textContent =
            name.charAt(0).toUpperCase();

    }


    document.title =
        `PRESSURE // OFF — ${name}`;


    setupProfilePanel();

    updateProfilePanel();

}


/* =========================================================
   PROFILE PANEL
========================================================= */

function setupProfilePanel() {

    if ($("pressureProfilePanel")) {
        return;
    }


    const panel =
        document.createElement("div");

    panel.id =
        "pressureProfilePanel";

    panel.className =
        "pressure-profile-panel hidden";


    document.body.appendChild(panel);


    const userPill =
        document.querySelector(".user-pill");


    const avatarElement =
        $("avatar");


    if (userPill) {

        userPill.style.cursor =
            "pointer";

        userPill.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                toggleProfilePanel();

            }
        );

    } else if (avatarElement) {

        avatarElement.style.cursor =
            "pointer";

        avatarElement.addEventListener(
            "click",
            toggleProfilePanel
        );

    }


    panel.addEventListener(
        "click",
        event => {
            event.stopPropagation();
        }
    );


    document.addEventListener(
        "click",
        () => {

            panel.classList.add(
                "hidden"
            );

        }
    );

}


function updateProfilePanel() {

    const panel =
        $("pressureProfilePanel");


    if (!panel || !currentUser) {
        return;
    }


    const name =
        getDisplayName();

    const username =
        getUsername();

    const totalHours =
        currentTasks.reduce(
            (sum, task) =>
                sum +
                (Number(task.effort) || 0),
            0
        );


    panel.innerHTML = `

        <div class="profile-top">

            <div class="profile-big-avatar">
                ${escapeHtml(
                    name.charAt(0).toUpperCase()
                )}
            </div>

            <div>

                <div class="profile-name">
                    ${escapeHtml(name)}
                </div>

                <div class="profile-username">
                    @${escapeHtml(username)}
                </div>

            </div>

        </div>

        <div class="profile-stat-grid">

            <div class="profile-stat">
                <strong>
                    ${currentTasks.length}
                </strong>
                <span>
                    Tasks
                </span>
            </div>

            <div class="profile-stat">
                <strong>
                    ${formatHours(totalHours)}
                </strong>
                <span>
                    Planned
                </span>
            </div>

        </div>

        <div class="profile-email">
            ${escapeHtml(currentUser.email || "")}
        </div>

        <button
            type="button"
            class="profile-close"
            id="profileCloseButton"
        >
            Close
        </button>

    `;


    const close =
        $("profileCloseButton");


    if (close) {

        close.addEventListener(
            "click",
            () => {

                panel.classList.add(
                    "hidden"
                );

            }
        );

    }

}


function toggleProfilePanel() {

    const panel =
        $("pressureProfilePanel");


    if (!panel) {
        return;
    }


    updateProfilePanel();


    panel.classList.toggle(
        "hidden"
    );

}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    if (!currentUser) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("tasks")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("date", {
                    ascending: true
                });


        if (error) {

            console.error(
                "TASK LOAD ERROR:",
                error
            );

            currentTasks = [];

            return;
        }


        currentTasks =
            data || [];


    } catch (error) {

        console.error(
            "TASK LOAD CRASH:",
            error
        );

        currentTasks = [];

    }

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled = true;

            try {

                const {
                    error
                } =
                    await supabaseClient.auth.signOut();


                if (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                    alert(
                        "Could not log out: " +
                        error.message
                    );

                    return;
                }


                currentUser = null;
                currentProfile = null;
                currentTasks = [];
                editingTaskId = null;


                closeTaskModal();

                showAuth();

                if (authForm) {
                    authForm.reset();
                }

                setAuthMode("login");


            } catch (error) {

                console.error(
                    "LOGOUT CRASH:",
                    error
                );

                alert(
                    "Something went wrong while logging out."
                );

            } finally {

                logoutButton.disabled = false;

            }

        }
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getLocalDate(offset = 0) {

    const date =
        new Date();


    date.setHours(
        12,
        0,
        0,
        0
    );


    date.setDate(
        date.getDate() + offset
    );


    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


function getTaskDate(task) {

    return (
        task?.date ||
        task?.due_date ||
        ""
    );

}


function readableDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function readableShortDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short"
        }
    );

}


function getDayName(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString + "T00:00:00"
        );


    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long"
        }
    );

}


function daysUntil(dateString) {

    if (!dateString) {
        return 999;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const target =
        new Date(
            dateString + "T00:00:00"
        );


    target.setHours(
        0,
        0,
        0,
        0
    );


    return Math.round(
        (
            target.getTime() -
            today.getTime()
        ) /
        86400000
    );

}


function formatHours(value) {

    const number =
        Number(value) || 0;


    return `${number
        .toFixed(1)
        .replace(".0", "")}h`;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   WEEK DATA
========================================================= */

function getWeekData() {

    const week = [];


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            getLocalDate(i);


        const tasks =
            currentTasks.filter(
                task =>
                    getTaskDate(task) === date
            );


        const hours =
            tasks.reduce(
                (sum, task) =>
                    sum +
                    (Number(task.effort) || 0),
                0
            );


        week.push({
            date,
            tasks,
            hours
        });

    }


    return week;

}


/* =========================================================
   TASK PRESSURE
========================================================= */

function getTaskPressure(task) {

    const effort =
        Number(task.effort) || 0;


    const days =
        daysUntil(
            getTaskDate(task)
        );


    let score = 0;


    score +=
        Math.min(
            effort * 8,
            40
        );


    if (days < 0) {

        score += 60;

    } else if (days === 0) {

        score += 50;

    } else if (days === 1) {

        score += 42;

    } else if (days === 2) {

        score += 32;

    } else if (days <= 4) {

        score += 20;

    } else {

        score += 5;

    }


    return score;

}


/* =========================================================
   DAILY STATUS
========================================================= */

function getDayStatus(hours) {

    if (hours >= 5) {

        return {
            className: "overloaded",
            label: "Overloaded"
        };

    }


    if (hours >= 3) {

        return {
            className: "busy",
            label: "Busy"
        };

    }


    return {
        className: "manageable",
        label: "Manageable"
    };

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    renderScore();

    renderRadar();

    renderAlert();

    renderWeek();

    renderTasks();

    renderSuggestions();

    renderReminders();

    updateProfilePanel();

}


/* =========================================================
   PRESSURE SCORE
========================================================= */

function calculateWeeklyScore() {

    if (!currentTasks.length) {
        return 1;
    }


    const totalEffort =
        currentTasks.reduce(
            (sum, task) =>
                sum +
                (Number(task.effort) || 0),
            0
        );


    const urgentTasks =
        currentTasks.filter(
            task =>
                daysUntil(
                    getTaskDate(task)
                ) <= 2 &&
                daysUntil(
                    getTaskDate(task)
                ) >= 0
        ).length;


    const overdueTasks =
        currentTasks.filter(
            task =>
                daysUntil(
                    getTaskDate(task)
                ) < 0
        ).length;


    const overloadedDays =
        getWeekData().filter(
            day =>
                day.hours >= 5
        ).length;


    let score =
        1 +
        totalEffort * 0.55 +
        urgentTasks * 0.9 +
        overdueTasks * 1.5 +
        overloadedDays * 1.2;


    score =
        Math.round(score);


    return Math.max(
        1,
        Math.min(
            10,
            score
        )
    );

}


function renderScore() {

    const scoreElement =
        $("score");

    const scoreRing =
        $("scoreRing");

    const scoreLabel =
        $("scoreLabel");

    const totalHours =
        $("totalHours");


    const score =
        calculateWeeklyScore();


    const total =
        currentTasks.reduce(
            (sum, task) =>
                sum +
                (Number(task.effort) || 0),
            0
        );


    if (scoreElement) {
        scoreElement.textContent = score;
    }


    if (totalHours) {
        totalHours.textContent =
            `${formatHours(total)} planned`;
    }


    if (scoreLabel) {

        if (score <= 3) {

            scoreLabel.textContent =
                "Calm week";

        } else if (score <= 5) {

            scoreLabel.textContent =
                "Manageable";

        } else if (score <= 7) {

            scoreLabel.textContent =
                "Getting busy";

        } else {

            scoreLabel.textContent =
                "High pressure";

        }

    }


    if (scoreRing) {

        const percentage =
            score * 10;


        scoreRing.style.background =
            `conic-gradient(
                var(--blue) ${percentage}%,
                rgba(91,140,255,.08) ${percentage}%
            )`;

    }

}


/* =========================================================
   RADAR
========================================================= */

function renderRadar() {

    const container =
        $("radarBars");

    const empty =
        $("radarEmpty");


    if (!container) {
        return;
    }


    const week =
        getWeekData();


    container.innerHTML = "";


    if (empty) {

        empty.style.display =
            currentTasks.length
                ? "none"
                : "block";

    }


    if (!currentTasks.length) {
        return;
    }


    const maxHours =
        Math.max(
            ...week.map(
                day => day.hours
            ),
            1
        );


    week.forEach(
        day => {

            const column =
                document.createElement("div");


            column.className =
                "radar-column";


            const status =
                getDayStatus(
                    day.hours
                );


            const bar =
                document.createElement("div");


            bar.className =
                `radar-bar ${status.className}`;


            const height =
                Math.max(
                    5,
                    (
                        day.hours /
                        maxHours
                    ) * 100
                );


            bar.style.height =
                `${height}%`;


            const value =
                document.createElement("span");


            value.className =
                "radar-value";


            value.textContent =
                formatHours(day.hours);


            const dayLabel =
                document.createElement("span");


            dayLabel.className =
                "radar-day";


            dayLabel.textContent =
                new Date(
                    day.date +
                    "T00:00:00"
                )
                    .toLocaleDateString(
                        undefined,
                        {
                            weekday: "short"
                        }
                    );


            column.appendChild(value);

            column.appendChild(bar);

            column.appendChild(dayLabel);

            container.appendChild(column);

        }
    );

}


/* =========================================================
   ALERT
========================================================= */

function renderAlert() {

    const alertCard =
        $("alert");

    const alertTitle =
        $("alertTitle");

    const alertText =
        $("alertText");


    if (!alertCard) {
        return;
    }


    const week =
        getWeekData();


    const overloaded =
        week.filter(
            day =>
                day.hours >= 5
        );


    if (!overloaded.length) {

        alertCard.classList.add(
            "hidden"
        );

        return;

    }


    const worstDay =
        [...overloaded].sort(
            (a, b) =>
                b.hours - a.hours
        )[0];


    const dayName =
        getDayName(
            worstDay.date
        );


    alertCard.classList.remove(
        "hidden"
    );


    if (alertTitle) {

        alertTitle.textContent =
            `${dayName} looks overloaded.`;

    }


    if (alertText) {

        alertText.textContent =
            `${formatHours(
                worstDay.hours
            )} are planned. Consider starting one of these tasks earlier.`;

    }

}


/* =========================================================
   WEEK
========================================================= */

function renderWeek() {

    const container =
        $("weekGrid");


    if (!container) {
        return;
    }


    const week =
        getWeekData();


    container.innerHTML = "";


    week.forEach(
        day => {

            const status =
                getDayStatus(
                    day.hours
                );


            const element =
                document.createElement("div");


            element.className =
                `day ${status.className}`;


            const date =
                new Date(
                    day.date +
                    "T00:00:00"
                );


            const dayName =
                date.toLocaleDateString(
                    undefined,
                    {
                        weekday: "short"
                    }
                );


            element.innerHTML = `

                <div class="day-header">

                    <span class="day-name">
                        ${dayName}
                    </span>

                    <span class="day-number">
                        ${date.getDate()}
                    </span>

                </div>

                <div class="day-status">

                    <span class="status-dot"></span>

                    ${status.label}

                </div>

                <div class="day-tasks">

                    ${
                        day.tasks.length
                            ? day.tasks.map(
                                task => `

                                    <button
                                        type="button"
                                        class="mini-task"
                                        data-task-id="${task.id}"
                                    >

                                        <span class="mini-dot"></span>

                                        <span>

                                            <strong>
                                                ${escapeHtml(
                                                    task.name
                                                )}
                                            </strong>

                                            <small>
                                                ${formatHours(
                                                    task.effort
                                                )}
                                            </small>

                                        </span>

                                    </button>

                                `
                            ).join("")
                            : `
                                <span class="empty-day">
                                    No tasks
                                </span>
                            `
                    }

                </div>

                <div class="day-hours">

                    ${
                        day.hours > 0
                            ? `${formatHours(day.hours)} planned`
                            : "Free"
                    }

                </div>

            `;


            element
                .querySelectorAll(".mini-task")
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            event => {

                                event.stopPropagation();

                                openEditTask(
                                    button.dataset.taskId
                                );

                            }
                        );

                    }
                );


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   TASK ICON
========================================================= */

function getCategoryIcon(category) {

    const icons = {

        Test: "T",
        Homework: "H",
        Project: "P",
        Assignment: "A",
        Tuition: "U",
        Other: "•"

    };


    return icons[category] || "•";

}


/* =========================================================
   TASK LIST
========================================================= */

function renderTasks() {

    const container =
        $("taskList");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!currentTasks.length) {

        container.innerHTML = `

            <div class="empty-tasks">

                No tasks yet.

                <br>

                Add your first task to start seeing your workload.

            </div>

        `;

        return;

    }


    const sortedTasks =
        [...currentTasks].sort(
            (a, b) =>
                new Date(
                    getTaskDate(a)
                ) -
                new Date(
                    getTaskDate(b)
                )
        );


    sortedTasks.forEach(
        task => {

            const row =
                document.createElement("div");


            row.className =
                "task-row";


            const date =
                getTaskDate(task);


            const days =
                daysUntil(date);


            let deadlineText;


            if (days < 0) {

                deadlineText =
                    "Overdue";

            } else if (days === 0) {

                deadlineText =
                    "Due today";

            } else if (days === 1) {

                deadlineText =
                    "Due tomorrow";

            } else {

                deadlineText =
                    `Due ${readableShortDate(date)}`;

            }


            row.innerHTML = `

                <span class="task-icon">

                    ${getCategoryIcon(
                        task.category
                    )}

                </span>

                <span class="task-info">

                    <strong>
                        ${escapeHtml(
                            task.name
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            task.category || "Other"
                        )}
                        ·
                        ${deadlineText}
                    </small>

                </span>

                <span class="effort">
                    ${formatHours(task.effort)}
                </span>

                <span class="task-actions">

                    <button
                        type="button"
                        class="task-action edit"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="task-action delete"
                    >
                        Delete
                    </button>

                </span>

            `;


            const editButton =
                row.querySelector(".edit");


            const deleteButton =
                row.querySelector(".delete");


            editButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openEditTask(
                        task.id
                    );

                }
            );


            deleteButton.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();

                    await deleteTask(
                        task.id
                    );

                }
            );


            row.addEventListener(
                "click",
                () => {

                    openEditTask(
                        task.id
                    );

                }
            );


            container.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   SUGGESTIONS
========================================================= */

function renderSuggestions() {

    const container =
        $("suggestions");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const suggestions = [];


    if (!currentTasks.length) {

        suggestions.push({
            title: "Add your first task",
            text:
                "Add homework, tests, projects or assignments and I'll start analysing your workload."
        });

    } else {

        const overdue =
            currentTasks.filter(
                task =>
                    daysUntil(
                        getTaskDate(task)
                    ) < 0
            );


        const urgent =
            [...currentTasks]
                .filter(
                    task => {

                        const days =
                            daysUntil(
                                getTaskDate(task)
                            );

                        return (
                            days >= 0 &&
                            days <= 2
                        );

                    }
                )
                .sort(
                    (a, b) =>
                        getTaskPressure(b) -
                        getTaskPressure(a)
                );


        const week =
            getWeekData();


        const busiestDay =
            [...week].sort(
                (a, b) =>
                    b.hours - a.hours
            )[0];


        const largestTask =
            [...currentTasks].sort(
                (a, b) =>
                    (Number(b.effort) || 0) -
                    (Number(a.effort) || 0)
            )[0];


        if (overdue.length) {

            suggestions.push({
                title: "Clear overdue work",
                text:
                    `"${overdue[0].name}" is overdue. Put it ahead of non-urgent work.`
            });

        }


        if (urgent.length) {

            suggestions.push({
                title: "Protect your deadline",
                text:
                    `Start "${urgent[0].name}" soon because its deadline is close.`
            });

        }


        if (
            busiestDay &&
            busiestDay.hours >= 3
        ) {

            suggestions.push({
                title: "Watch your busiest day",
                text:
                    `${getDayName(
                        busiestDay.date
                    )} has ${formatHours(
                        busiestDay.hours
                    )} planned. Move preparation earlier if possible.`
            });

        }


        if (
            largestTask &&
            Number(largestTask.effort) >= 2
        ) {

            suggestions.push({
                title: "Split the big task",
                text:
                    `"${largestTask.name}" is ${formatHours(
                        largestTask.effort
                    )}. Break it into smaller sessions.`
            });

        }


        suggestions.push({
            title: "Use focused sessions",
            text:
                "Finish one high-priority task before jumping between several smaller ones."
        });

    }


    suggestions
        .slice(0, 4)
        .forEach(
            (suggestion, index) => {

                const element =
                    document.createElement("div");


                element.className =
                    "suggestion";


                element.innerHTML = `

                    <span class="suggestion-number">
                        ${index + 1}
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                suggestion.title
                            )}
                        </strong>

                        <p>
                            ${escapeHtml(
                                suggestion.text
                            )}
                        </p>

                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


/* =========================================================
   SMART REMINDERS
========================================================= */

function renderReminders() {

    const container =
        $("reminderList");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!currentTasks.length) {

        container.innerHTML = `

            <div class="no-reminders">

                No reminders yet.

                <br>

                Add tasks with upcoming deadlines.

            </div>

        `;

        return;
    }


    const reminders =
        [...currentTasks]
            .filter(
                task =>
                    daysUntil(
                        getTaskDate(task)
                    ) <= 3
            )
            .sort(
                (a, b) =>
                    daysUntil(
                        getTaskDate(a)
                    ) -
                    daysUntil(
                        getTaskDate(b)
                    )
            );


    if (!reminders.length) {

        container.innerHTML = `

            <div class="no-reminders">

                You're clear for the next few days.

                <br>

                No urgent deadlines detected.

            </div>

        `;

        return;

    }


    reminders
        .slice(0, 5)
        .forEach(
            task => {

                const element =
                    document.createElement("div");


                element.className =
                    "reminder";


                const days =
                    daysUntil(
                        getTaskDate(task)
                    );


                let description;


                if (days < 0) {

                    description =
                        "This task is overdue. Move it to the top of your list.";

                } else if (days === 0) {

                    description =
                        "Due today — consider working on it now.";

                } else if (days === 1) {

                    description =
                        "Due tomorrow — don't leave it until the last minute.";

                } else {

                    description =
                        `Due in ${days} days. A small session today could reduce pressure later.`;

                }


                element.innerHTML = `

                    <span class="reminder-icon">
                        🔔
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(
                                task.name
                            )}
                        </strong>

                        <p>
                            ${escapeHtml(
                                description
                            )}
                        </p>

                    </div>

                `;


                container.appendChild(
                    element
                );

            }
        );

}


/* =========================================================
   ADD TASK
========================================================= */

function openAddTask() {

    editingTaskId = null;


    if (taskForm) {
        taskForm.reset();
    }


    if (taskCategory) {
        taskCategory.value =
            "Homework";
    }


    if (taskEffort) {
        taskEffort.value =
            "1";
    }


    if (taskDate) {
        taskDate.value =
            getLocalDate(0);
    }


    if (modalTitle) {
        modalTitle.textContent =
            "Add a task";
    }


    if (saveTaskButton) {
        saveTaskButton.textContent =
            "Add Task";
    }


    if (deleteTaskButton) {
        deleteTaskButton.classList.add(
            "hidden"
        );
    }


    if (taskModal) {
        taskModal.classList.remove(
            "hidden"
        );
    }

}


function openEditTask(id) {

    const task =
        currentTasks.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!task) {
        return;
    }


    editingTaskId =
        task.id;


    if (taskName) {
        taskName.value =
            task.name || "";
    }


    if (taskCategory) {
        taskCategory.value =
            task.category || "Homework";
    }


    if (taskEffort) {
        taskEffort.value =
            task.effort || 1;
    }


    if (taskDate) {
        taskDate.value =
            getTaskDate(task);
    }


    if (modalTitle) {
        modalTitle.textContent =
            "Edit task";
    }


    if (saveTaskButton) {
        saveTaskButton.textContent =
            "Save changes";
    }


    if (deleteTaskButton) {
        deleteTaskButton.classList.remove(
            "hidden"
        );
    }


    if (taskModal) {
        taskModal.classList.remove(
            "hidden"
        );
    }

}


/* Make inline HTML onclick work. */

window.openAddTask =
    openAddTask;

window.openEditTask =
    openEditTask;


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTaskModal() {

    if (taskModal) {

        taskModal.classList.add(
            "hidden"
        );

    }


    editingTaskId =
        null;

}


window.closeTaskModal =
    closeTaskModal;


if (addTaskTop) {

    addTaskTop.addEventListener(
        "click",
        openAddTask
    );

}


if (addTaskButton) {

    addTaskButton.addEventListener(
        "click",
        openAddTask
    );

}


if (closeModalButton) {

    closeModalButton.addEventListener(
        "click",
        closeTaskModal
    );

}


if (cancelModalButton) {

    cancelModalButton.addEventListener(
        "click",
        closeTaskModal
    );

}


if (taskModal) {

    taskModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                taskModal
            ) {

                closeTaskModal();

            }

        }
    );

}


/* =========================================================
   SAVE TASK
========================================================= */

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                taskName
                    ? taskName.value.trim()
                    : "";


            const category =
                taskCategory
                    ? taskCategory.value
                    : "Other";


            const effort =
                taskEffort
                    ? Number(taskEffort.value)
                    : 0;


            const date =
                taskDate
                    ? taskDate.value
                    : "";


            if (!name) {

                alert(
                    "Please enter a task name."
                );

                return;

            }


            if (!date) {

                alert(
                    "Please select a due date."
                );

                return;

            }


            if (
                !effort ||
                effort <= 0
            ) {

                alert(
                    "Please enter a valid effort."
                );

                return;

            }


            if (!currentUser) {

                alert(
                    "Please log in again."
                );

                return;

            }


            if (saveTaskButton) {
                saveTaskButton.disabled = true;
            }


            try {

                /* =================================================
                   UPDATE
                ================================================= */

                if (editingTaskId !== null) {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("tasks")
                            .update({

                                name,

                                category,

                                effort,

                                date,

                                due_date: date

                            })
                            .eq(
                                "id",
                                editingTaskId
                            )
                            .eq(
                                "user_id",
                                currentUser.id
                            )
                            .select()
                            .single();


                    if (error) {

                        console.error(
                            "TASK UPDATE ERROR:",
                            error
                        );

                        alert(
                            "Could not update task: " +
                            error.message
                        );

                        return;

                    }


                    const index =
                        currentTasks.findIndex(
                            task =>
                                String(task.id) ===
                                String(editingTaskId)
                        );


                    if (index !== -1) {

                        currentTasks[index] =
                            data;

                    }

                }

                /* =================================================
                   CREATE
                ================================================= */

                else {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("tasks")
                            .insert([{

                                user_id:
                                    currentUser.id,

                                name,

                                category,

                                effort,

                                date,

                                due_date:
                                    date

                            }])
                            .select()
                            .single();


                    if (error) {

                        console.error(
                            "TASK INSERT ERROR:",
                            error
                        );

                        alert(
                            "Could not create task: " +
                            error.message
                        );

                        return;

                    }


                    currentTasks.push(
                        data
                    );

                }


                closeTaskModal();

                renderDashboard();


            } catch (error) {

                console.error(
                    "SAVE TASK CRASH:",
                    error
                );

                alert(
                    "Something went wrong while saving the task."
                );

            } finally {

                if (saveTaskButton) {
                    saveTaskButton.disabled = false;
                }

            }

        }
    );

}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(id) {

    if (!currentUser) {
        return;
    }


    const task =
        currentTasks.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!task) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${task.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("tasks")
                .delete()
                .eq("id", id)
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "DELETE ERROR:",
                error
            );

            alert(
                "Could not delete task: " +
                error.message
            );

            return;
        }


        currentTasks =
            currentTasks.filter(
                item =>
                    String(item.id) !==
                    String(id)
            );


        closeTaskModal();

        renderDashboard();


    } catch (error) {

        console.error(
            "DELETE CRASH:",
            error
        );

        alert(
            "Something went wrong while deleting the task."
        );

    }

}


window.deleteTask =
    deleteTask;


if (deleteTaskButton) {

    deleteTaskButton.addEventListener(
        "click",
        async () => {

            if (
                editingTaskId !== null
            ) {

                await deleteTask(
                    editingTaskId
                );

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function enableNotifications() {

    if (
        !("Notification" in window)
    ) {

        alert(
            "Your browser does not support notifications."
        );

        return;

    }


    try {

        const permission =
            await Notification.requestPermission();


        if (
            permission ===
            "granted"
        ) {

            localStorage.setItem(
                "pressureNotifications",
                "enabled"
            );


            updateNotificationButtons();

            sendReminderNotification();


        } else {

            alert(
                "Notifications were not enabled. Check your browser permissions."
            );

        }

    } catch (error) {

        console.error(
            "NOTIFICATION ERROR:",
            error
        );

    }

}


function updateNotificationButtons() {

    const enabled =
        localStorage.getItem(
            "pressureNotifications"
        ) === "enabled";


    if (notificationButton) {

        notificationButton.title =
            enabled
                ? "Reminders enabled"
                : "Enable reminders";

    }


    if (notificationButton2) {

        notificationButton2.textContent =
            enabled
                ? "Enabled"
                : "Enable";

    }

}


function sendReminderNotification() {

    if (
        !("Notification" in window)
    ) {
        return;
    }


    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }


    const urgent =
        [...currentTasks]
            .filter(
                task =>
                    daysUntil(
                        getTaskDate(task)
                    ) >= 0 &&
                    daysUntil(
                        getTaskDate(task)
                    ) <= 1
            )
            .sort(
                (a, b) =>
                    getTaskPressure(b) -
                    getTaskPressure(a)
            );


    if (!urgent.length) {
        return;
    }


    const task =
        urgent[0];


    const days =
        daysUntil(
            getTaskDate(task)
        );


    const body =
        days === 0
            ? `"${task.name}" is due today.`
            : `"${task.name}" is due tomorrow.`;


    new Notification(
        "PRESSURE // OFF",
        {
            body
        }
    );

}


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        enableNotifications
    );

}


if (notificationButton2) {

    notificationButton2.addEventListener(
        "click",
        enableNotifications
    );

}


/* =========================================================
   AI ASSISTANT
========================================================= */

function addAIMessage(
    message,
    type = "assistant"
) {

    if (!aiMessages) {
        return;
    }


    const element =
        document.createElement("div");


    element.className =
        `ai-message ${type}`;


    if (type === "assistant") {

        element.innerHTML = `

            <span class="message-icon">
                ✦
            </span>

            <p>
                ${escapeHtml(message)}
            </p>

        `;

    } else {

        element.innerHTML = `

            <p>
                ${escapeHtml(message)}
            </p>

        `;

    }


    aiMessages.appendChild(
        element
    );


    aiMessages.scrollTop =
        aiMessages.scrollHeight;

}


/* =========================================================
   AI ANALYSIS
========================================================= */

function analyseWorkload() {

    const totalHours =
        currentTasks.reduce(
            (sum, task) =>
                sum +
                (Number(task.effort) || 0),
            0
        );


    const week =
        getWeekData();


    const busiestDay =
        [...week].sort(
            (a, b) =>
                b.hours - a.hours
        )[0];


    const overdue =
        currentTasks.filter(
            task =>
                daysUntil(
                    getTaskDate(task)
                ) < 0
        );


    const urgent =
        currentTasks.filter(
            task => {

                const days =
                    daysUntil(
                        getTaskDate(task)
                    );

                return (
                    days >= 0 &&
                    days <= 2
                );

            }
        );


    const nextTask =
        [...currentTasks]
            .filter(
                task =>
                    daysUntil(
                        getTaskDate(task)
                    ) >= 0
            )
            .sort(
                (a, b) =>
                    getTaskPressure(b) -
                    getTaskPressure(a)
            )[0];


    return {

        totalHours,

        busiestDay,

        overdue,

        urgent,

        nextTask,

        week

    };

}


/* =========================================================
   AI RESPONSE
========================================================= */

function generateAIResponse(question) {

    const q =
        question
            .toLowerCase()
            .trim();


    const analysis =
        analyseWorkload();


    if (!currentTasks.length) {

        return (
            "You don't have any tasks yet. " +
            "Add your homework, tests, projects or assignments and I'll analyse your deadlines, effort and busy days."
        );

    }


    /* =====================================================
       TODAY / NOW
    ===================================================== */

    if (
        q.includes("today") ||
        q.includes("now") ||
        q.includes("start")
    ) {

        const todayTasks =
            currentTasks
                .filter(
                    task =>
                        daysUntil(
                            getTaskDate(task)
                        ) === 0
                )
                .sort(
                    (a, b) =>
                        getTaskPressure(b) -
                        getTaskPressure(a)
                );


        if (todayTasks.length) {

            const top =
                todayTasks[0];


            return (
                `Start with "${top.name}". ` +
                `It is due today and needs about ${formatHours(top.effort)}. ` +
                `Finish this before moving to lower-pressure work.`
            );

        }


        if (analysis.nextTask) {

            const task =
                analysis.nextTask;


            return (
                `I'd start with "${task.name}". ` +
                `It is due ${readableDate(
                    getTaskDate(task)
                )} and needs about ${formatHours(task.effort)}. ` +
                `Starting it now should reduce future pressure.`
            );

        }

    }


    /* =====================================================
       PRIORITY
    ===================================================== */

    if (
        q.includes("priority") ||
        q.includes("priorit") ||
        q.includes("important") ||
        q.includes("first")
    ) {

        const task =
            analysis.nextTask;


        if (task) {

            const days =
                daysUntil(
                    getTaskDate(task)
                );


            const remaining =
                days < 0
                    ? "overdue"
                    : days === 0
                        ? "today"
                        : `${days} day(s)`;


            return (
                `Your highest-priority task is "${task.name}". ` +
                `It is due ${readableDate(
                    getTaskDate(task)
                )}, needs about ${formatHours(task.effort)}, ` +
                `and has ${remaining} remaining. ` +
                `I'd tackle this before lower-pressure tasks.`
            );

        }

    }


    /* =====================================================
       HARDEST / BUSIEST DAY
    ===================================================== */

    if (
        q.includes("hardest") ||
        q.includes("busiest") ||
        q.includes("worst day") ||
        q.includes("difficult day")
    ) {

        const day =
            analysis.busiestDay;


        if (day) {

            const taskNames =
                day.tasks.length
                    ? day.tasks
                        .map(
                            task =>
                                task.name
                        )
                        .join(", ")
                    : "No tasks";


            return (
                `Your busiest day is ${getDayName(
                    day.date
                )}. ` +
                `You have ${formatHours(
                    day.hours
                )} planned. ` +
                `The tasks are: ${taskNames}. ` +
                `I'd prepare for at least one of them earlier.`
            );

        }

    }


    /* =====================================================
       PRESSURE / STRESS
    ===================================================== */

    if (
        q.includes("pressure") ||
        q.includes("stress") ||
        q.includes("overwhelm") ||
        q.includes("overloaded") ||
        q.includes("reduce")
    ) {

        const overloaded =
            analysis.week.filter(
                day =>
                    day.hours >= 5
            );


        if (overloaded.length) {

            const worst =
                [...overloaded].sort(
                    (a, b) =>
                        b.hours - a.hours
                )[0];


            const moveTask =
                [...worst.tasks].sort(
                    (a, b) =>
                        (Number(b.effort) || 0) -
                        (Number(a.effort) || 0)
                )[0];


            return (
                `${getDayName(
                    worst.date
                )} is your main pressure point with ${formatHours(
                    worst.hours
                )} planned. ` +
                `I'd start "${moveTask.name}" before that day so you don't have to do everything at once.`
            );

        }


        return (
            "Your workload doesn't currently show a major overload. " +
            "Keep it that way by starting high-effort tasks early and avoiding several deadlines on the same day."
        );

    }


    /* =====================================================
       DEADLINES
    ===================================================== */

    if (
        q.includes("deadline") ||
        q.includes("due") ||
        q.includes("coming up")
    ) {

        if (analysis.urgent.length) {

            const urgent =
                [...analysis.urgent].sort(
                    (a, b) =>
                        getTaskPressure(b) -
                        getTaskPressure(a)
                )[0];


            return (
                `The most urgent deadline is "${urgent.name}". ` +
                `It is due ${readableDate(
                    getTaskDate(urgent)
                )} and needs about ${formatHours(
                    urgent.effort
                )}.`
            );

        }


        if (analysis.nextTask) {

            return (
                `Your next major deadline is "${analysis.nextTask.name}" ` +
                `on ${readableDate(
                    getTaskDate(analysis.nextTask)
                )}.`
            );

        }

    }


    /* =====================================================
       HOURS / WORKLOAD
    ===================================================== */

    if (
        q.includes("how many hours") ||
        q.includes("hours") ||
        q.includes("workload")
    ) {

        return (
            `You currently have ${formatHours(
                analysis.totalHours
            )} planned across ${currentTasks.length} task(s). ` +
            `Your busiest day is ${
                analysis.busiestDay
                    ? getDayName(
                        analysis.busiestDay.date
                    )
                    : "not clear yet"
            }, and you have ${analysis.urgent.length} urgent task(s).`
        );

    }


    /* =====================================================
       PLAN
    ===================================================== */

    if (
        q.includes("plan") ||
        q.includes("schedule") ||
        q.includes("organize") ||
        q.includes("organise")
    ) {

        const ordered =
            [...currentTasks]
                .sort(
                    (a, b) =>
                        getTaskPressure(b) -
                        getTaskPressure(a)
                )
                .slice(0, 4);


        const names =
            ordered
                .map(
                    (task, index) =>
                        `${index + 1}. ${task.name}`
                )
                .join("\n");


        return (
            `Here's the order I'd use:\n\n` +
            `${names}\n\n` +
            `Do the highest-pressure task first, then use lighter tasks to fill gaps. ` +
            `Your total planned workload is ${formatHours(
                analysis.totalHours
            )}.`
        );

    }


    /* =====================================================
       OVERDUE
    ===================================================== */

    if (
        q.includes("overdue") ||
        q.includes("late")
    ) {

        if (analysis.overdue.length) {

            return (
                `You have ${analysis.overdue.length} overdue task(s). ` +
                `The first one I'd clear is "${analysis.overdue[0].name}". ` +
                `Don't let overdue work compete with too many new tasks.`
            );

        }


        return (
            "Good news — you don't currently have any overdue tasks."
        );

    }


    /* =====================================================
       GENERAL
    ===================================================== */

    return (
        `I've analysed your workload:\n\n` +
        `• ${currentTasks.length} task(s)\n` +
        `• ${formatHours(
            analysis.totalHours
        )} planned\n` +
        `• ${analysis.urgent.length} urgent task(s)\n` +
        `• ${analysis.overdue.length} overdue task(s)\n` +
        `• Busiest day: ${
            analysis.busiestDay
                ? getDayName(
                    analysis.busiestDay.date
                )
                : "none"
        }\n\n` +
        `Try asking me "What should I work on today?", ` +
        `"Which day is hardest?", ` +
        `"How can I reduce my pressure?", ` +
        `or "Plan my week".`
    );

}


/* =========================================================
   AI FORM
========================================================= */

if (aiForm) {

    aiForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const question =
                aiInput
                    ? aiInput.value.trim()
                    : "";


            if (!question) {
                return;
            }


            addAIMessage(
                question,
                "user"
            );


            if (aiInput) {
                aiInput.value = "";
            }


            setTimeout(
                () => {

                    const response =
                        generateAIResponse(
                            question
                        );


                    addAIMessage(
                        response,
                        "assistant"
                    );

                },
                250
            );

        }
    );

}


/* =========================================================
   QUICK PROMPTS
========================================================= */

document
    .querySelectorAll(
        ".quick-prompts button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const question =
                        button.dataset.prompt;


                    if (!question) {
                        return;
                    }


                    addAIMessage(
                        question,
                        "user"
                    );


                    setTimeout(
                        () => {

                            addAIMessage(
                                generateAIResponse(
                                    question
                                ),
                                "assistant"
                            );

                        },
                        250
                    );

                }
            );

        }
    );


/* =========================================================
   SESSION
========================================================= */

async function checkSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            showAuth();

            return;

        }


        if (
            data &&
            data.session
        ) {

            currentUser =
                data.session.user;


            await finishAuthentication();

        } else {

            showAuth();

        }

    } catch (error) {

        console.error(
            "SESSION CRASH:",
            error
        );

        showAuth();

    }

}


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (
            event ===
            "SIGNED_OUT"
        ) {

            currentUser = null;

            currentProfile = null;

            currentTasks = [];

            showAuth();

        }


        if (
            event ===
                "SIGNED_IN" &&
            session
        ) {

            currentUser =
                session.user;

        }

    }
);


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeTaskModal();

            const profilePanel =
                $("pressureProfilePanel");


            if (profilePanel) {

                profilePanel.classList.add(
                    "hidden"
                );

            }

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

injectExtraStyles();

setAuthMode("login");

updateNotificationButtons();

checkSession();
