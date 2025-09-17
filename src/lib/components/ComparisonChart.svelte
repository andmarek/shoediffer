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
    
    function getBarWidth(value, field, allValues) {
        const max = Math.max(...allValues.map(shoe => shoe[field.key]));
        const min = Math.min(...allValues.map(shoe => shoe[field.key]));
        const range = max - min || 1;
        return ((value - min) / range) * 100;
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
    <div class="space-y-8">
        <div class="text-center">
            <h2 class="text-2xl font-bold text-gray-900">Shoe Comparison</h2>
            <p class="text-gray-600 mt-2">Comparing {selectedShoeData.length} shoes side by side</p>
        </div>
        
        <!-- Shoe Headers -->
        <div class="grid gap-6" style="grid-template-columns: 200px repeat({selectedShoeData.length}, 1fr);">
            <div></div>
            {#each selectedShoeData as shoe}
                <div class="text-center">
                    <h3 class="font-bold text-lg text-gray-900">{shoe.name}</h3>
                    <p class="text-sm text-gray-600">{shoe.brand}</p>
                </div>
            {/each}
        </div>
        
        <!-- Comparison Rows -->
        <div class="space-y-6">
            {#each fields as field}
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-semibold text-gray-900 mb-4">{field.label}</h4>
                    
                    <div class="grid gap-6" style="grid-template-columns: 200px repeat({selectedShoeData.length}, 1fr);">
                        <div class="flex items-center">
                            <span class="text-sm text-gray-600">Values</span>
                        </div>
                        
                        {#each selectedShoeData as shoe, index}
                            {@const indicator = getBetterIndicator(shoe[field.key], field, selectedShoeData)}
                            <div class="text-center">
                                <div class="text-lg font-bold text-gray-900 mb-2
                                    {indicator === 'best' ? 'text-green-600' : indicator === 'worst' ? 'text-red-600' : ''}">
                                    {formatValue(shoe[field.key], field.type)}
                                    {#if indicator === 'best'}
                                        <span class="text-xs ml-1">👑</span>
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>
                    
                    <!-- Visual Bar Chart -->
                    <div class="grid gap-6 mt-4" style="grid-template-columns: 200px repeat({selectedShoeData.length}, 1fr);">
                        <div class="flex items-center">
                            <span class="text-sm text-gray-600">Visual</span>
                        </div>
                        
                        {#each selectedShoeData as shoe}
                            {@const width = getBarWidth(shoe[field.key], field, selectedShoeData)}
                            {@const indicator = getBetterIndicator(shoe[field.key], field, selectedShoeData)}
                            <div class="flex items-center">
                                <div class="w-full bg-gray-200 rounded-full h-6 relative">
                                    <div 
                                        class="h-6 rounded-full transition-all duration-300
                                            {indicator === 'best' ? 'bg-green-500' : indicator === 'worst' ? 'bg-red-500' : 'bg-blue-500'}"
                                        style="width: {Math.max(width, 10)}%"
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
        
        <!-- Summary Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each selectedShoeData as shoe, index}
                <div class="border border-gray-200 rounded-lg p-4">
                    <h3 class="font-bold text-lg text-gray-900">{shoe.name}</h3>
                    <p class="text-sm text-gray-600 mb-3">{shoe.brand} • {shoe.model}</p>
                    
                    <div class="space-y-2">
                        {#each fields as field}
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">{field.label}:</span>
                                <span class="font-medium">{formatValue(shoe[field.key], field.type)}</span>
                            </div>
                        {/each}
                    </div>
                    
                    {#if shoe.url}
                        <a 
                            href={shoe.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="mt-3 block text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            View Product →
                        </a>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}
