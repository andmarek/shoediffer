// Load shoe data from JSON files
import brooksHyperion3 from '../../data/shoes/mens/brooks_hyperion_3.json';
import hokaMach6 from '../../data/shoes/mens/hoka_mach_6.json';
import sauconyEndorphinSpeed5 from '../../data/shoes/mens/saucony_endorphin_speed_5.json';
import sauconyKinvara16 from '../../data/shoes/mens/saucony_kinvara_16.json';

export const shoes = [
    brooksHyperion3,
    hokaMach6,
    sauconyEndorphinSpeed5,
    sauconyKinvara16
];

export const getShoeById = (id) => shoes[id];

export const getComparableFields = () => [
    { key: 'price', label: 'Price ($)', type: 'currency' },
    { key: 'weightOunces', label: 'Weight (oz)', type: 'number' },
    { key: 'offsetMilimeters', label: 'Drop (mm)', type: 'number' }
];
