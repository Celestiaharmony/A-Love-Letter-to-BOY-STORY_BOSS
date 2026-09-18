const SHEET_JSON_URL =
  "https://script.google.com/macros/s/AKfycbzUmvjDVrrpMGV80TOKYsitKdqABRq7afXfexFci0PgWQpDmBdtO14kXvJoJq1ytOcb0A/exec";

let currentLang = "id";
let approvedMessages = [];

const statusText = {
  noneApproved: {
    id: "Belum ada pesan yang disetujui untuk tampil.",
    en: "No messages have been approved to show yet.",
    ko: "아직 공개 승인된 메시지가 없습니다.",
    zh: "目前还没有获批展示的留言。"
  },

  shown: {
    id: count => `${count} pesan ditampilkan.`,
    en: count => `${count} messages shown.`,
    ko: count => `${count}개의 메시지가 표시되었습니다.`,
    zh: count => `已显示 ${count} 条留言。`
  },

  error: {
    id: "Gagal memuat data. Periksa kembali URL Apps Script.",
    en: "Failed to load data. Please check the Apps Script URL.",
    ko: "데이터를 불러오지 못했습니다. Apps Script URL을 확인해주세요.",
    zh: "数据加载失败，请检查 Apps Script URL。"
  }
};

function setLang(lang) {
  currentLang = lang;

  document.querySelectorAll("[data-lang]").forEach(element => {
    element.hidden = element.dataset.lang !== lang;
  });

  document.querySelectorAll("[data-setlang]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.setlang === lang
    );
  });

  document.documentElement.lang = lang;
  updateWallStatus();
}

function initLangSwitch() {
  document.querySelectorAll("[data-setlang]").forEach(button => {
    button.addEventListener("click", () => {
      setLang(button.dataset.setlang);
    });
  });

  setLang("id");
}

function updateYearsCounter() {
  const startYear = 2018;
  const now = new Date().getFullYear();

  const yearsElement =
    document.getElementById("count-years");

  if (yearsElement) {
    yearsElement.textContent = `${now - startYear}+`;
  }

  document.querySelectorAll(".hero-years").forEach(element => {
    element.textContent = now - startYear;
  });
}

function updateStoryCounters(rows) {
  const storiesElement =
    document.getElementById("count-stories");

  const countriesElement =
    document.getElementById("count-countries");

  if (storiesElement) {
    storiesElement.textContent = rows.length;
  }

  const countries = new Set(
    rows
      .map(row =>
        String(row["Country of origin"] || "")
          .trim()
          .toLowerCase()
      )
      .filter(Boolean)
  );

  if (countriesElement) {
    countriesElement.textContent = countries.size;
  }
}

function updateWallStatus() {
  const statusElement =
    document.getElementById("wall-status");

  if (!statusElement) return;

  if (approvedMessages.length === 0) {
    statusElement.textContent =
      statusText.noneApproved[currentLang];

    return;
  }

  statusElement.textContent =
    statusText.shown[currentLang](
      approvedMessages.length
    );
}

function openFanDialog(row) {
  const dialog =
    document.getElementById("fan-dialog");

  const content =
    document.getElementById("dialog-content");

  if (!dialog || !content) return;

  content.innerHTML = "";

  const nickname =
    document.createElement("h2");

  nickname.className = "dialog-nickname";
  nickname.textContent =
    row["Nickname"] || "Anonymous";

  const meta =
    document.createElement("div");

  meta.className = "dialog-meta";
  meta.textContent = [
    row["Country of origin"],
    row["Favorite member"]
      ? `Favorite member: ${row["Favorite member"]}`
      : ""
  ]
    .filter(Boolean)
    .join(" · ");

  content.append(nickname, meta);

  if (
    String(row.publish_photo || "")
      .trim()
      .toLowerCase() === "yes" &&
    row["Upload photo"]
  ) {
    const image =
      document.createElement("img");

    image.className = "dialog-photo";
    image.src = row["Upload photo"];
    image.alt =
      `Photo from ${row["Nickname"] || "fan"}`;

    content.appendChild(image);
  }

  addDialogSection(
    content,
    "How they first knew BOY STORY",
    row[
      "When and how did you first get to know BOY STORY?"
    ]
  );

  addDialogSection(
    content,
    "Favorite moment or song",
    row["Favorite moment or song"]
  );

  addDialogSection(
    content,
    "Message for BOY STORY",
    row["Message for BOY STORY"]
  );

  addDialogSection(
    content,
    "Message for certain members",
    row["Message for certain members"]
  );

  addDialogSection(
    content,
    "Free extras",
    row["Free extras"]
  );

  dialog.showModal();
}

function addDialogSection(container, title, text) {
  if (!text) return;

  const section =
    document.createElement("section");

  section.className = "dialog-section";

  const heading =
    document.createElement("h4");

  heading.textContent = title;

  const paragraph =
    document.createElement("p");

  paragraph.textContent = text;

  section.append(heading, paragraph);
  container.appendChild(section);
}

function initFanDialog() {
  const dialog =
    document.getElementById("fan-dialog");

  const closeButton =
    document.querySelector(".fan-dialog-close");

  if (!dialog || !closeButton) return;

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

async function loadFanWall() {
  const grid =
    document.getElementById("wall-grid");

  if (!grid) return;

  updateYearsCounter();

  try {
    const response =
      await fetch(SHEET_JSON_URL);

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const rows = await response.json();

    if (!Array.isArray(rows)) {
      throw new Error("Data yang diterima bukan array JSON.");
    }

    approvedMessages = rows;

    updateStoryCounters(approvedMessages);

    if (approvedMessages.length === 0) {
      grid.innerHTML = "";
      updateWallStatus();
      return;
    }

    grid.innerHTML = "";

    const cardThemes = [
      "theme-blue",
      "theme-pink",
      "theme-lavender",
      "theme-blush",
      "theme-skyline",
      "theme-white"
    ];

    approvedMessages.forEach((row, index) => {
      const card =
        document.createElement("article");

      card.className =
        `fan-card ${cardThemes[index % cardThemes.length]}`;

      const nickname =
        document.createElement("div");

      nickname.className = "nickname";
      nickname.textContent =
        row["Nickname"] || "Anonymous";

      const country =
        document.createElement("div");

      country.className = "country";
      country.textContent =
        row["Country of origin"] ||
        "Unknown country";

      const member =
        document.createElement("div");

      member.className = "member";
      member.textContent =
        row["Favorite member"]
          ? `Favorite member: ${row["Favorite member"]}`
          : "";

      const message =
        document.createElement("div");

      message.className = "message";
      message.textContent =
        `"${row["Message for BOY STORY"] || "No message."}"`;

      const favorite =
        document.createElement("div");

      favorite.className = "song";
      favorite.textContent =
        row["Favorite moment or song"]
          ? `Favorite moment/song: ${row["Favorite moment or song"]}`
          : "";

      const detail =
        document.createElement("div");

      detail.className = "fan-detail";
      detail.hidden = true;

      const firstStory =
        document.createElement("p");

      firstStory.textContent =
        row[
          "When and how did you first get to know BOY STORY?"
        ] || "";

      const memberMessage =
        document.createElement("p");

      memberMessage.textContent =
        row["Message for certain members"] || "";

      const extras =
        document.createElement("p");

      extras.textContent =
        row["Free extras"] || "";

      detail.append(
        firstStory,
        memberMessage,
        extras
      );

      const readMore =
        document.createElement("button");

      readMore.type = "button";
      readMore.className = "read-more";
      readMore.textContent = "Read more →";

      readMore.addEventListener("click", () => {
        detail.hidden = !detail.hidden;

       const detail =
       document.createElement("div");

      card.append(
        nickname,
        country,
        member,
        message,
        favorite,
        readMore,
        detail
      );

      grid.appendChild(card);
    });

    updateWallStatus();

  } catch (error) {
    console.error(error);

    const statusElement =
      document.getElementById("wall-status");

    if (statusElement) {
      statusElement.textContent =
        statusText.error[currentLang];
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLangSwitch();
  loadFanWall();
});

document.addEventListener("DOMContentLoaded", () => {
  initLangSwitch();
  initFanDialog();
  loadFanWall();
});
