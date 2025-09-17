// Load shoe data from JSON files
import brooksHyperion3 from '../../data/shoes/mens/brooks_hyperion_3.json';
import brooksGhostMax3 from '../../data/shoes/mens/brooks_ghost_max_3.json';
import brooksGhost17 from '../../data/shoes/mens/brooks_ghost_17.json';
import brooksGlycerinMax from '../../data/shoes/mens/brooks_glycerin_max.json';
import brooksAdrenalineGts24 from '../../data/shoes/mens/brooks_adrenaline_gts_24.json';
import brooksGlycerin22 from '../../data/shoes/mens/brooks_glycerin_22.json';
import hokaMach6 from '../../data/shoes/mens/hoka_mach_6.json';
import sauconyEndorphinSpeed5 from '../../data/shoes/mens/saucony_endorphin_speed_5.json';
import sauconyKinvara16 from '../../data/shoes/mens/saucony_kinvara_16.json';

export const shoes = [
    brooksHyperion3,
    brooksGhostMax3,
    brooksGhost17,
    brooksGlycerinMax,
    brooksAdrenalineGts24,
    brooksGlycerin22,
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
