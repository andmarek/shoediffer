import type { Shoe } from '../recommendation/types';
import { convertPaceRangeToSeconds } from '../recommendation/mappings';

// Import sample data for now - later this could come from a database
import sampleData from '../data/sample_shoe_data_enhanced.json';

// Transform and validate the shoe data
export const shoes: Shoe[] = sampleData.map(rawShoe => ({
  ...rawShoe,
  // Ensure paceRangeSecPerKm is computed from the string format
  paceRangeSecPerKm: convertPaceRangeToSeconds(rawShoe.paceRange),
}));

// Helper functions for working with shoe data
export function getShoeById(id: string): Shoe | undefined {
  return shoes.find(shoe => shoe.name === id);
}

export function getShoesByBrand(brand: string): Shoe[] {
  return shoes.filter(shoe => shoe.brand.toLowerCase() === brand.toLowerCase());
}

export function getShoesByType(shoeType: string): Shoe[] {
  return shoes.filter(shoe => shoe.shoeTypes.includes(shoeType as any));
}

export function getShoesByPriceRange(min: number, max: number): Shoe[] {
  return shoes.filter(shoe => shoe.price >= min && shoe.price <= max);
}

// Validation function to ensure shoe data integrity
export function validateShoeData(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  shoes.forEach((shoe, index) => {
    if (!shoe.name || shoe.name.trim() === '') {
      errors.push(`Shoe at index ${index} missing name`);
    }
    
    if (!shoe.brand || shoe.brand.trim() === '') {
      errors.push(`Shoe "${shoe.name}" missing brand`);
    }
    
    if (!shoe.shoeTypes || shoe.shoeTypes.length === 0) {
      errors.push(`Shoe "${shoe.name}" missing shoeTypes`);
    }
    
    if (shoe.cushioningScale < 0 || shoe.cushioningScale > 10) {
      errors.push(`Shoe "${shoe.name}" has invalid cushioningScale: ${shoe.cushioningScale}`);
    }
    
    if (shoe.price <= 0) {
      errors.push(`Shoe "${shoe.name}" has invalid price: ${shoe.price}`);
    }
    
    if (!shoe.paceRangeSecPerKm || shoe.paceRangeSecPerKm.min >= shoe.paceRangeSecPerKm.max) {
      errors.push(`Shoe "${shoe.name}" has invalid pace range`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Stats about the shoe database
export function getShoeStats() {
  return {
    total: shoes.length,
    brands: new Set(shoes.map(shoe => shoe.brand)).size,
    avgPrice: Math.round(shoes.reduce((sum, shoe) => sum + shoe.price, 0) / shoes.length),
    priceRange: {
      min: Math.min(...shoes.map(shoe => shoe.price)),
      max: Math.max(...shoes.map(shoe => shoe.price)),
    },
    rolesCovered: Array.from(new Set(shoes.flatMap(shoe => shoe.shoeTypes))),
  };
}
