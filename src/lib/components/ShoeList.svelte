<script>
    import { shoes } from '../data/shoes.js';
    
    export let selectedShoes = [];
    
    function toggleShoe(index) {
        if (selectedShoes.includes(index)) {
            selectedShoes = selectedShoes.filter(i => i !== index);
        } else if (selectedShoes.length < 3) { // Limit to 3 shoes max for comparison
            selectedShoes = [...selectedShoes, index];
        }
    }
    
    function deselectAll() {
        selectedShoes = [];
    }
    
    $: canCompare = selectedShoes.length >= 2;
    $: hasSelections = selectedShoes.length > 0;
    
    export let onCompare = () => {};
</script>

<div class="space-y-8">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-lg font-medium text-black mb-2">select shoes</h2>
            <p class="text-gray-500 text-sm font-mono">choose 2-3 for comparison</p>
        </div>
        {#if hasSelections}
            <button
                on:click={deselectAll}
                class="text-gray-500 hover:text-black text-sm font-mono transition-colors"
            >
                deselect all
            </button>
        {/if}
    </div>
    
    <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {#each shoes as shoe, index}
            <button
                class="p-4 border text-left transition-colors hover:bg-gray-50/50 {selectedShoes.includes(index) ? 'border-black bg-gray-50' : 'border-gray-200'}"
                on:click={() => toggleShoe(index)}
                disabled={!selectedShoes.includes(index) && selectedShoes.length >= 3}
            >
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-medium text-black text-sm">{shoe.name}</h3>
                    {#if selectedShoes.includes(index)}
                        <div class="w-4 h-4 bg-black text-white flex items-center justify-center text-xs">
                            ✓
                        </div>
                    {/if}
                </div>
                <p class="text-xs text-gray-500 font-mono mb-3">{shoe.brand}</p>
                <div class="space-y-1">
                    <p class="text-sm text-black font-mono">${shoe.price}</p>
                    <p class="text-xs text-gray-500 font-mono">{shoe.weightOunces}oz • {shoe.offsetMilimeters}mm</p>
                </div>
            </button>
        {/each}
    </div>
    
    {#if canCompare}
        <div class="flex justify-start">
            <button
                class="px-6 py-2 bg-black text-white text-sm font-mono hover:bg-gray-800 transition-colors"
                on:click={onCompare}
            >
                compare ({selectedShoes.length})
            </button>
        </div>
    {/if}
</div>
