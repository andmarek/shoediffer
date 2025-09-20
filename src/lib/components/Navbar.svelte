<script>
    export let activeTab = 'compare';
    
    const tabs = [
        { id: 'compare', label: 'compare shoes' },
        { id: 'rotation', label: 'build rotation' }
    ];
    
    export let onTabChange = () => {};
    
    function handleTabClick(tabId) {
        activeTab = tabId;
        onTabChange(tabId);
    }
</script>

<nav class="border-b border-gray-200 mb-8">
    <div class="flex space-x-8">
        {#each tabs as tab}
            <button
                class="pb-4 text-sm font-mono transition-colors relative
                    {activeTab === tab.id 
                        ? 'text-black border-b-2 border-black' 
                        : 'text-gray-500 hover:text-black'}"
                on:click={() => handleTabClick(tab.id)}
            >
                {tab.label}
            </button>
        {/each}
    </div>
</nav>
