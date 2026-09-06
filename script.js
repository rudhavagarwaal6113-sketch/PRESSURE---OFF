```javascript
/* =========================================================
   PRESSURE // OFF
   COMPLETE SCRIPT
========================================================= */


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

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const authForm =
    document.getElementById("authForm");

const authUsername =
    document.getElementById("authUsername");

const authPassword =
    document.getElementById("authPassword");

const authName =
    document.getElementById("authName");

const nameField =
    document.getElementById("nameField");

const authButton =
    document.getElementById("authButton");

const authError =
    document.getElementById("authError");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const logoutButton =
    document.getElementById("logoutButton");

const usernameDisplay =
    document.getElementById("username");

const avatar =
    document.getElementById("avatar");

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

const saveTask =
    document.getElementById("saveTask");

const taskModal =
    document.getElementById("taskModal");

const closeModalButton =
    document.getElementById("closeModal");

const cancelModalButton =
    document.getElementById("cancelModal");

const deleteTaskButton =
    document.getElementById("deleteTask");

const addTaskTop =
    document.getElementById("addTaskTop");

const addTaskButton =
    document.getElementById("addTaskButton");

const notificationButton =
    document.getElementById("notificationButton");

const notificationButton2 =
    document.getElementById("notificationButton2");

const aiForm =
    document.getElementById("aiForm");

const aiInput =
    document.getElementById("aiInput");

const aiMessages =
    document.getElementById("aiMessages");


/* =========================================================
   USERNAME → INTERNAL EMAIL
========================================================= */

function usernameToEmail(username) {

    return `${username}@pressure-off.internal`;

}


/* =========================================================
   AUTH MODE
========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    if (authMode === "login") {

        authTitle.textContent =
            "Welcome back";

        authSubtitle.textContent =
            "See the pressure before it piles up.";

        authButton.textContent =
            "Log in";

        nameField.classList.add("hidden");

        loginTab.classList.add("active");

        signupTab.classList.remove("active");

    } else {

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Start understanding your workload.";

        authButton.textContent =
            "Create account";

        nameField.classList.remove("hidden");

        loginTab.classList.remove("active");

        signupTab.classList.add("active");

    }

    authError.textContent = "";

}


/* =========================================================
   AUTH TABS
========================================================= */

loginTab.addEventListener(
    "click",
    () => {

        setAuthMode("login");

    }
);


signupTab.addEventListener(
    "click",
    () => {

        setAuthMode("signup");

    }
);


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(message) {

    authError.textContent =
        message || "";

}


/* =========================================================
   SIGNUP / LOGIN
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

        const name =
            authName.value.trim();


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


        authButton.disabled = true;

        showAuthMessage(
            authMode === "login"
                ? "Logging in..."
                : "Creating your account..."
        );


        /* =================================================
           SIGN UP
        ================================================= */

        if (authMode === "signup") {

            try {

                const email =
                    usernameToEmail(username);


                /* CHECK USERNAME */

                const {
                    data: existingProfile,
                    error: profileCheckError
                } =
                    await supabaseClient
                        .from("profiles")
                        .select("id")
                        .eq(
                            "username",
                            username
                        )
                        .maybeSingle();


                if (profileCheckError) {

                    console.error(
                        "PROFILE CHECK ERROR:",
                        profileCheckError
                    );

                    showAuthMessage(
                        "Could not check username."
                    );

                    return;

                }


                if (existingProfile) {

                    showAuthMessage(
                        "Username already exists."
                    );

                    return;

                }


                /* CREATE AUTH USER */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {

                                username: username,

                                name: name

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


                if (!data.user) {

                    showAuthMessage(
                        "Could not create account."
                    );

                    return;

                }


                currentUser =
                    data.user;


                /* LOAD PROFILE */

                await loadProfile();


                /* LOAD TASKS */

                await loadTasks();


                showApp();

                renderDashboard();


            } catch (error) {

                console.error(
                    "SIGNUP CRASH:",
                    error
                );

                showAuthMessage(
                    "Something went wrong while creating your account."
                );

            } finally {

                authButton.disabled = false;

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

                    password: password

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


            currentUser =
                data.user;


            await loadProfile();

            await loadTasks();

            showApp();

            renderDashboard();


        } catch (error) {

            console.error(
                "LOGIN CRASH:",
                error
            );

            showAuthMessage(
                "Something went wrong while logging in."
            );

        } finally {

            authButton.disabled = false;

        }

    }
);


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
            "PROFILE LOAD ERROR:",
            error
        );

        currentProfile = null;

        updateProfileUI();

        return;

    }


    currentProfile =
        data || null;


    updateProfileUI();

}


/* =========================================================
   PROFILE UI
========================================================= */

function updateProfileUI() {

    if (!currentUser)
        return;


    const metadata =
        currentUser.user_metadata || {};


    const profileName =
        currentProfile?.name ||
        metadata.name ||
        currentProfile?.username ||
        metadata.username ||
        currentUser.email?.split("@")[0] ||
        "Student";


    const profileUsername =
        currentProfile?.username ||
        metadata.username ||
        "student";


    if (usernameDisplay) {

        usernameDisplay.textContent =
            profileName;

    }


    if (avatar) {

        avatar.textContent =
            profileName
                .charAt(0)
                .toUpperCase();

    }


    /* Update title information */

    document.title =
        `PRESSURE // OFF — ${profileName}`;

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
                "date",
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
   SHOW APP
========================================================= */

function showApp() {

    authScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

    authScreen.style.display =
        "none";

    app.style.display =
        "block";

}


/* =========================================================
   SHOW AUTH
========================================================= */

function showAuth() {

    app.classList.add(
        "hidden"
    );

    authScreen.classList.remove(
        "hidden"
    );

    app.style.display =
        "none";

    authScreen.style.display =
        "grid";

}


/* =========================================================
   LOGOUT
========================================================= */

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

            closeTaskModal();

            showAuth();

            authForm.reset();

            setAuthMode("login");


        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while logging out."
            );

        } finally {

            logoutButton.disabled = false;

        }

    }
);


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

    return date
        .toISOString()
        .split("T")[0];

}


function getWeekDate(offset) {

    return getLocalDate(offset);

}


function readableDate(dateString) {

    if (!dateString)
        return "";

    const date =
        new Date(
            dateString +
            "T00:00:00"
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

    if (!dateString)
        return "";

    const date =
        new Date(
            dateString +
            "T00:00:00"
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

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "long"
        }
    );

}


function daysUntil(dateString) {

    if (!dateString)
        return 999;


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
            dateString +
            "T00:00:00"
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
        (
            1000 *
            60 *
            60 *
            24
        )
    );

}


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
            getWeekDate(i);


        const tasks =
            currentTasks.filter(
                task =>
                    task.date === date
            );


        const hours =
            tasks.reduce(
                (
                    total,
                    task
                ) =>
                    total +
                    (
                        Number(task.effort) ||
                        0
                    ),
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
        daysUntil(task.date);


    let score = 0;


    /* Effort */

    score +=
        Math.min(
            effort * 8,
            40
        );


    /* Deadline proximity */

    if (days <= 0) {

        score += 45;

    } else if (days === 1) {

        score += 38;

    } else if (days === 2) {

        score += 30;

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
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    renderScore();

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

function calculateWeeklyScore() {

    if (!currentTasks.length)
        return 1;


    const totalEffort =
        currentTasks.reduce(
            (
                total,
                task
            ) =>
                total +
                (
                    Number(task.effort) ||
                    0
                ),
            0
        );


    const urgentTasks =
        currentTasks.filter(
            task =>
                daysUntil(task.date) <= 2
        ).length;


    const overloadedDays =
        getWeekData()
            .filter(
                day =>
                    day.hours >= 5
            )
            .length;


    let score =
        1 +
        (
            totalEffort * 0.65
        ) +
        (
            urgentTasks * 0.8
        ) +
        (
            overloadedDays * 1.2
        );


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
        document.getElementById(
            "score"
        );

    const scoreRing =
        document.getElementById(
            "scoreRing"
        );

    const scoreLabel =
        document.getElementById(
            "scoreLabel"
        );

    const totalHours =
        document.getElementById(
            "totalHours"
        );


    const score =
        calculateWeeklyScore();


    const total =
        currentTasks.reduce(
            (
                sum,
                task
            ) =>
                sum +
                (
                    Number(task.effort) ||
                    0
                ),
            0
        );


    if (scoreElement) {

        scoreElement.textContent =
            score;

    }


    if (totalHours) {

        totalHours.textContent =
            `${total.toFixed(1).replace(".0", "")}h planned`;

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

        scoreRing.style.background =
            `conic-gradient(
                var(--blue) ${score * 10}%,
                rgba(91,140,255,.08) ${score * 10}%
            )`;

    }

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


    if (!container)
        return;


    const week =
        getWeekData();


    container.innerHTML = "";


    if (empty) {

        empty.style.display =
            currentTasks.length
                ? "none"
                : "block";

    }


    if (!currentTasks.length)
        return;


    const maxHours =
        Math.max(
            ...week.map(
                day =>
                    day.hours
            ),
            1
        );


    week.forEach(
        day => {

            const column =
                document.createElement(
                    "div"
                );

            column.className =
                "radar-column";


            const status =
                getDayStatus(
                    day.hours
                );


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                `radar-bar ${status.className}`;


            const height =
                Math.max(
                    5,
                    (
                        day.hours /
                        maxHours
                    ) *
                    100
                );


            bar.style.height =
                `${height}%`;


            const value =
                document.createElement(
                    "span"
                );

            value.className =
                "radar-value";

            value.textContent =
                `${day.hours.toFixed(1).replace(".0", "")}h`;


            const dayLabel =
                document.createElement(
                    "span"
                );

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
                    )
                    .slice(0, 3);


            column.appendChild(
                value
            );

            column.appendChild(
                bar
            );

            column.appendChild(
                dayLabel
            );


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

    const alertCard =
        document.getElementById(
            "alert"
        );

    const alertTitle =
        document.getElementById(
            "alertTitle"
        );

    const alertText =
        document.getElementById(
            "alertText"
        );


    if (!alertCard)
        return;


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
        overloaded.sort(
            (
                a,
                b
            ) =>
                b.hours -
                a.hours
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
            `${worstDay.hours.toFixed(1).replace(".0", "")} hours are planned. Consider starting one of these tasks earlier.`;

    }

}


/* =========================================================
   WEEKLY VIEW
========================================================= */

function renderWeek() {

    const container =
        document.getElementById(
            "weekGrid"
        );


    if (!container)
        return;


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
                document.createElement(
                    "div"
                );


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


            const dayNumber =
                date.getDate();


            element.innerHTML = `

                <div class="day-header">

                    <span class="day-name">
                        ${dayName}
                    </span>

                    <span class="day-number">
                        ${dayNumber}
                    </span>

                </div>

                <div class="day-status">

                    <span class="status-dot"></span>

                    ${status.label}

                </div>

                <div class="day-tasks">

                    ${
                        day.tasks.length
                        ?
                        day.tasks.map(
                            task => `
                                <button
                                    class="mini-task"
                                    type="button"
                                    data-task-id="${task.id}"
                                >

                                    <span class="mini-dot"></span>

                                    <span>

                                        <strong>
                                            ${escapeHtml(task.name)}
                                        </strong>

                                        <small>
                                            ${Number(task.effort) || 0}h
                                        </small>

                                    </span>

                                </button>
                            `
                        ).join("")
                        :
                        `
                            <span class="empty-day">
                                No tasks
                            </span>
                        `
                    }

                </div>

                <div class="day-hours">

                    ${
                        day.hours > 0
                        ? `${day.hours.toFixed(1).replace(".0", "")}h planned`
                        : "Free"

                    }

                </div>

            `;


            element
                .querySelectorAll(
                    ".mini-task"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                openEditTask(
                                    Number(
                                        button.dataset.taskId
                                    )
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
   TASK LIST
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


    return icons[category] ||
        "•";

}


function renderTasks() {

    const container =
        document.getElementById(
            "taskList"
        );


    if (!container)
        return;


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
            (
                a,
                b
            ) =>
                new Date(a.date) -
                new Date(b.date)
        );


    sortedTasks.forEach(
        task => {

            const row =
                document.createElement(
                    "button"
                );


            row.type =
                "button";

            row.className =
                "task-row";


            const days =
                daysUntil(
                    task.date
                );


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
                    `Due ${readableShortDate(task.date)}`;

            }


            row.innerHTML = `

                <span class="task-icon ${escapeHtml(task.category || "Other")}">

                    ${getCategoryIcon(task.category)}

                </span>

                <span class="task-info">

                    <strong>
                        ${escapeHtml(task.name)}
                    </strong>

                    <small>
                        ${escapeHtml(task.category || "Other")}
                        ·
                        ${deadlineText}
                    </small>

                </span>

                <span class="effort">

                    ${Number(task.effort) || 0}h

                </span>

            `;


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
        document.getElementById(
            "suggestions"
        );


    if (!container)
        return;


    container.innerHTML = "";


    if (!currentTasks.length) {

        container.innerHTML = `

            <div class="suggestion">

                <span class="suggestion-number">
                    1
                </span>

                <div>

                    <strong>
                        Add your first task
                    </strong>

                    <p>
                        Once you add tasks, I'll identify deadlines, busy days and useful ways to spread your work.
                    </p>

                </div>

            </div>

        `;

        return;

    }


    const suggestions = [];


    /* Highest pressure task */

    const highestPressureTask =
        [...currentTasks]
            .sort(
                (
                    a,
                    b
                ) =>
                    getTaskPressure(b) -
                    getTaskPressure(a)
            )[0];


    if (highestPressureTask) {

        const days =
            daysUntil(
                highestPressureTask.date
            );


        if (days <= 1) {

            suggestions.push(
                `Prioritise "${highestPressureTask.name}" — its deadline is very close.`
            );

        } else {

            suggestions.push(
                `Start "${highestPressureTask.name}" early. It has one of the highest pressure scores in your workload.`
            );

        }

    }


    /* Busiest day */

    const week =
        getWeekData();


    const busiestDay =
        [...week]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.hours -
                    a.hours
            )[0];


    if (
        busiestDay &&
        busiestDay.hours >= 3
    ) {

        suggestions.push(
            `${getDayName(busiestDay.date)} has ${busiestDay.hours.toFixed(1).replace(".0", "")} hours planned. Move preparation earlier if possible.`
        );

    }


    /* Large effort task */

    const largeTask =
        [...currentTasks]
            .sort(
                (
                    a,
                    b
                ) =>
                    (
                        Number(b.effort) || 0
                    ) -
                    (
                        Number(a.effort) || 0
                    )
            )[0];


    if (
        largeTask &&
        Number(largeTask.effort) >= 2
    ) {

        suggestions.push(
            `Break "${largeTask.name}" into smaller sessions instead of doing it all at once.`
        );

    }


    /* General */

    suggestions.push(
        "Try to finish one high-priority task before starting several smaller ones."
    );


    suggestions
        .slice(0, 4)
        .forEach(
            (
                text,
                index
            ) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "suggestion";


                element.innerHTML = `

                    <span class="suggestion-number">
                        ${index + 1}
                    </span>

                    <div>

                        <p>
                            ${escapeHtml(text)}
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
        document.getElementById(
            "reminderList"
        );


    if (!container)
        return;


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
                    daysUntil(task.date) >= 0 &&
                    daysUntil(task.date) <= 3
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(a.date) -
                    new Date(b.date)
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
                    document.createElement(
                        "div"
                    );


                element.className =
                    "reminder";


                const days =
                    daysUntil(
                        task.date
                    );


                let title;

                let description;


                if (days === 0) {

                    title =
                        task.name;

                    description =
                        "Due today — consider working on it now.";

                } else if (days === 1) {

                    title =
                        task.name;

                    description =
                        "Due tomorrow — don't leave it until the last minute.";

                } else {

                    title =
                        task.name;

                    description =
                        `Due in ${days} days. A small session today could reduce pressure later.`;

                }


                element.innerHTML = `

                    <span class="reminder-icon">
                        🔔
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(title)}
                        </strong>

                        <p>
                            ${escapeHtml(description)}
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
   OPEN ADD TASK
========================================================= */

function openAddTask() {

    editingTaskId = null;


    taskForm.reset();


    taskCategory.value =
        "Homework";


    taskEffort.value =
        "1";


    taskDate.value =
        getWeekDate(0);


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add a task";


    saveTask.textContent =
        "Add Task";


    deleteTaskButton.classList.add(
        "hidden"
    );


    taskModal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   OPEN EDIT TASK
========================================================= */

function openEditTask(id) {

    const task =
        currentTasks.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!task)
        return;


    editingTaskId =
        Number(id);


    taskName.value =
        task.name || "";


    taskCategory.value =
        task.category ||
        "Homework";


    taskEffort.value =
        task.effort ||
        1;


    taskDate.value =
        task.date ||
        "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit task";


    saveTask.textContent =
        "Save changes";


    deleteTaskButton.classList.remove(
        "hidden"
    );


    taskModal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CLOSE TASK MODAL
========================================================= */

function closeTaskModal() {

    taskModal.classList.add(
        "hidden"
    );


    editingTaskId =
        null;

}


/* =========================================================
   MODAL BUTTONS
========================================================= */

addTaskTop.addEventListener(
    "click",
    openAddTask
);


addTaskButton.addEventListener(
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

        const date =
            taskDate.value;


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


        saveTask.disabled =
            true;


        try {

            /* =================================================
               UPDATE
            ================================================= */

            if (editingTaskId) {

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
                            Number(task.id) ===
                            Number(editingTaskId)
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
                        .insert([

                            {

                                user_id:
                                    currentUser.id,

                                name:
                                    name,

                                category:
                                    category,

                                effort:
                                    effort,

                                date:
                                    date,

                                due_date:
                                    date

                            }

                        ])
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
                "SAVE TASK ERROR:",
                error
            );

            alert(
                "Something went wrong while saving the task."
            );

        } finally {

            saveTask.disabled =
                false;

        }

    }
);


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(id) {

    if (!currentUser)
        return;


    const task =
        currentTasks.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (!task)
        return;


    const confirmed =
        confirm(
            `Delete "${task.name}"?`
        );


    if (!confirmed)
        return;


    try {

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
                    Number(item.id) !==
                    Number(id)
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


/* =========================================================
   DELETE BUTTON
========================================================= */

deleteTaskButton.addEventListener(
    "click",
    async () => {

        if (!editingTaskId)
            return;


        await deleteTask(
            editingTaskId
        );

    }
);


/* =========================================================
   SMART REMINDER NOTIFICATIONS
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
            "Notifications were not enabled. You can allow them from your browser settings."
        );

    }

}


function updateNotificationButtons() {

    const enabled =
        localStorage.getItem(
            "pressureNotifications"
        ) ===
        "enabled";


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
        !("Notification" in window) ||
        Notification.permission !==
            "granted"
    )
        return;


    const urgentTasks =
        currentTasks.filter(
            task =>
                daysUntil(task.date) >= 0 &&
                daysUntil(task.date) <= 1
        );


    if (!urgentTasks.length)
        return;


    const task =
        urgentTasks[0];


    let body;


    if (
        daysUntil(task.date) ===
        0
    ) {

        body =
            `"${task.name}" is due today.`;

    } else {

        body =
            `"${task.name}" is due tomorrow.`;

    }


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


updateNotificationButtons();


/* =========================================================
   AI ASSISTANT
========================================================= */

function addAIMessage(
    message,
    type = "assistant"
) {

    if (!aiMessages)
        return;


    const element =
        document.createElement(
            "div"
        );


    element.className =
        `ai-message ${type}`;


    if (
        type ===
        "assistant"
    ) {

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
   AI WORKLOAD ANALYSIS
========================================================= */

function analyseWorkload() {

    const totalHours =
        currentTasks.reduce(
            (
                total,
                task
            ) =>
                total +
                (
                    Number(task.effort) ||
                    0
                ),
            0
        );


    const week =
        getWeekData();


    const busiestDay =
        [...week]
            .sort(
                (
                    a,
                    b
                ) =>
                    b.hours -
                    a.hours
            )[0];


    const nextTask =
        [...currentTasks]
            .filter(
                task =>
                    daysUntil(task.date) >= 0
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getTaskPressure(b) -
                    getTaskPressure(a)
            )[0];


    const overdue =
        currentTasks.filter(
            task =>
                daysUntil(task.date) < 0
        );


    const urgent =
        currentTasks.filter(
            task =>
                daysUntil(task.date) >= 0 &&
                daysUntil(task.date) <= 2
        );


    return {

        totalHours,

        busiestDay,

        nextTask,

        overdue,

        urgent,

        week

    };

}


/* =========================================================
   AI RESPONSE ENGINE
========================================================= */

function generateAIResponse(
    question
) {

    const q =
        question
            .toLowerCase()
            .trim();


    const analysis =
        analyseWorkload();


    if (!currentTasks.length) {

        return `
You don't have any tasks yet.

Add your homework, tests, projects or assignments and I'll analyse your deadlines, effort and busy days for you.
        `.trim();

    }


    /* =====================================================
       TODAY
    ===================================================== */

    if (
        q.includes("today") ||
        q.includes("now") ||
        q.includes("start")
    ) {

        if (analysis.nextTask) {

            const task =
                analysis.nextTask;

            const days =
                daysUntil(
                    task.date
                );


            if (days === 0) {

                return `
Start with "${task.name}".

It's due today and needs about ${task.effort} hour(s). I'd make this your first priority.
                `.trim();

            }


            return `
I'd start with "${task.name}".

It's due ${readableDate(task.date)} and needs about ${task.effort} hour(s). Starting it now should reduce pressure later.
            `.trim();

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

            return `
Your highest-priority task is "${task.name}".

Due: ${readableDate(task.date)}
Effort: ${task.effort} hour(s)
Time remaining: ${
                daysUntil(task.date) < 0
                    ? "overdue"
                    : daysUntil(task.date) === 0
                        ? "today"
                        : `${daysUntil(task.date)} day(s)`
            }

I'd tackle this before lower-pressure tasks.
            `.trim();

        }

    }


    /* =====================================================
       HARDEST DAY
    ===================================================== */

    if (
        q.includes("hardest") ||
        q.includes("busiest") ||
        q.includes("difficult day") ||
        q.includes("worst day")
    ) {

        const day =
            analysis.busiestDay;


        if (day) {

            const taskNames =
                day.tasks
                    .map(
                        task =>
                            task.name
                    )
                    .join(", ");


            return `
Your busiest day is ${getDayName(day.date)} (${readableDate(day.date)}).

You have ${day.hours.toFixed(1).replace(".0", "")} hour(s) planned that day.

Tasks: ${taskNames || "None"}

I'd move preparation for at least one of those tasks to an earlier day.
            `.trim();

        }

    }


    /* =====================================================
       PRESSURE
    ===================================================== */

    if (
        q.includes("pressure") ||
        q.includes("stress") ||
        q.includes("overwhelm") ||
        q.includes("overloaded")
    ) {

        if (
            analysis.busiestDay &&
            analysis.busiestDay.hours >= 5
        ) {

            return `
Your main pressure point is ${getDayName(analysis.busiestDay.date),}.

You have ${analysis.busiestDay.hours.toFixed(1).replace(".0", "")} hours concentrated there.

The simplest fix is to start one of those tasks earlier instead of trying to remove everything from that day.
            `.replace(
                "is ${getDayName(analysis.busiestDay.date),}",
                `is ${getDayName(analysis.busiestDay.date)}`
            ).trim();

        }


        return `
Your workload doesn't currently show a major overload.

The best way to keep it that way is to start high-effort tasks before their deadlines and avoid stacking several tasks on the same day.
        `.trim();

    }


    /* =====================================================
       DEADLINES
    ===================================================== */

    if (
        q.includes("deadline") ||
        q.includes("due") ||
        q.includes("coming up")
    ) {

        if (analysis.nextTask) {

            const task =
                analysis.nextTask;


            return `
Your most important upcoming deadline is "${task.name}".

It's due ${readableDate(task.date)} and requires about ${task.effort} hour(s).

I'd work on this before tasks with later deadlines.
            `.trim();

        }

    }


    /* =====================================================
       HOW MANY HOURS
    ===================================================== */

    if (
        q.includes("how many hours") ||
        q.includes("hours") ||
        q.includes("workload")
    ) {

        return `
You currently have ${analysis.totalHours.toFixed(1).replace(".0", "")} hour(s) of planned work across ${currentTasks.length} task(s).

Your busiest day is ${analysis.busiestDay ? getDayName(analysis.busiestDay.date) : "not clear yet"}.

You have ${analysis.urgent.length} urgent task(s) due within the next two days.
        `.trim();

    }


    /* =====================================================
       PLAN MY WEEK
    ===================================================== */

    if (
        q.includes("plan my week") ||
        q.includes("schedule my week") ||
        q.includes("organize my week") ||
        q.includes("organise my week")
    ) {

        const ordered =
            [...currentTasks]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        getTaskPressure(b) -
                        getTaskPressure(a)
                )
                .slice(0, 4);


        return `
Here's how I'd approach your week:

1. Start with "${ordered[0]?.name || "your highest-priority task"}".
2. Work on high-effort tasks before their deadlines.
3. Avoid leaving more than one large task for the same day.
4. Use lighter days for preparation and smaller assignments.

You have ${analysis.totalHours.toFixed(1).replace(".0", "")} hour(s) of work planned overall.
        `.trim();

    }


    /* =====================================================
       GENERAL RESPONSE
    ===================================================== */

    return `
I've analysed your current workload.

• ${currentTasks.length} task(s)
• ${analysis.totalHours.toFixed(1).replace(".0", "")} hour(s) planned
• ${analysis.urgent.length} urgent task(s)
• Busiest day: ${
        analysis.busiestDay
            ? getDayName(analysis.busiestDay.date)
            : "none"
    }

Try asking:

"What should I work on today?"
"Which day is hardest?"
"Which deadline should I prioritise?"
"How can I reduce my pressure?"
"Plan my week"
    `.trim();

}


/* =========================================================
   AI FORM
========================================================= */

aiForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const question =
            aiInput.value.trim();


        if (!question)
            return;


        addAIMessage(
            question,
            "user"
        );


        aiInput.value = "";


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
            300
        );

    }
);


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


                    if (!question)
                        return;


                    addAIMessage(
                        question,
                        "user"
                    );


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
                        300
                    );

                }
            );

        }
    );


/* =========================================================
   SESSION CHECK
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


        if (data.session) {

            currentUser =
                data.session.user;


            await loadProfile();

            await loadTasks();


            showApp();

            renderDashboard();


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
   AUTH STATE LISTENER
========================================================= */

supabaseClient.auth.onAuthStateChange(
    async (
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

            return;

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
   INITIALIZE
========================================================= */

setAuthMode(
    "login"
);

checkSession();
```
