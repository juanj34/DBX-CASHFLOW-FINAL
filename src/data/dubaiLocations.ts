export interface DubaiLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  pitch?: number;
  bearing?: number;
  icon: string;
  description: string;
}

export const dubaiLocations: DubaiLocation[] = [
  {
    id: "downtown",
    name: "Downtown Dubai",
    coordinates: [55.2744, 25.1972],
    zoom: 15,
    pitch: 60,
    bearing: 0,
    icon: "🏙️",
    description: "Burj Khalifa & Dubai Mall"
  },
  {
    id: "palm",
    name: "Palm Jumeirah",
    coordinates: [55.1380, 25.1124],
    zoom: 13,
    pitch: 45,
    bearing: 180,
    icon: "🌴",
    description: "Iconic palm island"
  },
  {
    id: "marina",
    name: "Dubai Marina",
    coordinates: [55.1425, 25.0805],
    zoom: 15,
    pitch: 60,
    bearing: -30,
    icon: "⛵",
    description: "Marina & skyscrapers"
  },
  {
    id: "jbr",
    name: "JBR & Bluewaters",
    coordinates: [55.1350, 25.0788],
    zoom: 14,
    pitch: 50,
    bearing: 45,
    icon: "🎡",
    description: "Beach & Ain Dubai"
  },
  {
    id: "creek",
    name: "Dubai Creek",
    coordinates: [55.3076, 25.2549],
    zoom: 14,
    pitch: 45,
    bearing: 0,
    icon: "🚤",
    description: "Historic area"
  },
  {
    id: "dxb",
    name: "DXB Airport",
    coordinates: [55.3644, 25.2532],
    zoom: 13,
    pitch: 45,
    bearing: 90,
    icon: "✈️",
    description: "International airport"
  },
  {
    id: "business-bay",
    name: "Business Bay",
    coordinates: [55.2640, 25.1850],
    zoom: 14,
    pitch: 55,
    bearing: 15,
    icon: "🏢",
    description: "Business district"
  },
  {
    id: "difc",
    name: "DIFC",
    coordinates: [55.2798, 25.2118],
    zoom: 15,
    pitch: 60,
    bearing: 0,
    icon: "💼",
    description: "Financial centre"
  },
  {
    id: "moe",
    name: "Mall of Emirates",
    coordinates: [55.2006, 25.1181],
    zoom: 15,
    pitch: 50,
    bearing: 0,
    icon: "🛍️",
    description: "Shopping & Ski Dubai"
  },
  {
    id: "dubai-parks",
    name: "Dubai Parks",
    coordinates: [55.0110, 24.9220],
    zoom: 14,
    pitch: 45,
    bearing: 0,
    icon: "🎢",
    description: "Theme parks"
  },
  {
    id: "jvc",
    name: "JVC",
    coordinates: [55.2100, 25.0650],
    zoom: 14,
    pitch: 45,
    bearing: 0,
    icon: "🏠",
    description: "Jumeirah Village Circle"
  },
  {
    id: "dso",
    name: "Silicon Oasis",
    coordinates: [55.3900, 25.1200],
    zoom: 14,
    pitch: 45,
    bearing: 0,
    icon: "💻",
    description: "Tech hub"
  },
  {
    id: "dubai-islands",
    name: "Dubai Islands",
    coordinates: [55.3700, 25.2900],
    zoom: 13,
    pitch: 45,
    bearing: -20,
    icon: "🏝️",
    description: "Waterfront mega-project"
  }
];
