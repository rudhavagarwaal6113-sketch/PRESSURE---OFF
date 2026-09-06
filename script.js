/* =========================================================
   SUPABASE SETUP
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
   DOM ELEMENTS
========================================================= */

const authScreen = document.getElementById("authScreen");
const app = document.getElementById("app");

const authForm = document.getElementById("authForm");

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const authName = document.getElementById("authName");
const nameField = document.getElementById("nameField");

const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");

const authButton = document.getElementById("authButton");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const authError = document.getElementById("authError");

const logoutButton =
    document.getElementById("logoutButton");

const taskForm =
    document.getElementById("taskForm");

const taskName =
    document.getElementById("taskName");

const taskCategory =
    document.getElementById("taskCategory");

const taskEffort =
    document.getElementById("taskEffort");

const taskDate =
    document.getElementById("taskDate");

const taskModal =
    document.getElementById("taskModal");

const modalTitle =
    document.getElementById("modalTitle");

const saveTask =
    document.getElementById("saveTask");

const deleteTaskButton =
    document.getElementById("deleteTask");

const closeModalButton =
    document.getElementById("closeModal");

const cancelModalButton =
    document.getElementById("cancelModal");


/* =========================================================
   USERNAME → INTERNAL EMAIL
========================================================= */

function usernameToEmail(username) {

    return `${username}@pressure-off.internal`;

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(message = "") {

    if (authError) {

        authError.textContent = message;

    }

}


/* =========================================================
   AUTH MODE
========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    showAuthMessage("");

    if (mode === "login") {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        nameField.classList.add("hidden");

        authTitle.textContent =
            "Welcome back";

        authSubtitle.textContent =
            "See the pressure before it piles up.";

        authButton.textContent =
            "Log in";

    } else {

        signupTab.classList.add("active");
        loginTab.classList.remove("active");

        nameField.classList.remove("hidden");

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Start understanding your workload.";

        authButton.textContent =
            "Create account";

    }

}


loginTab.addEventListener(
    "click",
    () => setAuthMode("login")
);


signupTab.addEventListener(
    "click",
    () => setAuthMode("signup")
);


/* =========================================================
   SHOW APP / AUTH
========================================================= */

function showApp() {

    authScreen.classList.add("hidden");
    app.classList.remove("hidden");

}


function showAuth() {

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (!currentUser)
        return;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        return;

    }


    currentProfile = data;

    updateProfileUI();

}


function updateProfileUI() {

    const usernameElement =
        document.getElementById("username");

    const avatarElement =
        document.getElementById("avatar");


    let name =
        currentProfile?.username ||
        currentProfile?.name ||
        currentUser?.email?.split("@")[0] ||
        "Student";


    if (usernameElement) {

        usernameElement.textContent = name;

    }


    if (avatarElement) {

        avatarElement.textContent =
            name.charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   LOAD TASKS
========================================================= */

async function loadTasks() {

    if (!currentUser)
        return;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("tasks")
            .select("*")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "due_date",
                {
                    ascending: true
                }
            );


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

}


/* =========================================================
   AUTH
========================================================= */

authForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const username =
            authUsername.value
                .trim()
                .toLowerCase();

        const password =
            authPassword.value;


        if (!username || !password) {

            showAuthMessage(
                "Please enter your username and password."
            );

            return;

        }


        authButton.disabled = true;


        /* =========================
           SIGN UP
        ========================= */

        if (authMode === "signup") {

            const name =
                authName.value.trim();

            if (!name) {

                showAuthMessage(
                    "Please enter your name."
                );

                authButton.disabled = false;

                return;

            }


            try {

                const email =
                    usernameToEmail(username);


                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signUp({

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

                    showAuthMessage(
                        error.message
                    );

                    return;

                }


                if (!data.user) {

                    showAuthMessage(
                        "Account could not be created."
                    );

                    return;

                }


                currentUser =
                    data.user;


                await loadProfile();

                /*
                   If your database trigger
                   creates the profile,
                   loadProfile will get it.

                   If not, create it here.
                */

                if (!currentProfile) {

                    const {
                        error: profileError
                    } =
                        await supabaseClient
                            .from("profiles")
                            .insert({

                                id:
                                    currentUser.id,

                                username,

                                name

                            });


                    if (profileError) {

                        console.error(
                            profileError
                        );

                    }

                }


                await loadProfile();

                await loadTasks();

                showApp();

                renderDashboard();


            } catch (error) {

                console.error(error);

                showAuthMessage(
                    "Something went wrong while creating the account."
                );

            } finally {

                authButton.disabled = false;

            }


            return;

        }


        /* =========================
           LOGIN
        ========================= */

        try {

            const {
                data: loginEmail,
                error: rpcError
            } =
                await supabaseClient.rpc(
                    "get_login_email",
                    {
                        login_username:
                            username
                    }
                );


            if (rpcError) {

                console.error(rpcError);

                showAuthMessage(
                    "Login failed. Please try again."
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
                await supabaseClient
                    .auth
                    .signInWithPassword({

                        email:
                            loginEmail,

                        password

                    });


            if (error) {

                showAuthMessage(
                    error.message
                );

                return;

            }


            currentUser =
                data.user;


            await loadProfile();

            await loadTasks();


            showApp();

            renderDashboard();


        } catch (error) {

            console.error(error);

            showAuthMessage(
                "Something went wrong while logging in."
            );

        } finally {

            authButton.disabled = false;

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient
            .auth
            .signOut();


        currentUser = null;

        currentProfile = null;

        currentTasks = [];


        authPassword.value = "";

        showAuth();

    }
);


/* =========================================================
   DATE HELPERS
========================================================= */

function formatDateInput(date) {

    return date
        .toISOString()
        .split("T")[0];

}


function readableDate(dateString) {

    if (!dateString)
        return "";

    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        undefined,
        {

            weekday: "short",

            day: "numeric",

            month: "short"

        }
    );

}


function daysUntil(dateString) {

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
            `${dateString}T00:00:00`
        );


    return Math.round(
        (
            target - today
        ) /
        86400000
    );

}


/* =========================================================
   GET DATE FROM TASK
========================================================= */

function getTaskDate(task) {

    return task.due_date ||
           task.date;

}


/* =========================================================
   OPEN ADD TASK
========================================================= */

function openAddTask() {

    editingTaskId = null;

    taskForm.reset();


    modalTitle.textContent =
        "Add a task";

    saveTask.textContent =
        "Add Task";


    deleteTaskButton
        .classList
        .add("hidden");


    taskCategory.value =
        "Homework";

    taskEffort.value =
        "1";


    taskDate.value =
        formatDateInput(
            new Date()
        );


    taskModal
        .classList
        .remove("hidden");

}


/* =========================================================
   OPEN EDIT TASK
========================================================= */

function openEditTask(id) {

    const task =
        currentTasks.find(
            task =>
                task.id === id
        );


    if (!task)
        return;


    editingTaskId = id;


    modalTitle.textContent =
        "Edit task";

    saveTask.textContent =
        "Save changes";


    deleteTaskButton
        .classList
        .remove("hidden");


    taskName.value =
        task.name || "";

    taskCategory.value =
        task.category || "Other";

    taskEffort.value =
        task.effort || 1;

    taskDate.value =
        getTaskDate(task);


    taskModal
        .classList
        .remove("hidden");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeTaskModal() {

    taskModal
        .classList
        .add("hidden");


    editingTaskId = null;

}


/* =========================================================
   SAVE TASK
========================================================= */

taskForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            taskName.value.trim();

        const category =
            taskCategory.value;

        const effort =
            Number(
                taskEffort.value
            );

        const due_date =
            taskDate.value;


        if (
            !name ||
            !due_date ||
            !effort
        ) {

            alert(
                "Please complete all task fields."
            );

            return;

        }


        saveTask.disabled = true;


        try {

            const taskData = {

                name,

                category,

                effort,

                due_date

            };


            /* =========================
               EDIT
            ========================= */

            if (editingTaskId) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("tasks")
                        .update(taskData)
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


                if (error)
                    throw error;


                const index =
                    currentTasks.findIndex(
                        task =>
                            task.id ===
                            editingTaskId
                    );


                if (index !== -1) {

                    currentTasks[index] =
                        data;

                }


            }


            /* =========================
               CREATE
            ========================= */

            else {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("tasks")
                        .insert({

                            user_id:
                                currentUser.id,

                            name,

                            category,

                            effort,

                            due_date

                        })
                        .select()
                        .single();


                if (error)
                    throw error;


                currentTasks.push(
                    data
                );

            }


            closeTaskModal();

            renderDashboard();


        } catch (error) {

            console.error(
                "TASK SAVE ERROR:",
                error
            );

            alert(
                "Task error: " +
                error.message
            );

        } finally {

            saveTask.disabled = false;

        }

    }
);


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(id) {

    if (!currentUser)
        return;


    const confirmed =
        confirm(
            "Delete this task permanently?"
        );


    if (!confirmed)
        return;


    const {
        error
    } =
        await supabaseClient
            .from("tasks")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        alert(
            "Could not delete task: " +
            error.message
        );

        return;

    }


    currentTasks =
        currentTasks.filter(
            task =>
                task.id !== id
        );


    closeTaskModal();

    renderDashboard();

}


/* =========================================================
   MODAL BUTTONS
========================================================= */

document
    .getElementById("addTaskTop")
    .addEventListener(
        "click",
        openAddTask
    );


document
    .getElementById("addTaskButton")
    .addEventListener(
        "click",
        openAddTask
    );


closeModalButton.addEventListener(
    "click",
    closeTaskModal
);


cancelModalButton.addEventListener(
    "click",
    closeTaskModal
);


deleteTaskButton.addEventListener(
    "click",
    () => {

        if (editingTaskId) {

            deleteTask(
                editingTaskId
            );

        }

    }
);


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


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    renderPressureScore();

    renderRadar();

    renderAlert();

    renderWeek();

    renderTasks();

    renderSuggestions();

    renderReminders();

}


/* =========================================================
   PRESSURE SCORE
========================================================= */

function renderPressureScore() {

    const scoreElement =
        document.getElementById("score");

    const totalHoursElement =
        document.getElementById("totalHours");

    const scoreLabel =
        document.getElementById("scoreLabel");

    const scoreRing =
        document.getElementById("scoreRing");


    const totalHours =
        currentTasks.reduce(
            (total, task) =>
                total +
                Number(
                    task.effort || 0
                ),
            0
        );


    let score =
        Math.min(
            10,
            Math.max(
                1,
                Math.ceil(
                    totalHours / 2
                )
            )
        );


    scoreElement.textContent =
        score;

    totalHoursElement.textContent =
        `${totalHours}h planned`;


    let label =
        "Calm week";


    if (score >= 8) {

        label =
            "High pressure";

    } else if (score >= 5) {

        label =
            "Busy week";

    }


    scoreLabel.textContent =
        label;


    scoreRing.style.background =
        `conic-gradient(
            var(--blue)
            ${score * 10}%,
            rgba(91,140,255,.08)
            ${score * 10}%
        )`;

}


/* =========================================================
   RADAR
========================================================= */

function renderRadar() {

    const container =
        document.getElementById(
            "radarBars"
        );

    const empty =
        document.getElementById(
            "radarEmpty"
        );


    container.innerHTML = "";


    if (!currentTasks.length) {

        empty.style.display =
            "block";

        return;

    }


    empty.style.display =
        "none";


    const days =
        ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];


    const hours =
        Array(7).fill(0);


    currentTasks.forEach(
        task => {

            const date =
                new Date(
                    `${getTaskDate(task)}T00:00:00`
                );


            hours[
                date.getDay()
            ] += Number(
                task.effort || 0
            );

        }
    );


    const max =
        Math.max(
            ...hours,
            1
        );


    days.forEach(
        (day, index) => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "radar-column";


            let status =
                "";


            if (hours[index] >= 6) {

                status =
                    "overloaded";

            } else if (
                hours[index] >= 3
            ) {

                status =
                    "busy";

            }


            const height =
                Math.max(
                    5,
                    (
                        hours[index] /
                        max
                    ) * 150
                );


            column.innerHTML =
                `
                <span class="radar-value">
                    ${hours[index]}h
                </span>

                <div
                    class="radar-bar ${status}"
                    style="height:${height}px"
                ></div>

                <span class="radar-day">
                    ${day}
                </span>
                `;


            container.appendChild(
                column
            );

        }
    );

}


/* =========================================================
   ALERT
========================================================= */

function renderAlert() {

    const alert =
        document.getElementById(
            "alert"
        );


    const totals = {};


    currentTasks.forEach(
        task => {

            const date =
                getTaskDate(task);

            totals[date] =
                (
                    totals[date] || 0
                ) +
                Number(
                    task.effort || 0
                );

        }
    );


    let busiestDate = null;

    let busiestHours = 0;


    Object.entries(totals)
        .forEach(
            ([date, hours]) => {

                if (
                    hours >
                    busiestHours
                ) {

                    busiestDate =
                        date;

                    busiestHours =
                        hours;

                }

            }
        );


    if (
        busiestHours < 4 ||
        !busiestDate
    ) {

        alert.classList.add(
            "hidden"
        );

        return;

    }


    const date =
        new Date(
            `${busiestDate}T00:00:00`
        );


    const day =
        date.toLocaleDateString(
            undefined,
            {
                weekday:
                    "long"
            }
        );


    document
        .getElementById("alertTitle")
        .textContent =
            `${day} looks overloaded.`;


    document
        .getElementById("alertText")
        .textContent =
            `${busiestHours} hours are planned. Consider starting one task earlier.`;


    alert.classList.remove(
        "hidden"
    );

}


/* =========================================================
   WEEK VIEW
========================================================= */

function renderWeek() {

    const container =
        document.getElementById(
            "weekGrid"
        );


    container.innerHTML = "";


    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );


    for (
        let i = 0;
        i < 7;
        i++
    ) {

        const date =
            new Date(today);

        date.setDate(
            today.getDate() + i
        );


        const dateString =
            formatDateInput(date);


        const tasks =
            currentTasks.filter(
                task =>
                    getTaskDate(task) ===
                    dateString
            );


        const hours =
            tasks.reduce(
                (total, task) =>
                    total +
                    Number(
                        task.effort || 0
                    ),
                0
            );


        let status =
            "manageable";

        let statusText =
            "Manageable";


        if (hours >= 6) {

            status =
                "overloaded";

            statusText =
                "Overloaded";

        } else if (hours >= 3) {

            status =
                "busy";

            statusText =
                "Busy";

        }


        const day =
            document.createElement(
                "div"
            );


        day.className =
            `day ${status}`;


        day.innerHTML =
            `
            <div class="day-header">

                <span class="day-name">
                    ${date.toLocaleDateString(
                        undefined,
                        {
                            weekday:
                                "short"
                        }
                    )}
                </span>

                <span class="day-number">
                    ${date.getDate()}
                </span>

            </div>

            <div class="day-status">

                <span class="status-dot"></span>

                ${statusText}

            </div>

            <div class="day-tasks">

                ${
                    tasks.length
                    ?
                    tasks.map(
                        task =>
                            `
                            <button
                                class="mini-task"
                                onclick="openEditTask(${task.id})"
                            >

                                <span class="mini-dot"></span>

                                <div>

                                    <strong>
                                        ${escapeHtml(task.name)}
                                    </strong>

                                    <small>
                                        ${task.effort}h
                                    </small>

                                </div>

                            </button>
                            `
                    ).join("")
                    :
                    `<p class="empty-day">
                        No tasks
                    </p>`
                }

            </div>

            <p class="day-hours">
                ${hours}h planned
            </p>
            `;


        container.appendChild(
            day
        );

    }

}


/* =========================================================
   TASK LIST
========================================================= */

function renderTasks() {

    const container =
        document.getElementById(
            "taskList"
        );


    container.innerHTML = "";


    const sorted =
        [...currentTasks]
        .sort(
            (a, b) =>
                new Date(
                    getTaskDate(a)
                ) -
                new Date(
                    getTaskDate(b)
                )
        );


    if (!sorted.length) {

        container.innerHTML =
            `
            <p class="empty-tasks">
                No tasks yet.<br>
                Add your first task to start
                understanding your workload.
            </p>
            `;

        return;

    }


    sorted.forEach(
        task => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "task-row";


            row.innerHTML =
                `
                <div class="task-icon ${task.category}">
                    ${task.category
                        .charAt(0)}
                </div>

                <div class="task-info">

                    <strong>
                        ${escapeHtml(task.name)}
                    </strong>

                    <small>
                        ${escapeHtml(
                            task.category
                        )}
                        •
                        ${readableDate(
                            getTaskDate(task)
                        )}
                    </small>

                </div>

                <span class="effort">
                    ${task.effort}h
                </span>

                <button
                    class="task-edit"
                    onclick="openEditTask(${task.id})"
                >
                    Edit
                </button>
                `;


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
        document.getElementById(
            "suggestions"
        );


    container.innerHTML = "";


    if (!currentTasks.length) {

        container.innerHTML =
            `
            <div class="suggestion">
                <span class="suggestion-number">
                    01
                </span>

                <p>
                    Add a few upcoming tasks and
                    PRESSURE // OFF will start
                    identifying pressure points.
                </p>
            </div>
            `;

        return;

    }


    const sorted =
        [...currentTasks]
        .sort(
            (a, b) =>
                daysUntil(
                    getTaskDate(a)
                ) -
                daysUntil(
                    getTaskDate(b)
                )
        );


    const suggestions = [];


    const upcoming =
        sorted.find(
            task =>
                daysUntil(
                    getTaskDate(task)
                ) >= 0
        );


    if (upcoming) {

        suggestions.push(
            `Start "${upcoming.name}" early because it is one of your nearest deadlines.`
        );

    }


    const heavy =
        [...currentTasks]
        .sort(
            (a, b) =>
                b.effort -
                a.effort
        )[0];


    if (
        heavy &&
        heavy.effort >= 3
    ) {

        suggestions.push(
            `"${heavy.name}" needs ${heavy.effort} hours. Break it into smaller sessions instead of leaving it for one day.`
        );

    }


    suggestions.push(
        "Keep at least one lighter study period before your busiest day so your workload does not pile up."
    );


    suggestions
        .slice(0, 3)
        .forEach(
            (text, index) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "suggestion";


                item.innerHTML =
                    `
                    <span class="suggestion-number">
                        0${index + 1}
                    </span>

                    <p>
                        ${text}
                    </p>
                    `;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   REMINDERS
========================================================= */

function renderReminders() {

    const container =
        document.getElementById("reminderList");

    if (!container)
        return;

    container.innerHTML = "";

    const reminders =
        currentTasks
            .filter(task => {

                const days =
                    daysUntil(
                        task.due_date || task.date
                    );

                return days >= 0 &&
                       days <= 3;

            })
            .sort((a, b) => {

                return daysUntil(
                    a.due_date || a.date
                ) -
                daysUntil(
                    b.due_date || b.date
                );

            });


    if (!reminders.length) {

        container.innerHTML = `
            <p class="no-reminders">
                No urgent deadlines right now.
                Add tasks with due dates to get reminders.
            </p>
        `;

        return;

    }


    reminders.forEach(task => {

        const dueDate =
            task.due_date || task.date;

        const days =
            daysUntil(dueDate);

        let timing = "";

        if (days === 0) {

            timing =
                "Due today";

        } else if (days === 1) {

            timing =
                "Due tomorrow";

        } else {

            timing =
                `Due in ${days} days`;

        }


        const element =
            document.createElement("div");

        element.className =
            "reminder";


        element.innerHTML = `

            <div class="reminder-icon">
                🔔
            </div>

            <div>

                <strong>
                    ${escapeHtml(task.name)}
                </strong>

                <p>
                    ${timing} •
                    ${readableDate(dueDate)}
                    • ${task.effort}h effort
                </p>

            </div>

        `;


        container.appendChild(element);

    });

}


    reminders.forEach(
        task => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "reminder";


            item.innerHTML =
                `
                <span class="reminder-icon">
                    🔔
                </span>

                <div>

                    <strong>
                        ${escapeHtml(task.name)}
                    </strong>

                    <p>
                        Due
                        ${readableDate(
                            getTaskDate(task)
                        )}
                    </p>

                </div>
                `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   AI ASSISTANT
========================================================= */

function addAIMessage(
    text,
    type = "assistant"
) {

    const container =
        document.getElementById(
            "aiMessages"
        );


    const message =
        document.createElement(
            "div"
        );


    message.className =
        `ai-message ${type}`;


    message.innerHTML =
        type === "assistant"
        ?
        `
        <span class="message-icon">
            ✦
        </span>

        <p>${escapeHtml(text)}</p>
        `
        :
        `
        <p>${escapeHtml(text)}</p>
        `;


    container.appendChild(
        message
    );


    container.scrollTop =
        container.scrollHeight;

}


function getAssistantResponse(question) {

    const q =
        question.toLowerCase();


    if (!currentTasks.length) {

        return "You do not have any tasks yet. Add your upcoming work first, and I can identify busy days, deadlines and possible pressure points.";

    }


    if (
        q.includes("today")
    ) {

        const today =
            formatDateInput(
                new Date()
            );


        const todayTasks =
            currentTasks.filter(
                task =>
                    getTaskDate(task) ===
                    today
            );


        if (!todayTasks.length) {

            return "You have no tasks scheduled for today. A good move would be to start one of your nearest upcoming deadlines early.";

        }


        return `Today you have ${todayTasks.length} task(s). Start with the highest-effort task first, then move to smaller tasks.`;

    }


    if (
        q.includes("hardest") ||
        q.includes("hard")
    ) {

        const totals = {};


        currentTasks.forEach(
            task => {

                const date =
                    getTaskDate(task);

                totals[date] =
                    (
                        totals[date] || 0
                    ) +
                    Number(
                        task.effort
                    );

            }
        );


        const hardest =
            Object.entries(totals)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


        const date =
            new Date(
                `${hardest[0]}T00:00:00`
            );


        return `${date.toLocaleDateString(undefined,{weekday:"long"})} is currently your hardest day with ${hardest[1]} planned hours. Try moving preparation for at least one task earlier.`;

    }


    if (
        q.includes("reduce") ||
        q.includes("pressure")
    ) {

        return "To reduce pressure, start your nearest deadline early, split large tasks into smaller sessions, and avoid scheduling every difficult task on the same day.";

    }


    const nearest =
        [...currentTasks]
        .sort(
            (a, b) =>
                daysUntil(
                    getTaskDate(a)
                ) -
                daysUntil(
                    getTaskDate(b)
                )
        )[0];


    return `Based on your current workload, "${nearest.name}" is one of the first tasks worth checking because of its deadline and position in your schedule.`;

}


document
    .getElementById("aiForm")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const input =
                document.getElementById(
                    "aiInput"
                );


            const question =
                input.value.trim();


            if (!question)
                return;


            addAIMessage(
                question,
                "user"
            );


            input.value = "";


            setTimeout(
                () => {

                    addAIMessage(
                        getAssistantResponse(
                            question
                        )
                    );

                },
                300
            );

        }
    );


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


                    addAIMessage(
                        question,
                        "user"
                    );


                    setTimeout(
                        () => {

                            addAIMessage(
                                getAssistantResponse(
                                    question
                                )
                            );

                        },
                        250
                    );

                }
            );

        }
    );


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;

}


/* =========================================================
   SESSION CHECK
========================================================= */
/* =========================================================
   SMART REMINDERS
========================================================= */

const notificationButton =
    document.getElementById("notificationButton");

const notificationButton2 =
    document.getElementById("notificationButton2");


async function enableReminders() {

    if (!("Notification" in window)) {

        alert(
            "This browser does not support notifications."
        );

        return;

    }


    const permission =
        await Notification.requestPermission();


    if (permission === "granted") {

        localStorage.setItem(
            "pressureRemindersEnabled",
            "true"
        );


        alert(
            "Smart reminders enabled!"
        );


        checkUpcomingNotifications();

    } else {

        alert(
            "Notifications were not allowed."
        );

    }

}


function checkUpcomingNotifications() {

    const enabled =
        localStorage.getItem(
            "pressureRemindersEnabled"
        );


    if (enabled !== "true")
        return;


    if (Notification.permission !== "granted")
        return;


    currentTasks.forEach(task => {

        const dueDate =
            task.due_date || task.date;

        const days =
            daysUntil(dueDate);


        if (days === 0) {

            new Notification(
                "PRESSURE // OFF",
                {
                    body:
                        `${task.name} is due today!`
                }
            );

        }

    });

}


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        enableReminders
    );

}


if (notificationButton2) {

    notificationButton2.addEventListener(
        "click",
        enableReminders
    );

}
async function checkSession() {

    try {

        const {
            data:
            {
                session
            }
        } =
            await supabaseClient
                .auth
                .getSession();


        if (!session) {

            showAuth();

            return;

        }


        currentUser =
            session.user;


        await loadProfile();

        await loadTasks();


        showApp();

        renderDashboard();


    } catch (error) {

        console.error(
            error
        );

        showAuth();

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

setAuthMode("login");

checkSession();
