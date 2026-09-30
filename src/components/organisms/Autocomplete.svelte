<script lang="ts">
  let { initialQuery = '', onsearch } = $props<{
    initialQuery?: string;
    onsearch?: (query: string) => void;
  }>();

  let query = $state(initialQuery);
  let suggestions = $state<string[]>([]);
  let isOpen = $state(false);
  let timer: any = null;

  const hasQuery = $derived(query.trim().length > 0);

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    query = value;

    if (timer) clearTimeout(timer);

    if (value.trim().length >= 2) {
      timer = setTimeout(fetchSuggestions, 300);
    } else {
      suggestions = [];
      isOpen = false;
    }
  }

  async function fetchSuggestions() {
    try {
      const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        suggestions = data.suggestions || [];
        isOpen = suggestions.length > 0;
      }
    } catch {
      suggestions = [];
    }
  }

  function selectSuggestion(text: string) {
    query = text;
    isOpen = false;
    triggerSearch(text);
  }

  function triggerSearch(text: string) {
    if (!text.trim()) return;
    if (onsearch) {
      onsearch(text);
    } else {
      window.location.href = `/search?q=${encodeURIComponent(text.trim())}`;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      isOpen = false;
      triggerSearch(query);
    }
  }
</script>

<div class="relative w-full max-w-2xl mx-auto">
  <div
    class="relative flex items-center w-full transition-all bg-white dark:bg-slate-900 border rounded-full shadow-sm hover:shadow-md border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500"
  >
    <div class="pe-3 ps-4 text-slate-400">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <input
      type="text"
      value={query}
      oninput={handleInput}
      onkeydown={handleKeydown}
      placeholder="ابحث في الويب أو أدخل رابطاً..."
      dir="auto"
      class="w-full py-3 pe-4 text-sm bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0"
    />

    {#if hasQuery}
      <button
        type="button"
        onclick={() => { query = ''; suggestions = []; isOpen = false; }}
        class="p-1 me-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>

  <!-- Instant Autocomplete Suggestions Dropdown -->
  {#if isOpen && suggestions.length > 0}
    <div class="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-right">
      <ul class="py-2 divide-y divide-slate-100 dark:divide-slate-800/50">
        {#each suggestions as item}
          <li>
            <button
              type="button"
              onclick={() => selectSuggestion(item)}
              class="w-full px-5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between transition-colors"
            >
              <span>{item}</span>
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
