import { LucideIcon, Waves, Eye, Building2, MapPin, Compass, Home, Crown, Building, Train, CreditCard, Sparkles, Smartphone, Umbrella, TreePine, Hotel, Landmark } from 'lucide-react';

export type DifferentiatorCategory = 'location' | 'unit' | 'developer' | 'transport' | 'financial' | 'amenities';

export interface ValueDifferentiator {
  id: string;
  name: string;
  nameEs: string;
  category: DifferentiatorCategory;
  icon: LucideIcon;
  impactsAppreciation: boolean;
  appreciationBonus: number; // percentage points to add (e.g., 0.5 = +0.5%)
}

// Maximum total appreciation bonus that can be applied
export const APPRECIATION_BONUS_CAP = 2.0;

export const VALUE_DIFFERENTIATORS: ValueDifferentiator[] = [
  // Location - Appreciation Impacting
  { id: 'waterfront', name: 'Waterfront', nameEs: 'Frente al Agua', category: 'location', icon: Waves, impactsAppreciation: true, appreciationBonus: 0.5 },
  { id: 'ocean-view', name: 'Ocean View', nameEs: 'Vista al Mar', category: 'location', icon: Eye, impactsAppreciation: true, appreciationBonus: 0.3 },
  { id: 'master-community', name: 'Master Community', nameEs: 'Comunidad Master', category: 'location', icon: Building2, impactsAppreciation: true, appreciationBonus: 0.3 },
  { id: 'emerging-zone', name: 'Emerging Zone', nameEs: 'Zona Emergente', category: 'location', icon: MapPin, impactsAppreciation: true, appreciationBonus: 0.3 },
  // Location - Display Only
  { id: 'beach-access', name: 'Beach Access', nameEs: 'Acceso a Playa', category: 'location', icon: Umbrella, impactsAppreciation: false, appreciationBonus: 0 },
  { id: 'golf-view', name: 'Golf View', nameEs: 'Vista al Golf', category: 'location', icon: TreePine, impactsAppreciation: false, appreciationBonus: 0 },
  
  // Unit - Appreciation Impacting
  { id: 'corner-unit', name: 'Corner Unit', nameEs: 'Unidad Esquinera', category: 'unit', icon: Compass, impactsAppreciation: true, appreciationBonus: 0.2 },
  { id: 'top-floor', name: 'Top Floor', nameEs: 'Último Piso', category: 'unit', icon: Crown, impactsAppreciation: true, appreciationBonus: 0.3 },
  { id: 'skyline-view', name: 'Skyline View', nameEs: 'Vista Skyline', category: 'unit', icon: Building, impactsAppreciation: true, appreciationBonus: 0.2 },
  // Unit - Display Only
  { id: 'furnished', name: 'Furnished', nameEs: 'Amueblado', category: 'unit', icon: Home, impactsAppreciation: false, appreciationBonus: 0 },
  { id: 'private-pool', name: 'Private Pool', nameEs: 'Piscina Privada', category: 'unit', icon: Waves, impactsAppreciation: false, appreciationBonus: 0 },
  
  // Developer - Appreciation Impacting
  { id: 'premium-developer', name: 'Premium Developer', nameEs: 'Developer Premium', category: 'developer', icon: Crown, impactsAppreciation: true, appreciationBonus: 0.4 },
  // Developer - Display Only
  { id: 'branded-residence', name: 'Branded Residence', nameEs: 'Residencia de Marca', category: 'developer', icon: Landmark, impactsAppreciation: false, appreciationBonus: 0 },
  { id: 'hotel-managed', name: 'Hotel Managed', nameEs: 'Gestión Hotelera', category: 'developer', icon: Hotel, impactsAppreciation: false, appreciationBonus: 0 },
  
  // Transport - Appreciation Impacting
  { id: 'metro-adjacent', name: 'Metro Adjacent', nameEs: 'Cerca del Metro', category: 'transport', icon: Train, impactsAppreciation: true, appreciationBonus: 0.3 },
  
  // Financial - Display Only
  { id: 'low-entry', name: 'Low Entry Point', nameEs: 'Bajo Punto de Entrada', category: 'financial', icon: CreditCard, impactsAppreciation: false, appreciationBonus: 0 },
  { id: 'accessible-payment', name: 'Accessible Payment Plan', nameEs: 'Plan de Pago Accesible', category: 'financial', icon: CreditCard, impactsAppreciation: false, appreciationBonus: 0 },
  
  // Amenities - Display Only
  { id: 'premium-amenities', name: 'Premium Amenities', nameEs: 'Amenidades Premium', category: 'amenities', icon: Sparkles, impactsAppreciation: false, appreciationBonus: 0 },
  { id: 'smart-home', name: 'Smart Home', nameEs: 'Casa Inteligente', category: 'amenities', icon: Smartphone, impactsAppreciation: false, appreciationBonus: 0 },
];

/**
 * Calculate the total appreciation bonus from selected differentiators.
 * Returns the sum of bonuses, capped at APPRECIATION_BONUS_CAP.
 */
export function calculateAppreciationBonus(selectedIds: string[]): number {
  const totalBonus = VALUE_DIFFERENTIATORS
    .filter(d => selectedIds.includes(d.id) && d.impactsAppreciation)
    .reduce((sum, d) => sum + d.appreciationBonus, 0);
  
  return Math.min(totalBonus, APPRECIATION_BONUS_CAP);
}

/**
 * Get differentiators by category
 */
export function getDifferentiatorsByCategory(category: DifferentiatorCategory): ValueDifferentiator[] {
  return VALUE_DIFFERENTIATORS.filter(d => d.category === category);
}

/**
 * Get selected differentiators split by impact type
 */
export function getSelectedDifferentiators(selectedIds: string[]): {
  valueDrivers: ValueDifferentiator[];
  features: ValueDifferentiator[];
} {
  const selected = VALUE_DIFFERENTIATORS.filter(d => selectedIds.includes(d.id));
  return {
    valueDrivers: selected.filter(d => d.impactsAppreciation),
    features: selected.filter(d => !d.impactsAppreciation),
  };
}

export const CATEGORY_LABELS: Record<DifferentiatorCategory, { en: string; es: string }> = {
  location: { en: 'Location', es: 'Ubicación' },
  unit: { en: 'Unit Features', es: 'Características de Unidad' },
  developer: { en: 'Developer', es: 'Developer' },
  transport: { en: 'Transport', es: 'Transporte' },
  financial: { en: 'Financial', es: 'Financiero' },
  amenities: { en: 'Amenities', es: 'Amenidades' },
};
