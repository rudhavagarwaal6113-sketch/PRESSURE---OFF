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

const authSubmit =
    document.getElementById("authSubmit");

const authSwitch =
    document.getElementById("authSwitch");

const authTitle =
    document.getElementById("authTitle");

const authMessage =
    document.getElementById("authMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

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


/* =========================================================
   USERNAME → INTERNAL EMAIL
========================================================= */

function usernameToEmail(user) {

    return `${user}@pressure-off.internal`;

}


/* =========================================================
   AUTH MODE
========================================================= */

function setAuthMode(mode) {

    authMode = mode;

    if (authMode === "login") {

        if (authTitle)
            authTitle.textContent = "Welcome Back";

        if (authSubmit)
            authSubmit.textContent = "Login";

        if (authSwitch)
            authSwitch.textContent =
                "Don't have an account? Sign up";

    } else {

        if (authTitle)
            authTitle.textContent = "Create Account";

        if (authSubmit)
            authSubmit.textContent = "Create Account";

        if (authSwitch)
            authSwitch.textContent =
                "Already have an account? Login";

    }

}


/* =========================================================
   AUTH SWITCH
========================================================= */

if (authSwitch) {

    authSwitch.addEventListener(
        "click",
        event => {

            event.preventDefault();

            setAuthMode(
                authMode === "login"
                    ? "signup"
                    : "login"
            );

        }
    );

}


/* =========================================================
   AUTH MESSAGE
========================================================= */

function showAuthMessage(message) {

    if (authMessage) {

        authMessage.textContent =
            message;

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

            const user =
                authUsername.value
                    .trim()
                    .toLowerCase();

            const password =
                authPassword.value;

            if (!user || !password) {

                showAuthMessage(
                    "Please enter username and password."
                );

                return;

            }

            authSubmit.disabled = true;

            showAuthMessage(
                "Please wait..."
            );


            /* =================================================
               SIGNUP
            ================================================= */

            if (authMode === "signup") {

                try {

                    const email =
                        usernameToEmail(user);


                    /* CHECK EXISTING PROFILE */

                    const {
                        data: existingProfile,
                        error: profileCheckError
                    } =
                        await supabaseClient
                            .from("profiles")
                            .select("id")
                            .eq(
                                "username",
                                user
                            )
                            .maybeSingle();


                    if (profileCheckError) {

                        console.error(
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

                                    username: user

                                }

                            }

                        });


                    if (error) {

                        console.error(error);

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

                    await loadTasks();


                    showApp();

                    renderDashboard();


                } catch (error) {

                    console.error(error);

                    showAuthMessage(
                        "Something went wrong while creating account."
                    );

                } finally {

                    authSubmit.disabled = false;

                }

                return;

            }


            /* =================================================
               LOGIN
            ================================================= */

            try {

                /* GET INTERNAL EMAIL */

                const {
                    data: loginEmail,
                    error: rpcError
                } =
                    await supabaseClient.rpc(
                        "get_login_email",
                        {
                            login_username: user
                        }
                    );


                if (rpcError) {

                    console.error(rpcError);

                    showAuthMessage(
                        "Login failed."
                    );

                    return;

                }


                if (!loginEmail) {

                    showAuthMessage(
                        "Username not found."
                    );

                    return;

                }


                /* SIGN IN */

                const {
                    data,
                    error
                } =
                    await supabaseClient.auth.signInWithPassword({

                        email: loginEmail,

                        password: password

                    });


                if (error) {

                    console.error(error);

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

                authSubmit.disabled = false;

            }

        }
    );

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
            "PROFILE LOAD ERROR:",
            error
        );

        return;

    }


    currentProfile =
        data;

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

    if (authScreen)
        authScreen.style.display = "none";

    if (app)
        app.style.display = "block";

}


/* =========================================================
   SHOW AUTH
========================================================= */

function showAuth() {

    if (authScreen)
        authScreen.style.display = "flex";

    if (app)
        app.style.display = "none";

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            currentUser = null;

            currentProfile = null;

            currentTasks = [];

            showAuth();

        }
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getWeekDate(offset) {

    const date =
        new Date();

    date.setDate(
        date.getDate() + offset
    );

    return date
        .toISOString()
        .split("T")[0];

}


function readableDate(dateString) {

    if (!dateString)
        return "";

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
            target - today
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

        week.push({

            date,

            tasks

        });

    }

    return week;

}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    renderTasks();

    renderWeek();

    renderSuggestions();

    renderReminders();

}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    const container =
        document.getElementById(
            "taskList"
        );

    if (!container)
        return;


    container.innerHTML = "";


    const sortedTasks =
        [...currentTasks].sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );


    if (sortedTasks.length === 0) {

        container.innerHTML =
            "<p>No tasks yet.</p>";

        return;

    }


    sortedTasks.forEach(
        task => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "task-item";


            item.innerHTML = `

                <div class="task-info">

                    <h3>
                        ${escapeHtml(task.name)}
                    </h3>

                    <p>
                        ${escapeHtml(task.category || "")}
                    </p>

                </div>

                <div class="task-date">

                    ${readableDate(task.date)}

                </div>

                <div class="task-effort">

                    ${task.effort || 0}

                </div>

                <button
                    onclick="openEditTask(${task.id})"
                >
                    Edit
                </button>

                <button
                    onclick="deleteTask(${task.id})"
                >
                    Delete
                </button>

            `;


            container.appendChild(
                item
            );

        }
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
   RENDER WEEK
========================================================= */

function renderWeek() {

    const container =
        document.getElementById(
            "weekContainer"
        );

    if (!container)
        return;


    const week =
        getWeekData();


    container.innerHTML = "";


    week.forEach(
        day => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "week-day";


            element.innerHTML = `

                <strong>
                    ${readableDate(day.date)}
                </strong>

                <span>
                    ${day.tasks.length}
                    task${day.tasks.length === 1 ? "" : "s"}
                </span>

            `;


            container.appendChild(
                element
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


    const upcoming =
        [...currentTasks]
            .sort(
                (a, b) =>
                    daysUntil(a.date) -
                    daysUntil(b.date)
            )
            .slice(
                0,
                3
            );


    if (!upcoming.length) {

        container.innerHTML =
            "<p>No suggestions yet.</p>";

        return;

    }


    upcoming.forEach(
        task => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "suggestion";


            element.innerHTML = `

                <strong>
                    ${escapeHtml(task.name)}
                </strong>

                <span>
                    Due ${readableDate(task.date)}
                </span>

            `;


            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   REMINDERS
========================================================= */

function renderReminders() {

    const container =
        document.getElementById(
            "reminders"
        );

    if (!container)
        return;


    container.innerHTML = "";


    const reminders =
        currentTasks.filter(
            task => {

                const days =
                    daysUntil(
                        task.date
                    );

                return days >= 0 &&
                       days <= 2;

            }
        );


    if (!reminders.length) {

        container.innerHTML =
            "<p>No upcoming reminders.</p>";

        return;

    }


    reminders.forEach(
        task => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "reminder";


            element.textContent =
                `${task.name} — due ${readableDate(task.date)}`;


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


    if (taskForm)
        taskForm.reset();


    if (taskCategory)
        taskCategory.value =
            "Homework";


    if (taskEffort)
        taskEffort.value =
            "1";


    if (taskDate)
        taskDate.value =
            getWeekDate(0);


    const modal =
        document.getElementById(
            "taskModal"
        );

    if (modal)
        modal.style.display = "flex";

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


    editingTaskId =
        id;


    taskName.value =
        task.name;


    taskCategory.value =
        task.category;


    taskEffort.value =
        task.effort;


    taskDate.value =
        task.date;


    const modal =
        document.getElementById(
            "taskModal"
        );


    if (modal)
        modal.style.display = "flex";

}


/* =========================================================
   CLOSE TASK MODAL
========================================================= */

function closeTaskModal() {

    const modal =
        document.getElementById(
            "taskModal"
        );

    if (modal)
        modal.style.display = "none";


    editingTaskId = null;

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


            saveTask.disabled =
                true;


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

                        console.error(
                            "TASK UPDATE ERROR:",
                            error
                        );

                        alert(
                            "Could not update the task: " +
                            error.message
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


                }


                /* =================================================
                   CREATE NEW TASK
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
                            "Task error: " +
                            error.message
                        );

                        return;

                    }


                    console.log(
                        "TASK CREATED SUCCESSFULLY:",
                        data
                    );


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

}


/* =========================================================
   DELETE TASK
========================================================= */

async function deleteTask(id) {

    if (!currentUser)
        return;


    const confirmed =
        confirm(
            "Delete this task?"
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

        console.error(
            "TASK DELETE ERROR:",
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
            task =>
                task.id !== id
        );


    renderDashboard();

}


/* =========================================================
   AUTH SESSION CHECK
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

        console.error(error);

        showAuth();

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

setAuthMode(
    "login"
);

checkSession();
