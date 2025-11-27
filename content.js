class Deadline {
    constructor(dueDate, title, description) {
        this.dueDate = dueDate;
        this.title = title;
        this.description = description;
    }
}

let today;

let tabsContainer;
let tabs;
let originalTabValues;

let deadlines = new Set();
let upcoming;
let overdue;
let noDueDate;
let currentDeadlineElements = new Set();

function start() {
    today = new Date();
    const saved = localStorage.getItem("customDeadlines");
    if (saved) {
        deadlines = new Set(JSON.parse(saved).map(obj => new Deadline(obj.dueDate, obj.title, obj.description)));
    }
    updateDistribution();

    waitForElement("div.ConsolidatedDeadlinesWidget__todoHeader___cViri", (element) => {
        if (document.getElementById("personalDeadlineInputButton")) return;
        tabsContainer = document.querySelector('div[data-test-id="consolidatedDeadlinesWidget-tabs-tabs-container"]');
        tabsContainer.addEventListener("click", updateDisplay);

        tabs = Array.from(tabsContainer.children).map((label) => label.querySelector("span"));
        originalTabValues = tabs.map((span) => {
            const match = span.innerHTML.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
        });

        updateDisplay();

        const inputButton = createInputButton(element);
        inputButton.addEventListener("click", () => {
            createPopupWindow(null);
        });
    });
}


(function() {

    let lastUrl = location.href;

    function onUrlChange(url) {
        if (url.includes("courses")) {
            start();
        }
    }

    onUrlChange(lastUrl);

    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            onUrlChange(currentUrl);
        }
    }).observe(document, {subtree: true, childList: true});
})();


function waitForElement(selector, callback) {
    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        }
    }, 100);
}

function createInputButton(container) {
    const inputButton = document.createElement("button");
    inputButton.id = "personalDeadlineInputButton";
    inputButton.innerHTML = "+";
    inputButton.style.width = "30px";
    inputButton.style.height = "30px";
    inputButton.style.fontSize = "20px";
    inputButton.style.border = "2px solid black";
    inputButton.style.borderRadius = "5px";

    const firstDiv = container.querySelector("div.ConsolidatedDeadlinesWidget__todoText___aoSHk");

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "10px";

    container.insertBefore(wrapper, firstDiv);
    wrapper.appendChild(firstDiv);
    wrapper.appendChild(inputButton);
    return inputButton;
}

function createPopupWindow(editingDeadline) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "1000";

    const modal = document.createElement("div");
    modal.style.width = "600px";
    modal.style.height = "500px";
    modal.style.background = "white";
    modal.style.borderRadius = "10px";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";
    modal.style.paddingLeft = "20px";

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "&times;";
    closeButton.style.width = "40px";
    closeButton.style.height = "40px";
    closeButton.style.fontSize = "30px";
    closeButton.style.alignSelf = "flex-end";

    const dueDateLabel = document.createElement("p");
    dueDateLabel.innerHTML = "Due date:";

    const dueDateInput = document.createElement("input");
    dueDateInput.type = "datetime-local";
    dueDateInput.style.width = "150px";
    dueDateInput.style.border = "2px solid black";

    const titleLabel = document.createElement("p");
    titleLabel.innerHTML = "Title:";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.style.width = "560px";
    titleInput.style.border = "2px solid black";

    const descriptionLabel = document.createElement("p");
    descriptionLabel.innerHTML = "Description:";

    const descriptionInput = document.createElement("textarea");
    descriptionInput.style.width = "560px";
    descriptionInput.style.height = "140px";
    descriptionInput.style.resize = "none";
    descriptionInput.style.border = "2px solid black";

    const buttonWrapper = document.createElement("div");
    buttonWrapper.style.display = "flex";
    buttonWrapper.style.gap = "20px";
    buttonWrapper.style.margin = "0 auto";

    const saveButton = document.createElement("button");
    saveButton.innerHTML = "Save";
    saveButton.style.width = "100px";
    saveButton.style.border = "2px solid black";
    saveButton.style.borderRadius = "10px";


    closeButton.addEventListener("click", () => overlay.remove());
    saveButton.addEventListener("click", () => {
        saveDeadline(editingDeadline, dueDateInput.value, titleInput.value, descriptionInput.value);
        overlay.remove();
    });


    modal.appendChild(closeButton);

    modal.appendChild(dueDateLabel);
    modal.appendChild(dueDateInput);

    modal.appendChild(blank());
    modal.appendChild(titleLabel);
    modal.appendChild(titleInput);

    modal.appendChild(blank());
    modal.appendChild(descriptionLabel);
    modal.appendChild(descriptionInput);

    modal.appendChild(blank());
    modal.appendChild(blank());
    buttonWrapper.appendChild(saveButton);
    modal.appendChild(buttonWrapper);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (editingDeadline) {
        dueDateInput.value = editingDeadline.dueDate;
        titleInput.value = editingDeadline.title;
        descriptionInput.value = editingDeadline.description;

        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = "Delete";
        deleteButton.style.width = "100px";
        deleteButton.style.border = "2px solid black";
        deleteButton.style.borderRadius = "10px";
        deleteButton.addEventListener("click", () => {
            deadlines.delete(editingDeadline);
            saveChanges();
            overlay.remove();
        });
        buttonWrapper.insertBefore(deleteButton, saveButton);
    }

    function blank() {
        const blankElement = document.createElement("div");
        blankElement.style.height = "20px";
        return blankElement;
    }
}

function saveDeadline(editingDeadline, dueDate, title, description) {
    deadlines.delete(editingDeadline);
    deadlines.add(new Deadline(dueDate, title, description));
    saveChanges();
}

function saveChanges() {
    localStorage.setItem("customDeadlines", JSON.stringify([...deadlines]));
    updateDistribution();
    updateDisplay();
}

function updateDistribution() {
    upcoming = [];
    overdue = [];
    noDueDate = [];

    for (const deadline of deadlines) {
        const dueDate = deadline.dueDate;
        if (dueDate) {
            if (new Date(dueDate).getTime() > today.getTime()) {
                upcoming.push(deadline);
            } else {
                overdue.push(deadline);
            }
        } else {
            noDueDate.push(deadline);
        }
    }
}

function updateDisplay() {
    updateTabValues();
    waitForElement('div.ConsolidatedDeadlinesWidget__cardsContainer___TL_ZY', (element) => {
        const pane = element.querySelector('div');
        if (pane.classList.contains('ConsolidatedDeadlinesWidget__emptyIllustrationContainer___b9bDW')) {
            const emptyContainer = pane.querySelector('div.TodoEmptyState__container___N3X8h');
            if (emptyContainer) {
                emptyContainer.innerHTML = "";
                emptyContainer.style.height = "0px";
            }
            pane.setAttribute('class', 'ConsolidatedDeadlinesWidget__itemsWrapper___i6tIQ');
        }

        const currentTabName = tabsContainer.querySelector('label[data-checked="true"]').getAttribute("data-test-id").replace(/consolidatedDeadlinesWidget-tabs-tab-(\w+)/, "$1");
        const displayingDeadlines = {
            "UPCOMING": upcoming,
            "OVERDUE": overdue,
            "NODUE": noDueDate
        }[currentTabName];
        currentDeadlineElements.forEach(d => d.remove());
        currentDeadlineElements = new Set();

        for (const d of displayingDeadlines) {
            const currentDueDate = new Date(d.dueDate);
            const deadlineElement = document.createElement("div");
            deadlineElement.className = "ConsolidatedDeadlinesWidget__item___beyKO";

            const dueDateStr = currentTabName === "NODUE" ? "" : dateToStr(currentDueDate);
            deadlineElement.innerHTML = '<div><div class="AssessmentIcon__flex___Te4y5"><span data-ds-version="2.0" class="notranslate inline-flex items-center justify-center select-none capitalize leading-normal font-demibold bg-decorative-background-subtle-violet text-decorative-foreground-subtle-violet object-cover w-9 h-9 rounded-2 light" style="font-size: 15.75px;">PD</span></div></div>'
                                        + '<div class="ConsolidatedDeadlinesWidget__wrapper___bjJSL"><div class="ConsolidatedDeadlinesWidget__middleContainer___ARB7o"><div class="ConsolidatedDeadlinesWidget__nameWithTagContainer____vDz2"><div class="ConsolidatedDeadlinesWidget__heading___BGhvo" dir="auto">'
                                        + d.title
                                        + '</div></div><div class="ConsolidatedDeadlinesWidget__dateText___FGTsx">'
                                        + dueDateStr
                                        + '</div></div><div class="ConsolidatedDeadlinesWidget__middleContainer___ARB7o"><div class="FeedItem__subHeader___l1I5k"><div class="FeedItem__bottomTextTitle___BJO8H">'
                                        + d.description
                                        + '</div></div></div></div>';

            if (dueDateStr.startsWith("Today") || dueDateStr.startsWith("Tomorrow") || currentTabName === "OVERDUE") {
                deadlineElement.querySelector("div.ConsolidatedDeadlinesWidget__dateText___FGTsx").classList.add("ConsolidatedDeadlinesWidget__critical___CJRw4");
                if (currentTabName === "UPCOMING") deadlineElement.classList.add("ConsolidatedDeadlinesWidget__warning___EdIlf");
            }

            let found = false;
            if (currentTabName !== "NODUE") {
                for (const existingDeadline of pane.children) {
                    if (!existingDeadline.classList.contains("ConsolidatedDeadlinesWidget__item___beyKO")) continue;
                    const dueDate = strToDate(existingDeadline.querySelector("div.ConsolidatedDeadlinesWidget__dateText___FGTsx").innerHTML.toLowerCase().trim());
                    if (currentTabName === "UPCOMING" ? dueDate > currentDueDate : dueDate < currentDueDate) {
                        pane.insertBefore(deadlineElement, existingDeadline);
                        found = true;
                        break;
                    }
                }
            }

            deadlineElement.addEventListener("click", () => createPopupWindow(d));

            if (!found) pane.appendChild(deadlineElement);

            currentDeadlineElements.add(deadlineElement);
        }
    });
}

function updateTabValues() {
    tabs[0].innerHTML = format("Upcoming", originalTabValues[0], upcoming);
    tabs[1].innerHTML = format("Overdue", originalTabValues[1], overdue);
    tabs[2].innerHTML = format("No due date", originalTabValues[2], noDueDate);

    function format(label, originalValue, personalDeadlines) {
        const newValue = originalValue + personalDeadlines.length;
        return label + (newValue ? " (" + newValue + ")" : "");
    }
}

function strToDate(str) {
    let date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (str.startsWith("tomorrow")) {
        date.setDate(date.getDate() + 1);
    } else if (!str.startsWith("today")) {
        const datePart = str.split(",")[0];
        const parts = datePart.split(" ");

        const day = parseInt(parts[0], 10);
        const month = ["jan","feb","mar","apr","may","jun", "jul","aug","sep","oct","nov","dec"].indexOf(parts[1].slice(0, 3));
        let year = today.getFullYear();
        if (parts.length === 3) year = parseInt(parts[2], 10);

        date = new Date(year, month, day);
    }

    const timePart = str.split(",")[1].trim();
    const timeMatch = timePart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2] || "0", 10);
    if (timeMatch[3] === "pm" && hours < 12) hours += 12;
    if (timeMatch[3] === "am" && hours === 12) hours = 0;

    date.setHours(hours, minutes, 0, 0);
    return date;
}

function dateToStr(date) {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDifference = Math.round((startOfDate - startOfToday) / 86400000);

    let result;

    if (dayDifference === 0) result = "Today";
    else if (dayDifference === 1) result = "Tomorrow";
    else {
        const months = ["Jan","Feb","Mar","Apr","May","Jun", "Jul","Aug","Sep","Oct","Nov","Dec"];
        result = date.getDate() + " " + months[date.getMonth()];
        if (date.getFullYear() !== today.getFullYear()) result += " " + date.getFullYear();
    }

    let hours = date.getHours();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = (hours - 1) % 12 + 1;
    result += ", " + hours;

    const minutes = date.getMinutes();
    if (minutes > 0) result += ":" + String(minutes).padStart(2, "0");

    result += " " + ampm;

    return result;
}