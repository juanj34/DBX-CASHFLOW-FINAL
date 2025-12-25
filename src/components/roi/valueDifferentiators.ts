import { LucideIcon, Waves, Eye, Building2, MapPin, Compass, Home, Crown, Building, Train, CreditCard, Sparkles, Smartphone, Umbrella, TreePine, Hotel, Landmark, Plus } from 'lucide-react';

export type DifferentiatorCategory = 'location' | 'unit' | 'developer' | 'transport' | 'financial' | 'amenities' | 'custom';

export interface ValueDifferentiator {
  id: string;
  name: string;
  nameEs: string;
  category: DifferentiatorCategory;
  icon: LucideIcon;
  impactsAppreciation: boolean;
  appreciationBonus: number; // percentage points to add (e.g., 0.5 = +0.5%)
  tooltip?: string; // English tooltip explanation
  tooltipEs?: string; // Spanish tooltip explanation
  isCustom?: boolean; // Whether this is a user-created differentiator
}

// Maximum total appreciation bonus that can be applied
export const APPRECIATION_BONUS_CAP = 2.0;

export const VALUE_DIFFERENTIATORS: ValueDifferentiator[] = [
  // Location - Appreciation Impacting
  { 
    id: 'waterfront', 
    name: 'Waterfront', 
    nameEs: 'Frente al Agua', 
    category: 'location', 
    icon: Waves, 
    impactsAppreciation: true, 
    appreciationBonus: 0.5,
    tooltip: 'Waterfront properties command premium prices due to limited supply and high demand for scenic views. Historically appreciates 0.5% faster annually.',
    tooltipEs: 'Las propiedades frente al agua tienen precios premium debido a la oferta limitada y alta demanda por vistas escénicas. Históricamente aprecia 0.5% más rápido anualmente.',
  },
  { 
    id: 'ocean-view', 
    name: 'Ocean View', 
    nameEs: 'Vista al Mar', 
    category: 'location', 
    icon: Eye, 
    impactsAppreciation: true, 
    appreciationBonus: 0.3,
    tooltip: 'Sea views add lasting value as they cannot be replicated. Units with ocean views typically sell 15-20% higher than comparable units without.',
    tooltipEs: 'Las vistas al mar agregan valor duradero ya que no pueden replicarse. Las unidades con vistas al mar típicamente se venden 15-20% más alto.',
  },
  { 
    id: 'master-community', 
    name: 'Master Community', 
    nameEs: 'Comunidad Master', 
    category: 'location', 
    icon: Building2, 
    impactsAppreciation: true, 
    appreciationBonus: 0.3,
    tooltip: 'Master-planned communities by top developers offer superior infrastructure, amenities, and management, leading to stronger long-term value retention.',
    tooltipEs: 'Las comunidades master planificadas por desarrolladores top ofrecen infraestructura, amenidades y gestión superiores.',
  },
  { 
    id: 'emerging-zone', 
    name: 'Emerging Zone', 
    nameEs: 'Zona Emergente', 
    category: 'location', 
    icon: MapPin, 
    impactsAppreciation: true, 
    appreciationBonus: 0.3,
    tooltip: 'Emerging zones offer higher growth potential as infrastructure develops. Early investors benefit from rapid appreciation as the area matures.',
    tooltipEs: 'Las zonas emergentes ofrecen mayor potencial de crecimiento. Los inversores tempranos se benefician de la apreciación rápida.',
  },
  // Location - Display Only
  { 
    id: 'beach-access', 
    name: 'Beach Access', 
    nameEs: 'Acceso a Playa', 
    category: 'location', 
    icon: Umbrella, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Direct beach access is a lifestyle feature that enhances rental appeal and tenant satisfaction.',
    tooltipEs: 'El acceso directo a la playa mejora el atractivo de alquiler y la satisfacción del inquilino.',
  },
  { 
    id: 'golf-view', 
    name: 'Golf View', 
    nameEs: 'Vista al Golf', 
    category: 'location', 
    icon: TreePine, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Golf course views offer green open spaces and attract a specific high-income tenant demographic.',
    tooltipEs: 'Las vistas al campo de golf ofrecen espacios verdes y atraen un demográfico de altos ingresos.',
  },
  
  // Unit - Appreciation Impacting
  { 
    id: 'corner-unit', 
    name: 'Corner Unit', 
    nameEs: 'Unidad Esquinera', 
    category: 'unit', 
    icon: Compass, 
    impactsAppreciation: true, 
    appreciationBonus: 0.2,
    tooltip: 'Corner units offer more natural light, additional windows, and better privacy—all factors that increase resale value.',
    tooltipEs: 'Las unidades esquineras ofrecen más luz natural, ventanas adicionales y mejor privacidad—factores que aumentan el valor.',
  },
  { 
    id: 'top-floor', 
    name: 'Top Floor', 
    nameEs: 'Último Piso', 
    category: 'unit', 
    icon: Crown, 
    impactsAppreciation: true, 
    appreciationBonus: 0.3,
    tooltip: 'Penthouse and top-floor units command premium prices with better views, less noise, and more exclusivity.',
    tooltipEs: 'Los penthouses y pisos superiores tienen precios premium con mejores vistas, menos ruido y más exclusividad.',
  },
  { 
    id: 'skyline-view', 
    name: 'Skyline View', 
    nameEs: 'Vista Skyline', 
    category: 'unit', 
    icon: Building, 
    impactsAppreciation: true, 
    appreciationBonus: 0.2,
    tooltip: 'Iconic skyline views (Burj Khalifa, Marina) add permanent value that appreciates as landmarks become more prestigious.',
    tooltipEs: 'Las vistas icónicas del skyline agregan valor permanente que aprecia conforme los landmarks se vuelven más prestigiosos.',
  },
  // Unit - Display Only
  { 
    id: 'furnished', 
    name: 'Furnished', 
    nameEs: 'Amueblado', 
    category: 'unit', 
    icon: Home, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Furnished units attract short-term tenants and can command 10-15% higher rents but require more maintenance.',
    tooltipEs: 'Las unidades amuebladas atraen inquilinos a corto plazo y pueden tener 10-15% más renta.',
  },
  { 
    id: 'private-pool', 
    name: 'Private Pool', 
    nameEs: 'Piscina Privada', 
    category: 'unit', 
    icon: Waves, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Private pools are a luxury feature highly sought after for villa and townhouse rentals.',
    tooltipEs: 'Las piscinas privadas son muy buscadas para alquileres de villas y townhouses.',
  },
  
  // Developer - Appreciation Impacting
  { 
    id: 'premium-developer', 
    name: 'Premium Developer', 
    nameEs: 'Developer Premium', 
    category: 'developer', 
    icon: Crown, 
    impactsAppreciation: true, 
    appreciationBonus: 0.4,
    tooltip: 'Top developers (Emaar, Meraas, DAMAC) have proven track records of quality construction and timely delivery, reducing investment risk.',
    tooltipEs: 'Los desarrolladores top tienen historial probado de calidad y entrega a tiempo, reduciendo el riesgo de inversión.',
  },
  // Developer - Display Only
  { 
    id: 'branded-residence', 
    name: 'Branded Residence', 
    nameEs: 'Residencia de Marca', 
    category: 'developer', 
    icon: Landmark, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Branded residences (Four Seasons, Armani) offer luxury services and attract high-net-worth tenants.',
    tooltipEs: 'Las residencias de marca ofrecen servicios de lujo y atraen inquilinos de alto patrimonio.',
  },
  { 
    id: 'hotel-managed', 
    name: 'Hotel Managed', 
    nameEs: 'Gestión Hotelera', 
    category: 'developer', 
    icon: Hotel, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Hotel-managed properties offer hassle-free short-term rental with professional property management.',
    tooltipEs: 'Las propiedades con gestión hotelera ofrecen alquiler a corto plazo sin complicaciones.',
  },
  
  // Transport - Appreciation Impacting
  { 
    id: 'metro-adjacent', 
    name: 'Metro Adjacent', 
    nameEs: 'Cerca del Metro', 
    category: 'transport', 
    icon: Train, 
    impactsAppreciation: true, 
    appreciationBonus: 0.3,
    tooltip: 'Properties within 500m of metro stations see 5-10% higher values and stronger rental demand from commuters.',
    tooltipEs: 'Las propiedades a 500m del metro ven 5-10% más valor y mayor demanda de alquiler.',
  },
  
  // Financial - Display Only
  { 
    id: 'low-entry', 
    name: 'Low Entry Point', 
    nameEs: 'Bajo Punto de Entrada', 
    category: 'financial', 
    icon: CreditCard, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Lower entry price makes the investment accessible to more buyers, improving liquidity on exit.',
    tooltipEs: 'El precio de entrada más bajo hace la inversión accesible a más compradores.',
  },
  { 
    id: 'accessible-payment', 
    name: 'Accessible Payment Plan', 
    nameEs: 'Plan de Pago Accesible', 
    category: 'financial', 
    icon: CreditCard, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Extended payment plans reduce upfront capital requirements and improve investment cashflow.',
    tooltipEs: 'Los planes de pago extendidos reducen los requisitos de capital inicial.',
  },
  
  // Amenities - Display Only
  { 
    id: 'premium-amenities', 
    name: 'Premium Amenities', 
    nameEs: 'Amenidades Premium', 
    category: 'amenities', 
    icon: Sparkles, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Gyms, pools, concierge, and co-working spaces enhance tenant experience and justify higher rents.',
    tooltipEs: 'Gimnasios, piscinas, conserjería y espacios de co-working mejoran la experiencia del inquilino.',
  },
  { 
    id: 'smart-home', 
    name: 'Smart Home', 
    nameEs: 'Casa Inteligente', 
    category: 'amenities', 
    icon: Smartphone, 
    impactsAppreciation: false, 
    appreciationBonus: 0,
    tooltip: 'Smart home technology appeals to tech-savvy tenants and can reduce utility costs.',
    tooltipEs: 'La tecnología de casa inteligente atrae inquilinos tech-savvy y puede reducir costos.',
  },
];

/**
 * Calculate the total appreciation bonus from selected differentiators.
 * Returns the sum of bonuses, capped at APPRECIATION_BONUS_CAP.
 */
export function calculateAppreciationBonus(selectedIds: string[], customDifferentiators: ValueDifferentiator[] = []): number {
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  const totalBonus = allDifferentiators
    .filter(d => selectedIds.includes(d.id) && d.impactsAppreciation)
    .reduce((sum, d) => sum + d.appreciationBonus, 0);
  
  return Math.min(totalBonus, APPRECIATION_BONUS_CAP);
}

/**
 * Get differentiators by category
 */
export function getDifferentiatorsByCategory(category: DifferentiatorCategory, customDifferentiators: ValueDifferentiator[] = []): ValueDifferentiator[] {
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  return allDifferentiators.filter(d => d.category === category);
}

/**
 * Get selected differentiators split by impact type
 */
export function getSelectedDifferentiators(selectedIds: string[], customDifferentiators: ValueDifferentiator[] = []): {
  valueDrivers: ValueDifferentiator[];
  features: ValueDifferentiator[];
} {
  const allDifferentiators = [...VALUE_DIFFERENTIATORS, ...customDifferentiators];
  const selected = allDifferentiators.filter(d => selectedIds.includes(d.id));
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
  custom: { en: 'Custom', es: 'Personalizado' },
};

// Default icon for custom differentiators
export const CUSTOM_DIFFERENTIATOR_ICON = Plus;
