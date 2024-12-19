let dice = []; // 自訂骰子列表
let history = []; // 擲骰歷史
let currentPage = 0;
const itemsPerPage = 6; // 每頁顯示6筆
let currentDie = null;
let notes = {}; // 保存日期註解
let selectedDate = null;

// 新增自訂骰子
document.getElementById("add-die").addEventListener("click", () => {
    const name = prompt("Enter dice name:");
    const sides = parseInt(prompt("Enter number of sides:"));
    if (!name || isNaN(sides) || sides < 1) return alert("Invalid input.");

    const faces = [];
    for (let i = 0; i < sides; i++) {
        faces.push(prompt(`Enter text for side ${i + 1}:`) || `Side ${i + 1}`);
    }

    // 檢查名稱唯一性
    if (dice.some(d => d.name === name)) return alert("This die name already exists!");

    // 加入骰子列表
    dice.push({ name, faces, description: "" });
    renderDiceList();
});

// 修改骰子
document.getElementById("modify-die").addEventListener("click", () => {
    const name = prompt("Enter the name of the die to modify:");
    const dieIndex = dice.findIndex(d => d.name === name);
    if (dieIndex === -1) return alert("Die not found.");

    const die = dice[dieIndex];
    const newSides = parseInt(prompt("Enter new number of sides:", die.faces.length));
    if (isNaN(newSides) || newSides < 1) return alert("Invalid number of sides.");

    const newFaces = [];
    for (let i = 0; i < newSides; i++) {
        const prevContent = die.faces[i] || `Side ${i + 1}`;
        newFaces.push(prompt(`Enter text for side ${i + 1}:`, prevContent) || prevContent);
    }

    die.faces = newFaces;
    alert(`Die "${name}" has been updated!`);
    renderDiceList();
});

// 渲染全局骰子列表
function renderDiceList() {
    const diceList = document.getElementById("dice-list");
    diceList.innerHTML = dice
        .map((d, i) => `<div class="dice-item" onclick="selectDie(${i})">${d.name}</div>`)
        .join("");
}

// 選擇骰子並顯示描述
function selectDie(index) {
    currentDie = dice[index];
    document.querySelector(".middle .name").textContent = currentDie.name;
    document.querySelector(".middle .result").textContent = "";
    document.getElementById("description-title").textContent = `Die: ${currentDie.name}`;
    document.getElementById("description-text").value = currentDie.description;
    document.getElementById("roll-die").style.display = "block";
}

// 擲骰並更新結果
document.getElementById("roll-die").addEventListener("click", () => {
    if (!currentDie) return;
    const result = currentDie.faces[Math.floor(Math.random() * currentDie.faces.length)];
    document.querySelector(".middle .result").textContent = result;

    // 記錄歷史結果
    history.unshift({ name: currentDie.name, result, time: new Date().toLocaleString() });
    renderHistory();
});

// 保存骰子描述
document.getElementById("save-description").addEventListener("click", () => {
    if (!currentDie) return;
    currentDie.description = document.getElementById("description-text").value;
});

function renderHistory() {
    const historyDiv = document.getElementById("history");
    historyDiv.innerHTML = ""; // 清空歷史記錄區塊

    // 計算當前頁面顯示的記錄範圍
    const start = currentPage * itemsPerPage;
    const end = Math.min(start + itemsPerPage, history.length);

    for (let i = start; i < end; i++) {
        const entry = history[i];
        const entryDiv = document.createElement("div");
        entryDiv.className = "history-entry";

        // 主記錄內容
        entryDiv.innerHTML = `
            <div>${entry.name}: ${entry.result} (${entry.time})</div>
        `;

        // 註解部分
        const noteDiv = document.createElement("div");
        noteDiv.className = "note"; // 為註解添加 class
        noteDiv.textContent = entry.note || "No note";
        noteDiv.onclick = () => selectHistoryEntry(i); // 點擊註解進行修改
        entryDiv.appendChild(noteDiv);

        historyDiv.appendChild(entryDiv);
    }

    // 顯示分頁按鈕
    document.getElementById("previous-page").disabled = currentPage === 0;
    document.getElementById("next-page").disabled = end >= history.length;
}

function selectHistoryEntry(index) {
    const entry = history[index];
    document.getElementById("description-title").textContent = `Note for ${entry.name}: ${entry.result}`;
    document.getElementById("description-time").textContent = `(${entry.time})`;
    document.getElementById("description-text").value = entry.note || ""; // 顯示該記錄的註記
    document.getElementById("save-description").onclick = () => saveHistoryNote(index); // 保存歷史記錄註記
}

function saveHistoryNote(index) {
    const note = document.getElementById("description-text").value; // 獲取輸入的註記
    history[index].note = note; // 更新對應的歷史記錄
    renderHistory(); // 重新渲染歷史記錄，顯示更新後的註記
}

// 保存註解時同步到歷史記錄
document.getElementById("save-description").addEventListener("click", () => {
    if (selectedDate) {
        notes[selectedDate] = document.getElementById("description-text").value;
    } else if (selectedHistoryIndex !== null) {
        history[selectedHistoryIndex].note = document.getElementById("description-text").value;
        renderHistory();
    }
});

function changePage(delta) {
    currentPage = Math.max(0, currentPage + delta); // 確保頁面不為負數
    renderHistory();
}

function validateDiceStructure() {
    dice.forEach((die, index) => {
        if (!die.name || !Array.isArray(die.faces)) {
            console.error(`Invalid die at index ${index}:`, die);
        }
    });
}

// 導出歷史與骰子
document.getElementById("export-history").addEventListener("click", () => {
    // 確保數據結構正確
    validateDiceStructure();

    const dataToExport = {
        dice: dice.map(die => ({
            name: die.name,
            faces: die.faces,
            description: die.description || ""
        })),
        history
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${new Date().toISOString().slice(0, 10)}_dice_history.json`;
    link.click();
});

// 導入歷史與骰子
document.getElementById("import-history").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);

            if (Array.isArray(data.dice)) {
                dice = data.dice.map(die => ({
                    name: die.name,
                    faces: die.faces || [],
                    description: die.description || ""
                }));
            } else {
                console.error("Invalid dice structure in imported file.");
            }

            if (Array.isArray(data.history)) {
                history = data.history;
            } else {
                console.error("Invalid history structure in imported file.");
            }

            renderDiceList();
            renderHistory();
            alert("History imported successfully!");
        } catch (err) {
            alert("Error importing file. Please ensure the format is correct.");
        }
    };
    reader.readAsText(file);
});

// 初始化年份和月份選單
function initCalendarSelectors() {
    const yearSelect = document.getElementById("year-select");
    const monthSelect = document.getElementById("month-select");

    // 填充年份
    for (let i = 2000; i <= 2100; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }

    // 填充月份
    for (let i = 1; i <= 12; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = i;
        monthSelect.appendChild(option);
    }

    yearSelect.value = new Date().getFullYear();
    monthSelect.value = new Date().getMonth() + 1;

    renderCalendar();
}

// 渲染月曆
function renderCalendar() {
    const year = parseInt(document.getElementById("year-select").value);
    const month = parseInt(document.getElementById("month-select").value) - 1;
    const calendarGrid = document.getElementById("calendar-grid");
    calendarGrid.innerHTML = ""; // 清空月曆

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 填充空白區塊（對齊第一天）
    for (let i = 0; i < firstDay; i++) {
        const blankCell = document.createElement("div");
        blankCell.classList.add("calendar-blank"); // 樣式可選
        calendarGrid.appendChild(blankCell);
    }

    // 填充日期區塊
    for (let day = 1; day <= daysInMonth; day++) {
        const dateCell = document.createElement("div");
        dateCell.textContent = day;
        dateCell.dataset.date = `${year}/${String(month + 1).padStart(2, "0")}/${String(day).padStart(2, "0")}`;
        dateCell.onclick = () => selectDate(dateCell.dataset.date);

        // 如果該日期有註解，標記為紅色
        if (notes[dateCell.dataset.date]) {
            dateCell.style.backgroundColor = "red";
            dateCell.style.color = "white";
            dateCell.style.fontWeight = "bold";
        }

        // 添加日期區塊到月曆
        calendarGrid.appendChild(dateCell);
    }
}

// 選擇日期
function selectDate(date) {
    document.getElementById("description-title").textContent = `Note for ${date}`;
    document.getElementById("description-time").textContent = ""; // 日期無時間戳
    document.getElementById("description-text").value = notes[date] || ""; // 顯示該日期的註記
    document.getElementById("save-description").onclick = () => saveDateNote(date); // 保存日期註記
}

function saveDateNote(date) {
    const note = document.getElementById("description-text").value; // 獲取輸入的註記
    notes[date] = note; // 更新對應的日期註記
    renderCalendar(); // 重新渲染月曆，更新標記
}

// 保存註解
document.getElementById("save-description").addEventListener("click", () => {
    if (!selectedDate) return;
    notes[selectedDate] = document.getElementById("description-text").value;
    renderCalendar(); // 重新渲染月曆
    alert("DateNote saved!");
});

// 初始化日曆
document.getElementById("year-select").addEventListener("change", renderCalendar);
document.getElementById("month-select").addEventListener("change", renderCalendar);

initCalendarSelectors();

document.getElementById("export-txt").addEventListener("click", () => {
    if (!Array.isArray(dice) || !Array.isArray(history)) {
        alert("Data is not initialized properly. Please check your setup.");
        return;
    }

    let txtContent = "";

    // 第一部分：骰子詳細清單
    txtContent += "Dice List:\n";
    txtContent += dice.map(die => {
        const faceList = die.faces.map(face => `        ${face}`).join("\n");
        return `- ${die.name}\n    Description: ${die.description || "No description"}\n    Faces:\n${faceList}`;
    }).join("\n") + "\n\n";

    // 第二部分：歷史記錄按日期分組
    const groupedHistory = groupHistoryByDate(history);
    for (const [date, records] of Object.entries(groupedHistory)) {
        txtContent += `(${date})\n\n`;
        txtContent += notes[date] ? `${notes[date]}\n\n` : "No note for this date.\n\n";

        records.forEach(entry => {
            txtContent += `${entry.name}: ${entry.result} (${entry.time})\n`;
            txtContent += entry.note ? `    ${entry.note}\n` : "    No note.\n";
        });
        txtContent += "\n"; // 每日分隔
    }

    // 創建 TXT 文件並下載
    const blob = new Blob([txtContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${new Date().toISOString().slice(0, 10)}_dice_history.txt`;
    link.click();
});

// 導入TXT
document.getElementById("import-txt").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            parseTxtData(reader.result);
            alert("TXT data imported successfully!");
        } catch (error) {
            alert("Error importing TXT file. Please ensure the format is correct.");
            console.error(error);
        }
    };
    reader.readAsText(file);
});

// 解析 TXT 文件內容
function parseTxtData(txtData) {
    const lines = txtData.split("\n");

    // 清空現有數據
    dice = [];
    history = [];
    notes = {};

    let section = ""; // 標記當前處於哪個部分
    let currentDie = null; // 用於存放當前解析的骰子
    let currentDate = null;

    lines.forEach(line => {
        line = line.trim();
        if (line === "Dice List:") {
            section = "dice";
        } else if (line.startsWith("(") && line.endsWith(")")) {
            section = "date";
            currentDate = line.slice(1, -1); // 提取日期
        } else if (section === "dice" && line.startsWith("- ")) {
            // 新骰子
            currentDie = { name: line.slice(2).trim(), faces: [], description: "" };
            dice.push(currentDie);
        } else if (section === "dice" && line.startsWith("Description:")) {
            if (currentDie) currentDie.description = line.slice(12).trim();
        } else if (section === "dice" && line.startsWith("Faces:")) {
            // 開始讀取骰面
        } else if (section === "dice" && currentDie && line.startsWith("        ")) {
            currentDie.faces.push(line.trim());
        } else if (section === "date" && line) {
            if (!line.includes(":")) {
                // 當日註解
                notes[currentDate] = line;
            } else {
                // 擲骰記錄
                const match = line.match(/^(.*?): (.*?) \((.*?)\)$/);
                if (match) {
                    const [, name, result, time] = match;
                    const entry = { name, result, time, note: "" };
                    history.push(entry);
                }
            }
        } else if (line.startsWith("    ")) {
            // 擲骰記錄的註解
            if (history.length > 0) {
                history[history.length - 1].note = line.trim();
            }
        }
    });

    renderDiceList();
    renderHistory();
    renderCalendar(); // 更新月曆
}

function groupHistoryByDate(history) {
    return history.reduce((acc, entry) => {
        const date = entry.time.split(" ")[0]; // 提取日期部分
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {});
}

// 初始化函數
renderDiceList();
renderHistory();