<script>
    import { shoes, getComparableFields } from '../data/shoes.js';
    
    export let selectedShoes = [];
    
    $: selectedShoeData = selectedShoes.map(index => shoes[index]);
    $: fields = getComparableFields();
    
    function formatValue(value, type) {
        if (type === 'currency') return `$${value}`;
        if (type === 'number') return value.toString();
        return value;
    }
    
    function getBetterIndicator(value, field, allValues) {
        const max = Math.max(...allValues.map(shoe => shoe[field.key]));
        const min = Math.min(...allValues.map(shoe => shoe[field.key]));
        
        // Lower is better for weight and price, higher for drop depends on preference
        if (field.key === 'price' || field.key === 'weightOunces') {
            return value === min ? 'best' : value === max ? 'worst' : 'neutral';
        }
        return 'neutral';
    }
</script>

{#if selectedShoeData.length > 0}
    <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-12">
            <h2 class="text-lg font-medium text-black mb-2">comparison</h2>
            <p class="text-gray-500 text-sm font-mono">{selectedShoeData.length} shoes</p>
        </div>
        
        <!-- Main Comparison Table -->
        <div class="bg-white border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <!-- Table Header -->
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-4 py-3 text-left">
                                <span class="text-xs font-mono text-gray-500">spec</span>
                            </th>
                            {#each selectedShoeData as shoe}
                                <th class="px-4 py-3 text-center min-w-[160px]">
                                    <div class="space-y-1">
                                        <p class="font-medium text-black text-sm">{shoe.name}</p>
                                        <p class="text-xs text-gray-500 font-mono">{shoe.brand}</p>
                                        <p class="text-xs text-gray-500 font-mono">
                                            ${shoe.price} | {shoe.weightOunces}oz
                                        </p>
                                        {#if shoe.url}
                                            <a 
                                                href={shoe.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                class="inline-flex items-center gap-1 text-xs font-mono text-gray-600 hover:text-black transition-colors"
                                            >
                                                view ↗
                                            </a>
                                        {/if}
                                    </div>
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    
                    <!-- Table Body -->
                    <tbody class="divide-y divide-gray-200">
                        {#each fields as field, fieldIndex}
                            <tr>
                                <td class="px-4 py-3 font-mono text-black text-sm">
                                    {field.label}
                                </td>
                                {#each selectedShoeData as shoe}
                                    {@const indicator = getBetterIndicator(shoe[field.key], field, selectedShoeData)}
                                    <td class="px-4 py-3 text-center">
                                        <div class="flex flex-col items-center space-y-1">
                                            <span class="text-sm font-mono text-black
                                                {indicator === 'best' ? 'text-green-600' : indicator === 'worst' ? 'text-red-600' : ''}">
                                                {formatValue(shoe[field.key], field.type)}
                                            </span>
                                            {#if indicator === 'best'}
                                                <span class="text-xs font-mono text-green-600">
                                                    best
                                                </span>
                                            {:else if indicator === 'worst'}
                                                <span class="text-xs font-mono text-red-600">
                                                    worst
                                                </span>
                                            {/if}
                                        </div>
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        

    </div>
{/if}
