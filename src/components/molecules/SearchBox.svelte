<script lang="ts">
  let { initialQuery = '', onsearch } = $props<{
    initialQuery?: string;
    onsearch?: (query: string) => void;
  }>();

  let query = $state(initialQuery);
  let isFocused = $state(false);

  const hasQuery = $derived(query.trim().length > 0);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && hasQuery) {
      if (onsearch) onsearch(query);
      else {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    }
  }

  function handleClear() {
    query = '';
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
      bind:value={query}
      onkeydown={handleKeydown}
      onfocus={() => (isFocused = true)}
      onblur={() => (isFocused = false)}
      placeholder="ابحث في الويب أو أدخل رابطاً..."
      dir="auto"
      class="w-full py-3 pe-4 text-sm bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-0"
    />

    {#if hasQuery}
      <button
        type="button"
        onclick={handleClear}
        class="p-1 me-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
        aria-label="مسح البحث"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
</div>
