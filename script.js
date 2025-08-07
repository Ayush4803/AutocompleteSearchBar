// -------- TRIE IMPLEMENTATION --------
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (let char of word.toLowerCase()) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  searchPrefix(prefix) {
    let node = this.root;
    for (let char of prefix.toLowerCase()) {
      if (!node.children[char]) return null;
      node = node.children[char];
    }
    return node;
  }

  getWordsFromNode(node, prefix) {
    let results = [];
    if (node.isEndOfWord) results.push(prefix);

    for (let char in node.children) {
      results = results.concat(this.getWordsFromNode(node.children[char], prefix + char));
    }
    return results;
  }

  autocomplete(prefix) {
    const node = this.searchPrefix(prefix);
    if (!node) return [];
    return this.getWordsFromNode(node, prefix);
  }
}

// -------- INITIAL SETUP --------
const trie = new Trie();
const initialWords = ["apple", "application", "banana", "band", "cat", "dog"];
initialWords.forEach(word => trie.insert(word));

const input = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("suggestions");

// -------- SEARCH HISTORY --------
let searchHistory = [];

// -------- DEBOUNCE --------
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// -------- API FETCH --------
async function fetchFromAPI(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${query}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const results = data[1];

    // Cache in Trie
    results.forEach(word => trie.insert(word));

    return results;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

// -------- SHOW SUGGESTIONS --------
function showSuggestions(suggestions, isHistory = false) {
  suggestionsBox.innerHTML = "";
  if (suggestions.length === 0) return;

  suggestions.forEach(s => {
    const div = document.createElement("div");
    div.classList.add("suggestion-item");

    // Icon
    const icon = document.createElement("i");
    icon.textContent = isHistory ? "⏳" : "🔍";

    const text = document.createElement("span");
    text.textContent = s;

    div.appendChild(icon);
    div.appendChild(text);

    div.addEventListener("click", () => {
      input.value = s;
      suggestionsBox.innerHTML = "";

      if (!searchHistory.includes(s)) {
        searchHistory.unshift(s);
        if (searchHistory.length > 5) searchHistory.pop();
      }
    });

    suggestionsBox.appendChild(div);
  });
}

// -------- HANDLE SEARCH --------
async function handleSearch() {
  const query = input.value.trim().toLowerCase();
  suggestionsBox.innerHTML = "";

  if (!query) {
    if (searchHistory.length > 0) {
      showSuggestions(searchHistory, true);
    }
    return;
  }

  let suggestions = trie.autocomplete(query);

  if (suggestions.length === 0) {
    suggestions = await fetchFromAPI(query);
  }

  showSuggestions(suggestions);
}

// -------- EVENT LISTENER --------
input.addEventListener("keyup", debounce(handleSearch, 300));
