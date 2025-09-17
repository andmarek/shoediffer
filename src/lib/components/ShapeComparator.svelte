<script>
    import { shoes } from '../data/shoes.js';
    
    export let selectedShoes = [];
    export let isOpen = false;
    export let onClose = () => {};
    
    let colors = ['#3b82f6', '#ef4444', '#10b981'];
    let shoeLength = 300;
    let svgWidth = 400;
    let svgHeight = 240;
    
    // Convert indices to actual shoe objects
    $: selectedShoeData = selectedShoes.map(index => shoes[index]);
    
    // Get data range for better scaling
    $: allHeelValues = selectedShoeData.map(shoe => shoe.heelStackMm || 0);
    $: allForeValues = selectedShoeData.map(shoe => shoe.forefootStackMm || 0);
    $: allValues = [...allHeelValues, ...allForeValues];
    
    $: minValue = Math.min(...allValues);
    $: maxValue = Math.max(...allValues);
    $: dataRange = maxValue - minValue;
    
    // Use a more focused scale - use most of the available height for the actual data range
    $: availableHeight = 140; // pixels available for the data
    $: scaleFactor = dataRange > 0 ? availableHeight / (dataRange + 10) : 1; // Add 10mm padding
    
    function getShoePoints(shoe, index) {
        // Scale relative to the minimum value to show differences better
        const heelHeight = ((shoe.heelStackMm || 0) - minValue + 5) * scaleFactor; // +5mm for visual padding
        const foreHeight = ((shoe.forefootStackMm || 0) - minValue + 5) * scaleFactor;
        const baseY = svgHeight - 50; // Same baseline for all shoes to enable direct comparison
        
        return {
            heel: { x: 50, y: baseY - heelHeight },
            forefoot: { x: 50 + shoeLength, y: baseY - foreHeight },
            heelBase: { x: 50, y: baseY },
            forefootBase: { x: 50 + shoeLength, y: baseY }
        };
    }
    
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
    
    function handleKeydown(event) {
        if (event.key === 'Escape') {
            onClose();
        }
    }
</script>

{#if isOpen}
    <div 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        role="dialog" 
        aria-modal="true"
        on:click={handleBackdropClick}
        on:keydown={handleKeydown}
        tabindex="0"
    >
        <div class="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-medium text-black">Shape comparison</h2>
                <button 
                    class="text-gray-400 hover:text-gray-600 text-xl"
                    on:click={onClose}
                >
                    ✕
                </button>
            </div>
            
            {#if selectedShoeData.length > 0}
                <div class="bg-gray-50 rounded-lg border border-gray-200 p-8">
                    <svg width="100%" height="280" viewBox="0 0 {svgWidth} {svgHeight}" class="w-full h-full">
                        <!-- Background -->
                        <rect width="100%" height="100%" fill="white"/>
                        
                        <!-- Base line -->
                        <line x1="40" y1="{svgHeight - 30}" x2="{svgWidth - 40}" y2="{svgHeight - 30}" stroke="#e5e7eb" stroke-width="1"/>
                        
                        {#each selectedShoeData as shoe, index}
                            {@const points = getShoePoints(shoe, index)}
                            {@const color = colors[index % colors.length]}
                            
                            <!-- Simple line showing shoe profile -->
                            <line 
                                x1={points.heel.x} 
                                y1={points.heel.y}
                                x2={points.forefoot.x}
                                y2={points.forefoot.y}
                                stroke={color}
                                stroke-width="3"
                            />
                            
                            <!-- Simple points -->
                            <circle 
                                cx={points.heel.x} 
                                cy={points.heel.y} 
                                r="4" 
                                fill={color}
                            />
                            
                            <circle 
                                cx={points.forefoot.x} 
                                cy={points.forefoot.y} 
                                r="4" 
                                fill={color}
                            />
                            
                            <!-- Simple labels -->
                            <text 
                                x={points.heel.x} 
                                y={points.heel.y - 12} 
                                class="text-xs fill-gray-600 text-anchor-middle"
                                text-anchor="middle"
                            >
                                {shoe.heelStackMm}mm
                            </text>
                            
                            <text 
                                x={points.forefoot.x} 
                                y={points.forefoot.y - 12} 
                                class="text-xs fill-gray-600 text-anchor-middle"
                                text-anchor="middle"
                            >
                                {shoe.forefootStackMm}mm
                            </text>
                        {/each}
                        
                        <!-- Simple axis labels -->
                        <text x="60" y="{svgHeight - 10}" class="text-sm fill-gray-500">Heel</text>
                        <text x="{svgWidth - 80}" y="{svgHeight - 10}" class="text-sm fill-gray-500">Forefoot</text>
                    </svg>
                </div>
                
                <!-- Simple legend -->
                <div class="mt-8 space-y-3">
                    {#each selectedShoeData as shoe, index}
                        {@const color = colors[index % colors.length]}
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div class="flex items-center gap-3">
                                <div 
                                    class="w-4 h-4 rounded-full"
                                    style="background-color: {color}"
                                ></div>
                                <span class="text-sm font-medium">{shoe.name}</span>
                            </div>
                            <div class="text-sm text-gray-500">
                                {shoe.heelStackMm}mm → {shoe.forefootStackMm}mm ({shoe.offsetMilimeters}mm drop)
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="text-center py-12 text-gray-500">
                    Select shoes to compare their shapes
                </div>
            {/if}
        </div>
    </div>
{/if}
