// Load shoe data from centralized JSON file
import sampleData from '../../data/sample_shoe_data_enhanced.json';

// Helper function to convert pace strings to seconds
function paceStringToSeconds(paceStr) {
  if (!paceStr || paceStr.trim() === '') return 300; // 5:00 default
  
  const match = paceStr.match(/(\d+):(\d+)/);
  if (match) {
    const minutes = parseInt(match[1]);
    const seconds = parseInt(match[2]);
    return minutes * 60 + seconds;
  }
  
  return 300; // fallback
}

// Transform the data to add paceRangeSecPerKm
export const shoes = sampleData.map(shoe => ({
  ...shoe,
  paceRangeSecPerKm: {
    min: paceStringToSeconds(shoe.paceRange.minPacePerKm),
    max: paceStringToSeconds(shoe.paceRange.maxPacePerKm),
  }
}));

export const getShoeById = (id) => shoes[id];

export const getComparableFields = () => [
    { key: 'price', label: 'Price ($)', type: 'currency' },
    { key: 'weightOunces', label: 'Weight (oz)', type: 'number' },
    { key: 'offsetMilimeters', label: 'Drop (mm)', type: 'number' }
];
