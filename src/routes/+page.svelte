<script>
    import ShoeList from '../lib/components/ShoeList.svelte';
    import ComparisonChart from '../lib/components/ComparisonChart.svelte';
    import ShapeComparator from '../lib/components/ShapeComparator.svelte';
    
    let selectedShoes = [];
    let showComparison = false;
    let showShapeComparator = false;
    
    function handleCompare() {
        showComparison = true;
    }
    
    function goBack() {
        showComparison = false;
    }
    
    function openShapeComparator() {
        showShapeComparator = true;
    }
    
    function closeShapeComparator() {
        showShapeComparator = false;
    }
</script>

<svelte:head>
    <title>Shoediffer - Compare Running Shoes</title>
    <meta name="description" content="Compare running shoes side by side to find your perfect match" />
</svelte:head>

<main class="min-h-screen bg-white">
    <div class="max-w-6xl mx-auto px-6 py-12">
        <header class="mb-16">
            <h1 class="text-2xl font-medium text-black mb-3 tracking-tight">shoediffer</h1>
            <p class="text-gray-500 text-sm font-mono">your one stop shop for more information about running shoes than you needed</p>
        </header>
        
        {#if !showComparison}
            <ShoeList bind:selectedShoes onCompare={handleCompare} />
        {:else}
            <div class="space-y-8">
                <div class="flex items-center justify-between">
                    <button 
                        on:click={goBack}
                        class="text-black hover:text-gray-600 text-sm font-mono transition-colors"
                    >
                        ← back
                    </button>
                    <button 
                        on:click={openShapeComparator}
                        class="bg-black text-white px-4 py-2 rounded-lg text-sm font-mono hover:bg-gray-800 transition-colors"
                    >
                        Compare Shapes
                    </button>
                </div>
                <ComparisonChart {selectedShoes} />
            </div>
        {/if}
    </div>
</main>

<ShapeComparator 
    {selectedShoes} 
    isOpen={showShapeComparator} 
    onClose={closeShapeComparator} 
/>
