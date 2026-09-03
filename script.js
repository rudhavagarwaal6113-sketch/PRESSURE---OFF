/* =====================================================
   PRESSURE // OFF
   SUPABASE FRONT-END APPLICATION
===================================================== */


/* =====================================================
   SUPABASE
===================================================== */

const SUPABASE_URL =
    "https://zssnupcdrgbgjtdtelgl.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_1pD5veoyvfR1uSOWRuPjew_j-r3rmzp";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =====================================================
   APP STATE
===================================================== */

let currentUser = null;
let currentProfile = null;
let currentTasks = [];

let authMode = "login";
let editingTaskId = null;


/* =====================================================
   DOM
===================================================== */

const authScreen =
    document.getElementById("authScreen");

const app =
    document.getElementById("app");

const authForm =
    document.getElementById("authForm");

const loginTab =
    document.getElementById("loginTab");

const signupTab =
    document.getElementById("signupTab");

const nameField =
    document.getElementById("nameField");

const authName =
    document.getElementById("authName");

const authUsername =
    document.getElementById("authUsername");

const authPassword =
    document.getElementById("authPassword");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authButton =
    document.getElementById("authButton");

const authError =
    document.getElementById("authError");

const username =
    document.getElementById("username");

const avatar =
    document.getElementById("avatar");

const logoutButton =
    document.getElementById("logoutButton");

const addTaskTop =
    document.getElementById("addTaskTop");

const addTaskButton =
    document.getElementById("addTaskButton");

const taskModal =
    document.getElementById("taskModal");

const closeModal =
    document.getElementById("closeModal");

const cancelModal =
    document.getElementById("cancelModal");

const taskForm =
    document.getElementById("taskForm");

const modalTitle =
    document.getElementById("modalTitle");

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

const deleteTask =
    document.getElementById("deleteTask");

const weekGrid =
    document.getElementById("weekGrid");

const radarBars =
    document.getElementById("radarBars");

const radarEmpty =
    document.getElementById("radarEmpty");

const taskList =
    document.getElementById("taskList");

const suggestions =
    document.getElementById("suggestions");

const score =
    document.getElementById("score");

const scoreLabel =
    document.getElementById("scoreLabel");

const scoreRing =
    document.getElementById("scoreRing");

const totalHours =
    document.getElementById("totalHours");

const alertBox =
    document.getElementById("alert");

const alertTitle =
    document.getElementById("alertTitle");

const alertText =
    document.getElementById("alertText");

const reminderList =
    document.getElementById("reminderList");

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


/* =====================================================
   AUTH MODE
===================================================== */

function setAuthMode(mode) {

    authMode = mode;

    authError.textContent = "";

    if (mode === "login") {

        loginTab.classList.add("active");
        signupTab.classList.remove("active");

        nameField.classList.add("hidden");

        authName.required = false;

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

        authName.required = true;

        authTitle.textContent =
            "Create your account";

        authSubtitle.textContent =
            "Start with a completely blank workload.";

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


/* =====================================================
   USERNAME VALIDATION
===================================================== */

function isValidUsername(value) {

    return /^[a-z0-9._-]{3,30}$/.test(
        value
    );
}


/*
   Supabase Auth requires an email address.

   The UI still uses usernames, so new accounts
   receive an internal email identifier.

   The username itself is stored in profiles.
*/

function usernameToEmail(user) {

    return `${user}@pressure-off.internal`;
}


/* =====================================================
   AUTH FORM
===================================================== */

authForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        authError.textContent = "";

        const user =
            authUsername.value
                .trim()
                .toLowerCase();

        const password =
            authPassword.value;

        const name =
            authName.value.trim();


        if (!user || !password) {

            authError.textContent =
                "Please enter your username and password.";

            return;
        }


        if (!isValidUsername(user)) {

            authError.textContent =
                "Username must be 3–30 characters and use only letters, numbers, ., _ or -.";

            return;
        }


        if (password.length < 6) {

            authError.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        authButton.disabled = true;


        try {

            /* =================================================
               CREATE ACCOUNT
            ================================================= */

            if (authMode === "signup") {

                if (!name) {

                    authError.textContent =
                        "Please enter your name.";

                    return;
                }


                /*
                   Check whether username already exists.
                */

                const {
                    data: existingProfile,
                    error: profileCheckError
                } =
                    await supabaseClient
                        .from("profiles")
                        .select("id")
                        .eq("username", user)
                        .maybeSingle();


                if (profileCheckError) {

                    console.error(
                        profileCheckError
                    );

                    authError.textContent =
                        "Could not check username. Please try again.";

                    return;
                }


                if (existingProfile) {

                    authError.textContent =
                        "That username is already taken.";

                    return;
                }


                const email =
                    usernameToEmail(user);


                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signUp({

                        email,

                        password,

                        options: {

                            data: {

                                name,
                                username: user

                            }

                        }

                    });


                if (error) {

                    console.error(error);

                    authError.textContent =
                        error.message;

                    return;
                }


                if (!data.user) {

                    authError.textContent =
                        "Account creation failed.";

                    return;
                }


                /*
                   The database trigger created the profile.

                   If a session exists, continue directly
                   into the application.
                */

                if (data.session) {

                    currentUser =
                        data.user;

                    await loadProfile();

                    await loadTasks();

                    authForm.reset();

                    showApp();

                } else {

                    authError.textContent =
                        "Account created. Please check your email before logging in.";
                }


                return;
            }


            /* =================================================
               LOGIN
            ================================================= */

            const {
                data: emailData,
                error: emailError
            } =
                await supabaseClient.rpc(
                    "get_login_email",
                    {
                        login_username: user
                    }
                );


            if (emailError) {

                console.error(emailError);

                authError.textContent =
                    "Unable to find that username.";

                return;
            }


            if (!emailData) {

                authError.textContent =
                    "Username not found.";

                return;
            }


            const {
                data: loginData,
                error: loginError
            } =
                await supabaseClient.auth.signInWithPassword({

                    email: emailData,

                    password

                });


            if (loginError) {

                console.error(loginError);

                authError.textContent =
                    "Incorrect password.";

                return;
            }


            currentUser =
                loginData.user;


            await loadProfile();

            await loadTasks();

            authForm.reset();

            showApp();

        } catch (error) {

            console.error(error);

            authError.textContent =
                "Something went wrong. Please try again.";

        } finally {

            authButton.disabled = false;

        }
    }
);


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile() {

    if (!currentUser) return;


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

        console.error(
            "Profile loading error:",
            error
        );

        throw error;
    }


    if (!data) {

        /*
           This should normally be handled by
           the database trigger.
        */

        currentProfile = {

            id: currentUser.id,

            name:
                currentUser.user_metadata?.name ||
                "User",

            username:
                currentUser.user_metadata?.username ||
                "user",

            role: "user"

        };

        return;
    }


    currentProfile = data;
}


/* =====================================================
   LOAD TASKS
===================================================== */

async function loadTasks() {

    if (!currentUser) {

        currentTasks = [];

        return;
    }


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
            "Task loading error:",
            error
        );

        throw error;
    }


    currentTasks =
        Array.isArray(data)
            ? data
            : [];
}


/* =====================================================
   SESSION / LOGOUT
===================================================== */

async function logout() {

    await supabaseClient.auth.signOut();

    currentUser = null;

    currentProfile = null;

    currentTasks = [];

    app.classList.add("hidden");

    authScreen.classList.remove("hidden");

    setAuthMode("login");
}


logoutButton.addEventListener(
    "click",
    logout
);


/* =====================================================
   STORAGE COMPATIBILITY
===================================================== */

function getUser() {

    return currentProfile;
}


function getTasks() {

    return currentTasks;
}


/* =====================================================
   DATE
===================================================== */

function getMonday() {

    const date =
        new Date();

    date.setHours(
        0,
        0,
        0,
        0
    );

    const day =
        date.getDay();

    const difference =
        day === 0
            ? -6
            : 1 - day;

    date.setDate(
        date.getDate() + difference
    );

    return date;
}


function getWeekDate(offset) {

    const date =
        getMonday();

    date.setDate(
        date.getDate() + offset
    );

    return formatDateKey(date);
}


function formatDateKey(date) {

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


function readableDate(dateString) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
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

    return Math.ceil(
        (
            target - today
        ) / 86400000
    );
}


/* =====================================================
   APP
===================================================== */

function showApp() {

    authScreen.classList.add("hidden");

    app.classList.remove("hidden");


    const user =
        getUser();


    if (user) {

        username.textContent =
            user.name || user.username || "User";

        avatar.textContent =
            (
                user.name ||
                user.username ||
                "U"
            )
                .charAt(0)
                .toUpperCase();
    }


    renderDashboard();
}


/* =====================================================
   WEEK CALCULATION
===================================================== */

function getWeekData() {

    const names = [

        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"

    ];


    const tasks =
        getTasks();


    return names.map(
        (name, index) => {

            const date =
                getWeekDate(index);


            const dayTasks =
                tasks.filter(
                    task =>
                        task.date === date
                );


            const hours =
                dayTasks.reduce(
                    (total, task) =>
                        total +
                        Number(task.effort),
                    0
                );


            const taskCount =
                dayTasks.length;


            const clustering =
                Math.max(
                    0,
                    taskCount - 1
                ) * 1.5;


            const pressure =
                hours + clustering;


            let status =
                "manageable";


            if (
                pressure >= 6 ||
                (
                    hours >= 5 &&
                    taskCount >= 2
                )
            ) {

                status =
                    "overloaded";

            } else if (
                pressure >= 3
            ) {

                status =
                    "busy";
            }


            return {

                name,
                date,
                tasks: dayTasks,
                hours,
                taskCount,
                pressure,
                status

            };

        }
    );
}


/* =====================================================
   DASHBOARD
===================================================== */

function renderDashboard() {

    renderWeek();

    renderRadar();

    renderTasks();

    renderScore();

    renderAlert();

    renderSuggestions();

    renderReminders();
}


/* =====================================================
   WEEK
===================================================== */

function renderWeek() {

    const week =
        getWeekData();


    weekGrid.innerHTML = "";


    week.forEach(day => {

        const date =
            new Date(
                `${day.date}T00:00:00`
            );


        const element =
            document.createElement("div");


        element.className =
            `day ${day.status}`;


        let taskHTML = "";


        if (day.tasks.length === 0) {

            taskHTML = `

                <div class="empty-day">
                    Room to breathe
                </div>

            `;

        } else {

            taskHTML =
                day.tasks.map(task => `

                    <button
                        class="mini-task"
                        data-id="${escapeHTML(task.id)}"
                        type="button"
                    >

                        <span class="mini-dot"></span>

                        <span>

                            <strong>
                                ${escapeHTML(task.name)}
                            </strong>

                            <small>
                                ${escapeHTML(task.effort)}h
                            </small>

                        </span>

                    </button>

                `).join("");
        }


        element.innerHTML = `

            <div class="day-header">

                <span class="day-name">
                    ${day.name.substring(0,3).toUpperCase()}
                </span>

                <span class="day-number">
                    ${date.getDate()}
                </span>

            </div>

            <div class="day-status">

                <span class="status-dot"></span>

                ${capitalize(day.status)}

            </div>

            <div class="day-tasks">
                ${taskHTML}
            </div>

            <div class="day-hours">
                ${day.hours}h planned
            </div>
        `;


        weekGrid.appendChild(element);
    });


    document
        .querySelectorAll(".mini-task")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openEditTask(
                        button.dataset.id
                    )
            );

        });
}


/* =====================================================
   RADAR
===================================================== */

function renderRadar() {

    const week =
        getWeekData();


    radarBars.innerHTML = "";


    if (getTasks().length === 0) {

        radarEmpty.classList.remove(
            "hidden"
        );

        return;
    }


    radarEmpty.classList.add(
        "hidden"
    );


    week.forEach(day => {

        const column =
            document.createElement("div");


        column.className =
            "radar-column";


        const height =
            Math.max(
                6,
                Math.min(
                    100,
                    day.hours * 15
                )
            );


        column.innerHTML = `

            <div class="radar-value">
                ${day.hours}h
            </div>

            <div
                class="radar-bar ${day.status}"
                style="height:${height}%"
            ></div>

            <div class="radar-day">
                ${day.name.charAt(0)}
            </div>

        `;


        radarBars.appendChild(column);
    });
}


/* =====================================================
   SCORE
===================================================== */

function renderScore() {

    const week =
        getWeekData();


    const hours =
        week.reduce(
            (total, day) =>
                total + day.hours,
            0
        );


    const taskCount =
        getTasks().length;


    const overloaded =
        week.filter(
            day =>
                day.status === "overloaded"
        ).length;


    let value =
        Math.round(
            hours / 3.5 +
            overloaded * 1.5 +
            Math.max(
                0,
                taskCount - 5
            ) * .25
        );


    value =
        Math.max(
            1,
            Math.min(
                10,
                value
            )
        );


    let label =
        "Calm week";

    let color =
        "#5B8CFF";


    if (value >= 4) {

        label =
            "Building pressure";

        color =
            "#FFBD61";
    }


    if (value >= 7) {

        label =
            "Heavy week";

        color =
            "#FF6969";
    }


    if (value >= 9) {

        label =
            "High pressure";

        color =
            "#FF4F4F";
    }


    score.textContent =
        value;


    scoreLabel.textContent =
        label;


    totalHours.textContent =
        `${hours}h planned`;


    scoreRing.style.background =
        `
        conic-gradient(
            ${color} ${value * 10}%,
            rgba(91,140,255,.08) ${value * 10}% 100%
        )
        `;
}


/* =====================================================
   ALERT
===================================================== */

function renderAlert() {

    const overloaded =
        getWeekData()
            .filter(
                day =>
                    day.status === "overloaded"
            );


    if (overloaded.length === 0) {

        alertBox.classList.add(
            "hidden"
        );

        return;
    }


    overloaded.sort(
        (a,b) =>
            b.hours - a.hours
    );


    const busiest =
        overloaded[0];


    alertTitle.textContent =
        `⚠ ${busiest.name} looks overloaded.`;


    alertText.textContent =
        `${busiest.taskCount} tasks are competing for attention. Consider starting a high-effort task earlier.`;


    alertBox.classList.remove(
        "hidden"
    );
}


/* =====================================================
   TASKS
===================================================== */

function renderTasks() {

    const tasks =
        [...getTasks()].sort(
            (a,b) =>
                a.date.localeCompare(
                    b.date
                )
        );


    if (tasks.length === 0) {

        taskList.innerHTML = `

            <div class="empty-tasks">

                <strong>
                    Your radar is clear.
                </strong>

                <br>

                Add your first task to understand
                your workload.

            </div>

        `;

        return;
    }


    taskList.innerHTML =
        tasks.map(task => `

            <button
                class="task-row"
                data-id="${escapeHTML(task.id)}"
                type="button"
            >

                <div
                    class="task-icon ${escapeHTML(task.category)}"
                >
                    ${escapeHTML(
                        task.category.charAt(0)
                    )}
                </div>

                <div class="task-info">

                    <strong>
                        ${escapeHTML(task.name)}
                    </strong>

                    <small>
                        ${escapeHTML(task.category)}
                        ·
                        ${readableDate(task.date)}
                    </small>

                </div>

                <span class="effort">
                    ${escapeHTML(task.effort)}h
                </span>

            </button>

        `).join("");


    document
        .querySelectorAll(".task-row")
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    openEditTask(
                        button.dataset.id
                    )
            );

        });
}


/* =====================================================
   SUGGESTIONS
===================================================== */

function renderSuggestions() {

    const tasks =
        getTasks();


    if (tasks.length === 0) {

        suggestions.innerHTML = `

            <article class="suggestion">

                <div class="suggestion-number">
                    01
                </div>

                <p>
                    Add your first task to receive
                    a workload recommendation.
                </p>

            </article>

            <article class="suggestion">

                <div class="suggestion-number">
                    02
                </div>

                <p>
                    We'll identify days where
                    responsibilities overlap.
                </p>

            </article>

            <article class="suggestion">

                <div class="suggestion-number">
                    03
                </div>

                <p>
                    Your suggestions update
                    whenever your workload changes.
                </p>

            </article>

        `;

        return;
    }


    const week =
        getWeekData();


    const recommendations = [];


    const overloaded =
        week.find(
            day =>
                day.status === "overloaded"
        );


    if (overloaded) {

        recommendations.push(
            `${overloaded.name} has ${overloaded.taskCount} tasks competing for attention.`
        );
    }


    const project =
        tasks.find(
            task =>
                task.category === "Project" &&
                Number(task.effort) >= 4
        );


    if (project) {

        recommendations.push(
            `Start "${project.name}" earlier so its ${project.effort} hours aren't left until the deadline.`
        );
    }


    const soon =
        tasks.find(
            task =>
                daysUntil(task.date) >= 0 &&
                daysUntil(task.date) <= 2 &&
                Number(task.effort) >= 2
        );


    if (soon) {

        recommendations.push(
            `"${soon.name}" is approaching and needs about ${soon.effort} hours.`
        );
    }


    if (recommendations.length === 0) {

        recommendations.push(
            "Your current workload looks manageable. Keep checking as new responsibilities appear."
        );

        recommendations.push(
            "Consider starting larger tasks before their deadlines."
        );

        recommendations.push(
            "Leave some breathing room around your busiest day."
        );
    }


    suggestions.innerHTML =
        recommendations
            .slice(0,3)
            .map(
                (text,index) => `

                    <article class="suggestion">

                        <div class="suggestion-number">
                            0${index + 1}
                        </div>

                        <p>
                            ${escapeHTML(text)}
                        </p>

                    </article>

                `
            )
            .join("");
}


/* =====================================================
   REMINDERS
===================================================== */

function renderReminders() {

    const tasks =
        getTasks();


    const reminders = [];


    tasks.forEach(task => {

        const days =
            daysUntil(task.date);


        const effort =
            Number(task.effort);


        if (
            days >= 0 &&
            days <= 2
        ) {

            reminders.push({

                icon: "⏰",

                title:
                    `${task.name} is due ${
                        days === 0
                            ? "today"
                            : days === 1
                                ? "tomorrow"
                                : `in ${days} days`
                    }`,

                text:
                    `${effort}h estimated effort.`

            });

        } else if (
            days >= 3 &&
            days <= 5 &&
            effort >= 4
        ) {

            reminders.push({

                icon: "↗",

                title:
                    `Start ${task.name} early`,

                text:
                    `${effort}h estimated effort with ${days} days remaining.`

            });
        }
    });


    if (reminders.length === 0) {

        reminderList.innerHTML = `

            <div class="no-reminders">

                No urgent reminders right now.
                Your week has some breathing room.

            </div>

        `;

        return;
    }


    reminderList.innerHTML =
        reminders
            .slice(0,5)
            .map(reminder => `

                <div class="reminder">

                    <div class="reminder-icon">
                        ${reminder.icon}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                reminder.title
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                reminder.text
                            )}
                        </p>

                    </div>

                </div>

            `)
            .join("");
}


/* =====================================================
   BROWSER NOTIFICATIONS
===================================================== */

async function enableNotifications() {

    if (!("Notification" in window)) {

        alert(
            "Your browser does not support notifications."
        );

        return;
    }


    const permission =
        await Notification.requestPermission();


    if (permission === "granted") {

        showNotification(
            "PRESSURE // OFF",
            "Smart reminders are now enabled."
        );

        notificationButton.textContent =
            "✓";

        notificationButton2.textContent =
            "Enabled";
    }
}


function showNotification(title,text) {

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {

        new Notification(
            title,
            {
                body: text,
                icon: ""
            }
        );
    }
}


notificationButton.addEventListener(
    "click",
    enableNotifications
);


notificationButton2.addEventListener(
    "click",
    enableNotifications
);


/* =====================================================
   AI WORKLOAD ASSISTANT
===================================================== */

function getWorkloadContext() {

    const tasks =
        getTasks();

    const week =
        getWeekData();


    return {
        tasks,
        week
    };
}


function generateAssistantResponse(question) {

    const lower =
        question.toLowerCase();


    const tasks =
        getTasks();


    const week =
        getWeekData();


    if (tasks.length === 0) {

        return `
            Your workload is currently empty.
            Add some tasks first and I'll help you
            identify pressure points and decide what
            deserves attention.
        `;
    }


    /* TODAY */

    if (
        lower.includes("today") ||
        lower.includes("work on")
    ) {

        const today =
            formatDateKey(
                new Date()
            );


        const todayTasks =
            tasks
                .filter(
                    task =>
                        task.date === today
                )
                .sort(
                    (a,b) =>
                        Number(b.effort) -
                        Number(a.effort)
                );


        if (todayTasks.length > 0) {

            const task =
                todayTasks[0];


            return `
                I'd start with
                <strong>${escapeHTML(task.name)}</strong>.
                It is estimated at ${task.effort} hours
                and is due today.

                <br><br>

                After that, move to the next task with
                the closest deadline.
            `;
        }


        const upcoming =
            [...tasks]
                .sort(
                    (a,b) =>
                        daysUntil(a.date) -
                        daysUntil(b.date)
                )[0];


        return `
            You don't have a task due today.
            I'd use some of today's breathing room to
            get ahead on
            <strong>${escapeHTML(upcoming.name)}</strong>,
            which is due ${readableDate(upcoming.date)}.
        `;
    }


    /* HARDEST DAY */

    if (
        lower.includes("hardest") ||
        lower.includes("busiest") ||
        lower.includes("pressure")
    ) {

        const busiest =
            [...week].sort(
                (a,b) =>
                    b.pressure -
                    a.pressure
            )[0];


        if (busiest.hours === 0) {

            return `
                Your week doesn't have enough scheduled
                work yet for me to identify a pressure point.
            `;
        }


        return `
            <strong>${busiest.name}</strong>
            currently looks like your pressure point.

            <br><br>

            You have
            <strong>${busiest.hours} hours</strong>
            of estimated work across
            <strong>${busiest.taskCount} tasks</strong>.

            <br><br>

            Consider starting one of those tasks
            earlier in the week.
        `;
    }


    /* REDUCE PRESSURE */

    if (
        lower.includes("reduce") ||
        lower.includes("lower") ||
        lower.includes("less")
    ) {

        const busiest =
            [...week].sort(
                (a,b) =>
                    b.hours -
                    a.hours
            )[0];


        const candidate =
            tasks.find(
                task =>
                    task.date === busiest.date
            );


        if (candidate) {

            return `
                Your biggest opportunity is
                <strong>${escapeHTML(candidate.name)}</strong>.

                <br><br>

                It contributes ${candidate.effort} hours
                to ${busiest.name}. If it is flexible,
                consider moving part of the work to an
                earlier or lighter day.
            `;
        }
    }


    /* PROJECT */

    if (
        lower.includes("project")
    ) {

        const project =
            tasks.find(
                task =>
                    task.category === "Project"
            );


        if (project) {

            return `
                Your project
                <strong>${escapeHTML(project.name)}</strong>
                is estimated at ${project.effort} hours.

                <br><br>

                Instead of treating it as one large task,
                spread that effort across several smaller
                sessions before ${readableDate(project.date)}.
            `;
        }
    }


    /* DEFAULT */

    const upcoming =
        [...tasks]
            .sort(
                (a,b) =>
                    daysUntil(a.date) -
                    daysUntil(b.date)
            )[0];


    return `
        Looking at your current workload, I'd keep
        <strong>${escapeHTML(upcoming.name)}</strong>
        near the top of your planning list.

        <br><br>

        It's due ${readableDate(upcoming.date)}
        and has an estimated effort of
        ${upcoming.effort} hours.

        <br><br>

        Prioritize deadline proximity first,
        then use estimated effort to decide what
        to start early.
    `;
}


function addAIMessage(text,type) {

    const message =
        document.createElement("div");


    message.className =
        `ai-message ${type}`;


    if (type === "assistant") {

        message.innerHTML = `

            <span class="message-icon">
                ✦
            </span>

            <p>
                ${text}
            </p>

        `;

    } else {

        message.innerHTML = `

            <p>
                ${escapeHTML(text)}
            </p>

        `;
    }


    aiMessages.appendChild(
        message
    );


    aiMessages.scrollTop =
        aiMessages.scrollHeight;
}


function askAssistant(question) {

    if (!question.trim()) return;


    addAIMessage(
        question,
        "user"
    );


    const response =
        generateAssistantResponse(
            question
        );


    setTimeout(
        () => {

            addAIMessage(
                response,
                "assistant"
            );

        },
        300
    );
}


aiForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const question =
            aiInput.value.trim();


        if (!question) return;


        aiInput.value = "";


        askAssistant(
            question
        );
    }
);


document
    .querySelectorAll(".quick-prompts button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                askAssistant(
                    button.dataset.prompt
                );

            }
        );

    });


/* =====================================================
   TASK MODAL
===================================================== */

function openAddTask() {

    editingTaskId = null;


    modalTitle.textContent =
        "Add a task";


    saveTask.textContent =
        "Add Task";


    deleteTask.classList.add(
        "hidden"
    );


    taskForm.reset();


    taskCategory.value =
        "Homework";


    taskEffort.value =
        "1";


    taskDate.value =
        getWeekDate(0);


    taskModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () =>
            taskName.focus(),
        50
    );
}


addTaskTop.addEventListener(
    "click",
    openAddTask
);


addTaskButton.addEventListener(
    "click",
    openAddTask
);


function openEditTask(id) {

    const task =
        getTasks().find(
            item =>
                item.id === id
        );


    if (!task) return;


    editingTaskId =
        id;


    modalTitle.textContent =
        "Edit task";


    saveTask.textContent =
        "Save changes";


    deleteTask.classList.remove(
        "hidden"
    );


    taskName.value =
        task.name;


    taskCategory.value =
        task.category;


    taskEffort.value =
        task.effort;


    taskDate.value =
        task.date;


    taskModal.classList.remove(
        "hidden"
    );
}


function closeTaskModal() {

    taskModal.classList.add(
        "hidden"
    );

    editingTaskId = null;
}


closeModal.addEventListener(
    "click",
    closeTaskModal
);


cancelModal.addEventListener(
    "click",
    closeTaskModal
);


taskModal.addEventListener(
    "click",
    event => {

        if (
            event.target === taskModal
        ) {

            closeTaskModal();
        }
    }
);


/* =====================================================
   SAVE TASK
===================================================== */

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


        if (
            !name ||
            !date ||
            !effort ||
            effort <= 0
        ) {

            return;
        }


        if (!currentUser) {

            alert(
                "Please log in again."
            );

            return;
        }


        saveTask.disabled = true;


        try {

            /* =================================================
               UPDATE EXISTING TASK
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
                            date

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

                    console.error(error);

                    alert(
                        "Could not update the task."
                    );

                    return;
                }


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


            } else {

                /* =================================================
                   CREATE NEW TASK (CHANGED STRUCTURE)
                ================================================= */

                const { data, error } = await supabaseClient
                    .from("tasks")
                    .insert([
                        {
                            user_id: currentUser.id,
                            name: name,
                            description: category, // using category as description because the form lacks a dedicated description field
                            date: date
                        }
                    ])
                    .select();

                if (error) {
                    console.error("TASK INSERT ERROR:", error);
                    alert("Task error: " + error.message);
                    return;
                }

                console.log("TASK CREATED:", data);

                currentTasks.push(data[0]);
            }


            closeTaskModal();

            renderDashboard();

        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while saving the task."
            );

        } finally {

            saveTask.disabled = false;

        }
    }
);


/* =====================================================
   DELETE
===================================================== */

deleteTask.addEventListener(
    "click",
    async () => {

        if (!editingTaskId) return;


        const confirmed =
            confirm(
                "Delete this task?"
            );


        if (!confirmed) return;


        if (!currentUser) {

            return;
        }


        deleteTask.disabled = true;


        try {

            const {
                error
            } =
                await supabaseClient
                    .from("tasks")
                    .delete()
                    .eq(
                        "id",
                        editingTaskId
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


            if (error) {

                console.error(error);

                alert(
                    "Could not delete the task."
                );

                return;
            }


            currentTasks =
                currentTasks.filter(
                    task =>
                        task.id !==
                        editingTaskId
                );


            closeTaskModal();

            renderDashboard();

        } catch (error) {

            console.error(error);

            alert(
                "Something went wrong while deleting the task."
            );

        } finally {

            deleteTask.disabled = false;

        }
    }
);


/* =====================================================
   UTILITIES
===================================================== */

function capitalize(value) {

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


function escapeHTML(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =====================================================
   INITIALIZE
===================================================== */

async function initialize() {

    try {

        /*
           Supabase restores the login session
           automatically.
        */

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );
        }


        if (data?.session?.user) {

            currentUser =
                data.session.user;


            await loadProfile();

            await loadTasks();

            showApp();

        } else {

            authScreen.classList.remove(
                "hidden"
            );

            app.classList.add(
                "hidden"
            );

            setAuthMode("login");
        }


        if (
            "Notification" in window &&
            Notification.permission ===
                "granted"
        ) {

            notificationButton.textContent =
                "✓";

            notificationButton2.textContent =
                "Enabled";
        }

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );


        authScreen.classList.remove(
            "hidden"
        );

        app.classList.add(
            "hidden"
        );
    }
}


/* =====================================================
   AUTH STATE LISTENER
===================================================== */

supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

        if (event === "SIGNED_OUT") {

            currentUser = null;

            currentProfile = null;

            currentTasks = [];

            return;
        }


        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {

            currentUser =
                session.user;
        }
    }
);


/* =====================================================
   START
===================================================== */

initialize();
