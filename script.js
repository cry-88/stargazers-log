const repositoryList = document.querySelector("#repository-list");
const repositoryCount = document.querySelector("#repository-count");
const listStatus = document.querySelector("#list-status");

const numberFormat = new Intl.NumberFormat();
const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function createRepositoryItem(event, index) {
  const repository = event.repository ?? {};
  const item = document.createElement("li");
  item.className = "repository-item";

  const number = document.createElement("span");
  number.className = "item-number";
  number.textContent = String(index + 1).padStart(2, "0");
  item.append(number);

  const details = document.createElement("div");
  const name = document.createElement("a");
  name.className = "repo-name";
  name.textContent = repository.name || repository.full_name || "Unnamed repository";

  if (typeof repository.html_url === "string") {
    try {
      const url = new URL(repository.html_url);
      if (url.protocol === "https:") {
        name.href = url.href;
        name.target = "_blank";
        name.rel = "noopener noreferrer";
      }
    } catch {
      // Keep the repository name as plain text when its URL is invalid.
    }
  }

  details.append(name);

  if (repository.full_name) {
    const fullName = document.createElement("p");
    fullName.className = "repo-full-name";
    fullName.textContent = repository.full_name;
    details.append(fullName);
  }

  if (repository.description) {
    const description = document.createElement("p");
    description.className = "repo-description";
    description.textContent = repository.description;
    details.append(description);
  }

  item.append(details);

  const metadata = document.createElement("div");
  metadata.className = "repo-meta";

  if (repository.language) {
    const language = document.createElement("span");
    language.className = "repo-language";
    const mark = document.createElement("span");
    mark.className = "language-mark";
    mark.setAttribute("aria-hidden", "true");
    language.append(mark, document.createTextNode(repository.language));
    metadata.append(language);
  }

  if (Number.isFinite(repository.stargazers_count)) {
    const stars = document.createElement("span");
    stars.textContent = `${numberFormat.format(repository.stargazers_count)} stars`;
    metadata.append(stars);
  }

  if (event.starred_at) {
    const date = new Date(event.starred_at);
    if (!Number.isNaN(date.getTime())) {
      const time = document.createElement("time");
      time.dateTime = date.toISOString();
      time.textContent = `Starred ${dateFormat.format(date)}`;
      metadata.append(time);
    }
  }

  item.append(metadata);
  return item;
}

async function loadRepositories() {
  try {
    const response = await fetch("./events.json");
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const events = await response.json();
    if (!Array.isArray(events)) {
      throw new Error("Repository data must be a list");
    }

    const validEvents = events.filter((event) => (
      event !== null
      && typeof event === "object"
      && !Array.isArray(event)
      && event.repository !== null
      && typeof event.repository === "object"
      && !Array.isArray(event.repository)
    ));

    repositoryCount.textContent = numberFormat.format(validEvents.length);
    repositoryList.replaceChildren();

    if (validEvents.length === 0) {
      const emptyState = document.createElement("li");
      emptyState.className = "empty-state";
      emptyState.textContent = "No starred repositories yet.";
      repositoryList.append(emptyState);
      listStatus.textContent = "Nothing here yet";
      return;
    }

    validEvents.forEach((event, index) => {
      repositoryList.append(createRepositoryItem(event, index));
    });
    listStatus.textContent = `${numberFormat.format(validEvents.length)} repositories`;
  } catch (error) {
    repositoryCount.textContent = "0";
    listStatus.textContent = "Could not load repositories";
    const errorState = document.createElement("li");
    errorState.className = "empty-state";
    errorState.textContent = "Could not load repositories. Check your connection and the events.json file, then reload the page.";
    repositoryList.replaceChildren(errorState);
    console.error("Could not load starred repositories:", error);
  }
}

loadRepositories();