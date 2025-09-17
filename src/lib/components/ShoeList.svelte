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
    
    $: canCompare = selectedShoes.length >= 2;
    
    export let onCompare = () => {};
</script>

<div class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">Select Shoes to Compare</h2>
    <p class="text-gray-600">Choose 2-3 shoes to see a side-by-side comparison</p>
    
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each shoes as shoe, index}
            <button
                class="p-4 border rounded-lg text-left transition-colors hover:bg-gray-50 {selectedShoes.includes(index) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
                on:click={() => toggleShoe(index)}
                disabled={!selectedShoes.includes(index) && selectedShoes.length >= 3}
            >
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-gray-900">{shoe.name}</h3>
                    {#if selectedShoes.includes(index)}
                        <div class="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                            ✓
                        </div>
                    {/if}
                </div>
                <p class="text-sm text-gray-600">{shoe.brand}</p>
                <div class="mt-2 space-y-1">
                    <p class="text-sm text-gray-800">${shoe.price}</p>
                    <p class="text-sm text-gray-600">{shoe.weightOunces}oz • {shoe.offsetMilimeters}mm drop</p>
                </div>
            </button>
        {/each}
    </div>
    
    {#if canCompare}
        <div class="flex justify-center">
            <button
                class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                on:click={onCompare}
            >
                Compare {selectedShoes.length} Shoes
            </button>
        </div>
    {/if}
</div>
