<script>
    import ShoeList from '../lib/components/ShoeList.svelte';
    import ComparisonChart from '../lib/components/ComparisonChart.svelte';
    
    let selectedShoes = [];
    let showComparison = false;
    
    function handleCompare() {
        showComparison = true;
    }
    
    function goBack() {
        showComparison = false;
    }
</script>

<svelte:head>
    <title>Shoediffer - Compare Running Shoes</title>
    <meta name="description" content="Compare running shoes side by side to find your perfect match" />
</svelte:head>

<main class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Shoediffer</h1>
            <p class="text-lg text-gray-600">Find your perfect running shoe through data-driven comparison</p>
        </header>
        
        {#if !showComparison}
            <ShoeList bind:selectedShoes onCompare={handleCompare} />
        {:else}
            <div class="space-y-6">
                <button 
                    on:click={goBack}
                    class="flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                    ← Back to Selection
                </button>
                <ComparisonChart {selectedShoes} />
            </div>
        {/if}
    </div>
</main>
