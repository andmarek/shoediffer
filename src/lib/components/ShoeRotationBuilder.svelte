<script>
    let formData = {
        runningGoal: '',
        weeklyMileage: '',
        furthestRunDistance: '',
        easyPace: '',
        tempoWorkoutPace: '',
        roadPercentage: 70,
        treadmillPercentage: 20,
        trailPercentage: 10,
        supportLevel: '',
        cushioningPreference: '',
        widthNeeds: '',
        versatilityPreference: '',
        preferences: '',
        injuryHistory: '',
        budget: '',
        excludedBrands: ''
    };
    
    let currentStep = 1;
    const totalSteps = 9;
    
    const runningGoals = [
        'Complete my first 5K',
        'Improve 5K/10K times',
        'Run my first half marathon',
        'Complete my first marathon',
        'Improve marathon time',
        'Ultra distance training',
        'General fitness',
        'Return from injury'
    ];
    
    const weeklyMileageOptions = [
        '0-10 miles',
        '11-20 miles',
        '21-30 miles',
        '31-40 miles',
        '41-50 miles',
        '51-60 miles',
        '60+ miles'
    ];
    
    const budgetOptions = [
        'Under $100',
        '$100-150',
        '$150-200',
        '$200+'
    ];

    const supportLevelOptions = [
        'Neutral (no support needed)',
        'Stability (mild overpronation)',
        'Motion control (severe overpronation)'
    ];

    const cushioningOptions = [
        'Minimal/Firm (1-3)',
        'Balanced (4-6)', 
        'Plush/Max (7-10)'
    ];

    const widthOptions = [
        'Narrow',
        'Standard',
        'Wide'
    ];

    const versatilityOptions = [
        'Specialized shoes for specific purposes',
        'Versatile shoes that can handle multiple types of runs'
    ];
    
    function nextStep() {
        if (currentStep < totalSteps) {
            currentStep += 1;
        }
    }
    
    function previousStep() {
        if (currentStep > 1) {
            currentStep -= 1;
        }
    }
    
    function updateSurfacePercentage(surface, value) {
        const oldValue = formData[surface + 'Percentage'];
        const diff = value - oldValue;
        
        formData[surface + 'Percentage'] = value;
        
        // Adjust other surfaces proportionally
        if (surface === 'road') {
            const remaining = 100 - value;
            const currentOthers = formData.treadmillPercentage + formData.trailPercentage;
            if (currentOthers > remaining) {
                const ratio = remaining / currentOthers;
                formData.treadmillPercentage = Math.round(formData.treadmillPercentage * ratio);
                formData.trailPercentage = remaining - formData.treadmillPercentage;
            }
        } else if (surface === 'treadmill') {
            const remaining = 100 - value;
            const currentOthers = formData.roadPercentage + formData.trailPercentage;
            if (currentOthers > remaining) {
                const ratio = remaining / currentOthers;
                formData.roadPercentage = Math.round(formData.roadPercentage * ratio);
                formData.trailPercentage = remaining - formData.roadPercentage;
            }
        } else if (surface === 'trail') {
            const remaining = 100 - value;
            const currentOthers = formData.roadPercentage + formData.treadmillPercentage;
            if (currentOthers > remaining) {
                const ratio = remaining / currentOthers;
                formData.roadPercentage = Math.round(formData.roadPercentage * ratio);
                formData.treadmillPercentage = remaining - formData.roadPercentage;
            }
        }
        
        // Ensure total is 100
        const total = formData.roadPercentage + formData.treadmillPercentage + formData.trailPercentage;
        if (total !== 100) {
            formData.trailPercentage += (100 - total);
        }
    }
    
    let isLoading = false;
    let rotationResults = null;
    let showResults = false;
    let errorMessage = '';

    async function buildRotation() {
        isLoading = true;
        errorMessage = '';
        
        try {
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            rotationResults = data;
            showResults = true;
            
        } catch (error) {
            console.error('Error building rotation:', error);
            errorMessage = error.message || 'Failed to build rotation. Please try again.';
        } finally {
            isLoading = false;
        }
    }

    function resetQuiz() {
        currentStep = 1;
        showResults = false;
        rotationResults = null;
        errorMessage = '';
        formData = {
            runningGoal: '',
            weeklyMileage: '',
            furthestRunDistance: '',
            easyPace: '',
            tempoWorkoutPace: '',
            roadPercentage: 70,
            treadmillPercentage: 20,
            trailPercentage: 10,
            supportLevel: '',
            cushioningPreference: '',
            widthNeeds: '',
            versatilityPreference: '',
            preferences: '',
            injuryHistory: '',
            budget: '',
            excludedBrands: ''
        };
    }
    
    $: canProceed = () => {
        switch (currentStep) {
            case 1: return formData.runningGoal !== '';
            case 2: return formData.weeklyMileage !== '' && formData.furthestRunDistance !== '';
            case 3: return formData.easyPace !== '' && formData.tempoWorkoutPace !== '';
            case 4: return true; // Surface percentages always valid
            case 5: return formData.supportLevel !== '';
            case 6: return formData.cushioningPreference !== '';
            case 7: return formData.widthNeeds !== '' && formData.versatilityPreference !== '';
            case 8: return true; // Preferences are optional
            case 9: return formData.budget !== '';
            default: return false;
        }
    };
</script>

<div class="max-w-4xl mx-auto">
    <div class="mb-12">
        <h2 class="text-lg font-medium text-black mb-2">build your rotation</h2>
        <p class="text-gray-500 text-sm font-mono">step {currentStep} of {totalSteps}</p>
        
        <!-- Progress bar -->
        <div class="w-full bg-gray-200 h-1 mt-4">
            <div 
                class="bg-black h-1 transition-all duration-300"
                style="width: {(currentStep / totalSteps) * 100}%"
            ></div>
        </div>
    </div>

    <div class="bg-white border border-gray-200 p-8">
        {#if currentStep === 1}
            <!-- Running Goal -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">What's your main running goal?</h3>
                <div class="grid gap-3 md:grid-cols-2">
                    {#each runningGoals as goal}
                        <button
                            class="p-4 border text-left transition-colors hover:bg-gray-50 {formData.runningGoal === goal ? 'border-black bg-gray-50' : 'border-gray-200'}"
                            on:click={() => formData.runningGoal = goal}
                        >
                            <p class="text-sm font-mono text-black">{goal}</p>
                        </button>
                    {/each}
                </div>
            </div>
            
        {:else if currentStep === 2}
            <!-- Mileage -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Weekly mileage & long runs</h3>
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <div class="block text-sm font-mono text-black mb-3">Current weekly mileage</div>
                        <div class="space-y-2">
                            {#each weeklyMileageOptions as option}
                                <button
                                    class="w-full p-3 border text-left transition-colors hover:bg-gray-50 {formData.weeklyMileage === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                                    on:click={() => formData.weeklyMileage = option}
                                >
                                    <p class="text-sm font-mono text-black">{option}</p>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <div>
                        <label for="furthest-run" class="block text-sm font-mono text-black mb-3">Furthest run distance (miles)</label>
                        <input
                            id="furthest-run"
                            type="number"
                            bind:value={formData.furthestRunDistance}
                            placeholder="e.g. 13.1"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 3}
            <!-- Paces -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Typical paces</h3>
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <label for="easy-pace" class="block text-sm font-mono text-black mb-3">Easy/recovery pace (per mile)</label>
                        <input
                            id="easy-pace"
                            type="text"
                            bind:value={formData.easyPace}
                            placeholder="e.g. 9:30"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label for="tempo-pace" class="block text-sm font-mono text-black mb-3">Tempo/workout pace (per mile)</label>
                        <input
                            id="tempo-pace"
                            type="text"
                            bind:value={formData.tempoWorkoutPace}
                            placeholder="e.g. 8:15"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 4}
            <!-- Surfaces -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Running surfaces</h3>
                <p class="text-sm text-gray-500 font-mono">Adjust the sliders to match your typical running surface mix</p>
                <div class="space-y-6">
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <label for="road-slider" class="text-sm font-mono text-black">Road</label>
                            <span class="text-sm font-mono text-gray-600">{formData.roadPercentage}%</span>
                        </div>
                        <input
                            id="road-slider"
                            type="range"
                            min="0"
                            max="100"
                            bind:value={formData.roadPercentage}
                            on:input={(e) => updateSurfacePercentage('road', parseInt(e.target.value))}
                            class="w-full"
                        />
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <label for="treadmill-slider" class="text-sm font-mono text-black">Treadmill</label>
                            <span class="text-sm font-mono text-gray-600">{formData.treadmillPercentage}%</span>
                        </div>
                        <input
                            id="treadmill-slider"
                            type="range"
                            min="0"
                            max="100"
                            bind:value={formData.treadmillPercentage}
                            on:input={(e) => updateSurfacePercentage('treadmill', parseInt(e.target.value))}
                            class="w-full"
                        />
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-3">
                            <label for="trail-slider" class="text-sm font-mono text-black">Trail</label>
                            <span class="text-sm font-mono text-gray-600">{formData.trailPercentage}%</span>
                        </div>
                        <input
                            id="trail-slider"
                            type="range"
                            min="0"
                            max="100"
                            bind:value={formData.trailPercentage}
                            on:input={(e) => updateSurfacePercentage('trail', parseInt(e.target.value))}
                            class="w-full"
                        />
                    </div>
                    <div class="text-xs text-gray-500 font-mono">
                        Total: {formData.roadPercentage + formData.treadmillPercentage + formData.trailPercentage}%
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 5}
            <!-- Support Level -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Foot support needs</h3>
                <p class="text-sm text-gray-500 font-mono">Do you overpronate or need motion control?</p>
                <div class="space-y-2">
                    {#each supportLevelOptions as option}
                        <button
                            class="w-full p-4 border text-left transition-colors hover:bg-gray-50 {formData.supportLevel === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                            on:click={() => formData.supportLevel = option}
                        >
                            <p class="text-sm font-mono text-black">{option}</p>
                        </button>
                    {/each}
                </div>
            </div>
            
        {:else if currentStep === 6}
            <!-- Cushioning Preference -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Cushioning preference</h3>
                <p class="text-sm text-gray-500 font-mono">How much cushioning do you prefer?</p>
                <div class="space-y-2">
                    {#each cushioningOptions as option}
                        <button
                            class="w-full p-4 border text-left transition-colors hover:bg-gray-50 {formData.cushioningPreference === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                            on:click={() => formData.cushioningPreference = option}
                        >
                            <p class="text-sm font-mono text-black">{option}</p>
                        </button>
                    {/each}
                </div>
            </div>
            
        {:else if currentStep === 7}
            <!-- Width & Versatility -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Fit & rotation preferences</h3>
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <div class="block text-sm font-mono text-black mb-3">Foot width</div>
                        <div class="space-y-2">
                            {#each widthOptions as option}
                                <button
                                    class="w-full p-3 border text-left transition-colors hover:bg-gray-50 {formData.widthNeeds === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                                    on:click={() => formData.widthNeeds = option}
                                >
                                    <p class="text-sm font-mono text-black">{option}</p>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <div>
                        <div class="block text-sm font-mono text-black mb-3">Shoe versatility</div>
                        <div class="space-y-2">
                            {#each versatilityOptions as option}
                                <button
                                    class="w-full p-3 border text-left transition-colors hover:bg-gray-50 {formData.versatilityPreference === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                                    on:click={() => formData.versatilityPreference = option}
                                >
                                    <p class="text-sm font-mono text-black">{option}</p>
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 8}
            <!-- Additional Preferences -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Additional preferences & injury history</h3>
                <div class="space-y-6">
                    <div>
                        <label for="preferences" class="block text-sm font-mono text-black mb-3">Any other specific needs? (optional)</label>
                        <textarea
                            id="preferences"
                            bind:value={formData.preferences}
                            placeholder="e.g. breathable upper, carbon plate preference, etc."
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors resize-none"
                        ></textarea>
                    </div>
                    <div>
                        <label for="injury-history" class="block text-sm font-mono text-black mb-3">Past or current injuries to consider? (optional)</label>
                        <textarea
                            id="injury-history"
                            bind:value={formData.injuryHistory}
                            placeholder="e.g. plantar fasciitis, knee issues, shin splints, etc."
                            rows="3"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors resize-none"
                        ></textarea>
                    </div>
                </div>
            </div>
            
        {:else if currentStep === 9}
            <!-- Budget & Exclusions -->
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-black">Budget & brand preferences</h3>
                <div class="grid gap-6 md:grid-cols-2">
                    <div>
                        <div class="block text-sm font-mono text-black mb-3">Budget per shoe</div>
                        <div class="space-y-2">
                            {#each budgetOptions as option}
                                <button
                                    class="w-full p-3 border text-left transition-colors hover:bg-gray-50 {formData.budget === option ? 'border-black bg-gray-50' : 'border-gray-200'}"
                                    on:click={() => formData.budget = option}
                                >
                                    <p class="text-sm font-mono text-black">{option}</p>
                                </button>
                            {/each}
                        </div>
                    </div>
                    <div>
                        <label for="excluded-brands" class="block text-sm font-mono text-black mb-3">Brands to exclude (optional)</label>
                        <input
                            id="excluded-brands"
                            type="text"
                            bind:value={formData.excludedBrands}
                            placeholder="e.g. Nike, Adidas"
                            class="w-full px-3 py-2 border border-gray-200 rounded text-sm font-mono placeholder:text-gray-400 focus:border-black focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
        {/if}
    </div>

    <!-- Navigation -->
    <div class="flex justify-between items-center mt-8">
        <button
            class="text-gray-500 hover:text-black text-sm font-mono transition-colors disabled:text-gray-300 disabled:hover:text-gray-300"
            on:click={previousStep}
            disabled={currentStep === 1}
        >
            ← previous
        </button>
        
        <div class="flex gap-2">
            {#each Array(totalSteps) as _, i}
                <div class="w-2 h-2 rounded-full {i + 1 <= currentStep ? 'bg-black' : 'bg-gray-200'}"></div>
            {/each}
        </div>
        
        {#if currentStep < totalSteps}
            <button
                class="px-4 py-2 bg-black text-white text-sm font-mono hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300"
                on:click={nextStep}
                disabled={!canProceed()}
            >
                next →
            </button>
        {:else}
            <button
                class="px-4 py-2 bg-black text-white text-sm font-mono hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300"
                on:click={buildRotation}
                disabled={!canProceed() || isLoading}
            >
                {isLoading ? 'building...' : 'build rotation'}
            </button>
        {/if}
    </div>
</div>

{#if showResults && rotationResults}
    <!-- Results Display -->
    <div class="mt-12 bg-white border border-gray-200 p-8">
        <div class="flex justify-between items-start mb-6">
            <h2 class="text-lg font-medium text-black">Your Shoe Rotation</h2>
            <button
                class="text-sm font-mono text-gray-500 hover:text-black transition-colors"
                on:click={resetQuiz}
            >
                start over
            </button>
        </div>
        
        {#if rotationResults.rotation.length === 0}
            <div class="text-center py-8">
                <p class="text-gray-500 font-mono">No shoes found matching your criteria.</p>
                <p class="text-sm text-gray-400 mt-2">Try adjusting your budget or preferences.</p>
            </div>
        {:else}
            <!-- Rotation Results -->
            <div class="space-y-6">
                {#each rotationResults.rotation as recommendation, index}
                    <div class="border border-gray-200 p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-lg font-medium text-black">{index + 1}. {recommendation.shoe.name}</h3>
                                <p class="text-sm text-gray-500 font-mono">{recommendation.shoe.brand}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-medium text-black">${recommendation.shoe.price}</p>
                                <p class="text-sm text-gray-500 font-mono">score: {recommendation.score.toFixed(1)}</p>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <div class="flex flex-wrap gap-2">
                                {#each recommendation.rolesCovered as role}
                                    <span class="px-2 py-1 bg-gray-100 text-xs font-mono text-gray-700 rounded">
                                        {role}
                                    </span>
                                {/each}
                            </div>
                        </div>
                        
                        <p class="text-sm text-gray-700 mb-4">{recommendation.explanation}</p>
                        
                        <div class="text-xs font-mono text-gray-500">
                            Weight: {recommendation.shoe.weightOunces}oz • 
                            Drop: {recommendation.shoe.offsetMilimeters}mm • 
                            Cushioning: {recommendation.shoe.cushioningScale}/10
                        </div>
                        
                        {#if recommendation.shoe.url}
                            <div class="mt-4">
                                <a 
                                    href={recommendation.shoe.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-sm font-mono text-black hover:underline"
                                >
                                    view shoe →
                                </a>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
            
            <!-- Summary Stats -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>
                        <p class="text-lg font-medium text-black">
                            ${rotationResults.rotation.reduce((sum, r) => sum + r.shoe.price, 0)}
                        </p>
                        <p class="text-sm font-mono text-gray-500">total investment</p>
                    </div>
                    <div>
                        <p class="text-lg font-medium text-black">
                            {Math.round((rotationResults.rotation.length - rotationResults.uncoveredRoles.length) / rotationResults.rotation.length * 100)}%
                        </p>
                        <p class="text-sm font-mono text-gray-500">needs covered</p>
                    </div>
                    <div>
                        <p class="text-lg font-medium text-black">
                            {rotationResults.rotation.length}
                        </p>
                        <p class="text-sm font-mono text-gray-500">shoes</p>
                    </div>
                </div>
                
                {#if rotationResults.uncoveredRoles.length > 0}
                    <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <p class="text-sm font-mono text-yellow-800">
                            <strong>Note:</strong> Some needs weren't fully covered: {rotationResults.uncoveredRoles.join(', ')}
                        </p>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

{#if errorMessage}
    <!-- Error Display -->
    <div class="mt-8 p-4 bg-red-50 border border-red-200 rounded">
        <p class="text-sm font-mono text-red-800">
            <strong>Error:</strong> {errorMessage}
        </p>
        <button
            class="mt-2 text-sm font-mono text-red-600 hover:text-red-800 transition-colors underline"
            on:click={() => errorMessage = ''}
        >
            dismiss
        </button>
    </div>
{/if}

{#if isLoading}
    <!-- Loading State -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded border border-gray-200">
            <div class="text-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                <p class="text-sm font-mono text-gray-700">Building your rotation...</p>
            </div>
        </div>
    </div>
{/if}
