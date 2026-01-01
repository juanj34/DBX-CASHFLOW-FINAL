// Developer Trust Score Calculation System
// Based on weighted scoring across 4 pillars

export interface Developer {
  id: string;
  name: string;
  logo_url?: string | null;
  white_logo_url?: string | null;
  rating_track_record?: number | null;
  rating_quality?: number | null;
  rating_flip_potential?: number | null;
  score_maintenance?: number | null;
  rating_sales?: number | null;
  rating_design?: number | null;
  projects_launched?: number | null;
  units_sold?: number | null;
  on_time_delivery_rate?: number | null;
  founded_year?: number | null;
  flagship_project?: string | null;
  short_bio?: string | null;
  description?: string | null;
  headquarters?: string | null;
  website?: string | null;
  total_valuation?: number | null;
  updated_at?: string | null;
}

export interface TierInfo {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionEs: string;
}

export interface ScoreBreakdown {
  trackRecord: number;
  buildQuality: number;
  roiPotential: number;
  maintenance: number;
}

// Weights for each category
const WEIGHTS = {
  trackRecord: 0.40,    // 40% - Historial y Cumplimiento
  buildQuality: 0.25,   // 25% - Calidad Constructiva
  roiPotential: 0.25,   // 25% - Potencial ROI / Apreciación
  maintenance: 0.10,    // 10% - Mantenimiento / Gestión
};

/**
 * Calculate the Developer Trust Score (0.0 - 10.0)
 */
export const calculateTrustScore = (developer: Partial<Developer>): number => {
  const A = developer.rating_track_record ?? 5;  // Track Record
  const B = developer.rating_quality ?? 5;       // Build Quality
  const C = developer.rating_flip_potential ?? 5; // ROI Potential
  const D = developer.score_maintenance ?? 5;    // Maintenance

  const score = (A * WEIGHTS.trackRecord) + 
                (B * WEIGHTS.buildQuality) + 
                (C * WEIGHTS.roiPotential) + 
                (D * WEIGHTS.maintenance);
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
};

/**
 * Get the score breakdown for radar chart
 */
export const getScoreBreakdown = (developer: Partial<Developer>): ScoreBreakdown => {
  return {
    trackRecord: developer.rating_track_record ?? 5,
    buildQuality: developer.rating_quality ?? 5,
    roiPotential: developer.rating_flip_potential ?? 5,
    maintenance: developer.score_maintenance ?? 5,
  };
};

/**
 * Get tier information based on the Trust Score
 * IMPORTANT: No alarming colors (red/orange) for scores above 5.0
 */
export const getTierInfo = (score: number): TierInfo => {
  if (score >= 9.0) {
    return {
      label: 'LEGENDARY',
      emoji: '💎',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.15)',
      description: 'Luxury, Total Security',
      descriptionEs: 'Lujo, Seguridad Total',
    };
  }
  if (score >= 8.0) {
    return {
      label: 'MARKET LEADER',
      emoji: '⭐',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.15)',
      description: 'Solid, No failures',
      descriptionEs: 'Sólido, Sin fallos',
    };
  }
  if (score >= 6.5) {
    return {
      label: 'COMPETITIVE',
      emoji: '🚀',
      color: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.15)',
      description: 'Fresh, Modern. Ideal for aggressive investment',
      descriptionEs: 'Fresco, Moderno. Ideal para inversión agresiva',
    };
  }
  if (score >= 5.0) {
    return {
      label: 'STANDARD',
      emoji: '⚖️',
      color: '#6B7280',
      bgColor: 'rgba(107, 114, 128, 0.15)',
      description: 'Market average',
      descriptionEs: 'Promedio de mercado',
    };
  }
  return {
    label: 'WATCHLIST',
    emoji: '⚠️',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    description: 'Requires additional analysis',
    descriptionEs: 'Requiere análisis adicional',
  };
};

/**
 * Find the "superpower" - highest scoring category if >= 9.0
 */
export const getSuperpower = (developer: Partial<Developer>): { category: string; categoryEs: string; score: number } | null => {
  const scores = [
    { category: 'Track Record', categoryEs: 'Historial', score: developer.rating_track_record ?? 0 },
    { category: 'Build Quality', categoryEs: 'Calidad Constructiva', score: developer.rating_quality ?? 0 },
    { category: 'ROI Potential', categoryEs: 'Potencial de Rentabilidad', score: developer.rating_flip_potential ?? 0 },
    { category: 'Maintenance', categoryEs: 'Mantenimiento', score: developer.score_maintenance ?? 0 },
  ];

  const highest = scores.reduce((max, current) => 
    current.score > max.score ? current : max
  );

  return highest.score >= 9.0 ? highest : null;
};

/**
 * Get radar chart data for the developer
 */
export const getRadarData = (developer: Partial<Developer>) => {
  return [
    { 
      category: 'Track Record', 
      categoryEs: 'Historial',
      value: developer.rating_track_record ?? 5,
      fullMark: 10 
    },
    { 
      category: 'Quality', 
      categoryEs: 'Calidad',
      value: developer.rating_quality ?? 5,
      fullMark: 10 
    },
    { 
      category: 'ROI', 
      categoryEs: 'ROI',
      value: developer.rating_flip_potential ?? 5,
      fullMark: 10 
    },
    { 
      category: 'Service', 
      categoryEs: 'Servicio',
      value: developer.score_maintenance ?? 5,
      fullMark: 10 
    },
  ];
};
