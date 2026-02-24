const CONFIG = {
  proxyUrl: "",
  apiKey: "AIzaSyDtqlBiVuHWKMYEG177_JRfrCmxtg6_IOs",
  sheetId: "1ZP2_w-ck9NIx49kMqdcIufjXh0zmsyOS1NJnAEP6bK4",
  linksRange: "LINKS!A1:E",
  pdfRange: "PDF!A1:C",
  sheetGid: "843153362",
  pdfSheetGid: "0",
  linksCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7IsOHQyx71Xd5P6QHnUVBbMkurdyiPfYXEq1lk-ydqQpi3AoTrndlkN6n5jqUUuLNcncAgvC2zHn_/pub?output=csv",
  pdfCsvUrl: "",
  fallbackData: [
    {
      titulo: "Jornal JubaPop - Fevereiro",
      data: "2026-02-10",
      imagem: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop",
      link: "https://example.com/jornal-fevereiro.pdf",
      tipo: "jornal",
    },
    {
      titulo: "Noite de Louvor",
      data: "2026-03-05",
      imagem: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop",
      link: "https://example.com/evento",
      tipo: "evento",
    },
  ],
  fallbackPdf: [
    {
      data: "2026-02-10",
      link: "https://example.com/jornal-fevereiro.pdf",
      tema: "Esperanca",
    },
  ],
};

const state = {
  items: [],
  activeFilter: "all",
};

const elements = {
  cards: document.getElementById("cards"),
  highlight: document.getElementById("highlight"),
  lastUpdated: document.getElementById("last-updated"),
  toast: document.getElementById("toast"),
  chips: document.querySelectorAll(".chip"),
  todaySection: document.getElementById("today-section"),
  todayCard: document.getElementById("today-card"),
  todayStatus: document.getElementById("today-status"),
};

const csvUrl = CONFIG.linksCsvUrl
  ? CONFIG.linksCsvUrl
  : `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/export?format=csv&gid=${CONFIG.sheetGid}`;
const pdfCsvUrl = CONFIG.pdfCsvUrl
  ? CONFIG.pdfCsvUrl
  : `https://docs.google.com/spreadsheets/d/${CONFIG.sheetId}/export?format=csv&gid=${CONFIG.pdfSheetGid}`;

const showToast = (message) => {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift());
  return lines
    .map((line) => {
      const values = parseCsvLine(line);
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      return entry;
    })
    .filter((entry) => entry.titulo);
};

const parsePdfCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (!lines.length) return [];

  const firstRow = parseCsvLine(lines[0]).map((value) => value.toLowerCase());
  const hasHeader = firstRow.includes("data") || firstRow.includes("link");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => parseCsvLine(line))
    .map((values) => ({
      data: values[0] || "",
      link: values[1] || "",
      tema: values[2] || "",
    }))
    .filter((entry) => entry.link);
};

const normalizeHeader = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

const mapRowsWithHeader = (rows, expectedHeaders, fallbackMap) => {
  if (!rows.length) return [];
  const normalizedExpected = expectedHeaders.map((header) => normalizeHeader(header));
  const headers = rows[0].map((value) => normalizeHeader(value));
  const hasHeader = headers.some((header) => normalizedExpected.includes(header));
  const dataRows = hasHeader ? rows.slice(1) : rows;

  if (hasHeader) {
    return dataRows.map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = row[index] || "";
      });
      return entry;
    });
  }

  return dataRows.map(fallbackMap);
};

const normalizeItems = (items) => {
  return items.map((item) => ({
    titulo: item.titulo,
    data: item.data,
    imagem: item.imagem,
    link: item.link,
    tipo: item.tipo || "link",
  }));
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const parseDateFlexible = (value) => {
  if (!value) return null;
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime())) return iso;
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => parseInt(part, 10));
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }
  return null;
};

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const renderHighlight = (item) => {
  if (!item) return;
  elements.highlight.innerHTML = `
    <img src="${item.imagem}" alt="${item.titulo}" />
    <h3>${item.titulo}</h3>
    <span>${formatDate(item.data)}</span>
    <a href="${item.link}" target="_blank" rel="noreferrer">Abrir</a>
  `;
};

const renderCards = (items) => {
  elements.cards.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <img src="${item.imagem}" alt="${item.titulo}" />
          <div class="card__body">
            <span class="card__tag">${item.tipo}</span>
            <div class="card__title">${item.titulo}</div>
            <div class="card__date">${formatDate(item.data)}</div>
            <a class="card__link" href="${item.link}" target="_blank" rel="noreferrer">Abrir</a>
          </div>
        </article>
      `
    )
    .join("");
};

const renderTodayJournal = (entry) => {
  if (!entry) {
    elements.todayStatus.textContent = "Nenhum jornal para hoje";
    elements.todayCard.innerHTML = `
      <div class="today__info">
        <div class="today__title">Nenhum jornal cadastrado</div>
        <div class="card__date">Volte mais tarde</div>
      </div>
    `;
    return;
  }

  elements.todayStatus.textContent = "Disponivel agora";
  elements.todayCard.innerHTML = `
    <div class="today__info">
      <div class="today__title">Jornal do dia ${formatDate(entry.data)}</div>
      <div class="card__date">${entry.tema || "Clique para abrir o PDF"}</div>
    </div>
    <a class="today__link" href="${entry.link}" target="_blank" rel="noreferrer">Abrir jornal</a>
  `;
};

const fetchSheetValues = async (range) => {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.sheetId}/values/${encodedRange}?key=${CONFIG.apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Sheets API not reachable");
  }
  const data = await response.json();
  return data.values || [];
};

const fetchLinks = async () => {
  if (CONFIG.proxyUrl) {
    const response = await fetch(`${CONFIG.proxyUrl}/api/links`);
    if (!response.ok) {
      throw new Error("Proxy not reachable");
    }
    const data = await response.json();
    return normalizeItems(data);
  }

  if (CONFIG.apiKey) {
    const rows = await fetchSheetValues(CONFIG.linksRange);
    const items = mapRowsWithHeader(
      rows,
      ["titulo", "data", "imagem", "link", "tipo"],
      (row) => ({
        titulo: row[0] || "",
        data: row[1] || "",
        imagem: row[2] || "",
        link: row[3] || "",
        tipo: row[4] || "",
      })
    );
    return normalizeItems(items);
  }

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error("Sheet not reachable");
  }
  const csvText = await response.text();
  return normalizeItems(parseCsv(csvText));
};

const fetchPdf = async () => {
  if (CONFIG.proxyUrl) {
    const response = await fetch(`${CONFIG.proxyUrl}/api/pdf`);
    if (!response.ok) {
      throw new Error("Proxy not reachable");
    }
    const data = await response.json();
    return data;
  }

  if (CONFIG.apiKey) {
    const rows = await fetchSheetValues(CONFIG.pdfRange);
    return mapRowsWithHeader(rows, ["data", "link", "tema"], (row) => ({
      data: row[0] || "",
      link: row[1] || "",
      tema: row[2] || "",
    })).filter((entry) => entry.link);
  }

  const response = await fetch(pdfCsvUrl);
  if (!response.ok) {
    throw new Error("Sheet not reachable");
  }
  const csvText = await response.text();
  return parsePdfCsv(csvText);
};

const applyFilter = (filter) => {
  state.activeFilter = filter;
  elements.chips.forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.filter === filter);
  });

  const filtered =
    filter === "all"
      ? state.items
      : state.items.filter((item) => item.tipo === filter);

  renderCards(filtered);
};

const bindFilters = () => {
  elements.chips.forEach((chip) => {
    chip.addEventListener("click", () => applyFilter(chip.dataset.filter));
  });
};

const loadData = async () => {
  try {
    if (CONFIG.sheetId === "COLOQUE_O_ID_DA_PLANILHA") {
      throw new Error("Missing sheet id");
    }

    const [items, pdfData] = await Promise.all([fetchLinks(), fetchPdf()]);

    if (!items.length) {
      throw new Error("Empty data");
    }

    state.items = items;
    elements.lastUpdated.textContent = `Atualizado em ${new Date().toLocaleDateString("pt-BR")}`;
    elements.todayStatus.textContent = "Atualizado agora";

    const todayKey = toDateKey(new Date());
    const todayEntry = pdfData.find((entry) => {
      const parsed = parseDateFlexible(entry.data);
      return parsed && toDateKey(parsed) === todayKey;
    });
    renderTodayJournal(todayEntry);
  } catch (error) {
    state.items = CONFIG.fallbackData;
    elements.lastUpdated.textContent = "Usando dados de exemplo";
    elements.todayStatus.textContent = "Usando dados de exemplo";
    showToast("Planilha nao encontrada. Mostrando exemplo.");
    renderTodayJournal(CONFIG.fallbackPdf[0]);
  }

  renderHighlight(state.items[0]);
  applyFilter(state.activeFilter);
};

bindFilters();
loadData();
