export interface MetroLine {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][];
  status: "operational" | "future" | "proposed";
  expectedOpening?: string;
}

export const dubaiMetroLines: MetroLine[] = [
  // OPERATIONAL LINES
  {
    id: "red-line",
    name: "Red Line",
    color: "#EF4444",
    status: "operational",
    coordinates: [
      [55.3914, 25.2300], // Centrepoint (Rashidiya)
      [55.3695, 25.2520], // Emirates
      [55.3569, 25.2453], // Airport Terminal 3
      [55.3435, 25.2510], // Airport Terminal 1
      [55.3363, 25.2520], // GGICO
      [55.3304, 25.2547], // Deira City Centre
      [55.3197, 25.2614], // Al Rigga
      [55.3139, 25.2661], // Union (interchange)
      [55.3042, 25.2547], // BurJuman (interchange)
      [55.2977, 25.2452], // ADCB
      [55.2903, 25.2349], // Al Jafiliya
      [55.2823, 25.2232], // World Trade Centre
      [55.2793, 25.2178], // Emirates Towers
      [55.2755, 25.2108], // Financial Centre
      [55.2694, 25.2014], // Burj Khalifa/Dubai Mall
      [55.2604, 25.1913], // Business Bay
      [55.2424, 25.1723], // Al Safa
      [55.2261, 25.1535], // Noor Bank
      [55.2103, 25.1346], // First Abu Dhabi Bank
      [55.2005, 25.1212], // Mall of the Emirates
      [55.1878, 25.1095], // Sharaf DG
      [55.1689, 25.0976], // Dubai Internet City
      [55.1570, 25.0880], // Nakheel
      [55.1450, 25.0790], // Dubai Media City
      [55.1387, 25.0709], // DMCC
      [55.1290, 25.0655], // Sobha Realty
      [55.1175, 25.0468], // Ibn Battuta
      [55.1013, 25.0264], // Energy
      [55.1525, 25.0305], // Al Furjan (Route 2020)
      [55.1462, 24.9636], // Expo 2020
    ],
  },
  {
    id: "green-line",
    name: "Green Line",
    color: "#22C55E",
    status: "operational",
    coordinates: [
      [55.3977, 25.2810], // Etisalat by e&
      [55.3850, 25.2750], // Al Nahda
      [55.3720, 25.2685], // Al Qusais
      [55.3590, 25.2620], // Dubai Airport Free Zone
      [55.3450, 25.2580], // Al Twar
      [55.3330, 25.2560], // Stadium
      [55.3230, 25.2590], // Al Qiyadah
      [55.3139, 25.2661], // Union (interchange)
      [55.3017, 25.2761], // Gold Souq
      [55.2965, 25.2810], // Al Ras
      [55.2905, 25.2735], // Al Ghubaiba
      [55.2960, 25.2620], // Al Fahidi
      [55.3042, 25.2547], // BurJuman (interchange)
      [55.3110, 25.2420], // Oud Metha
      [55.3190, 25.2300], // Dubai Healthcare City
      [55.3270, 25.2180], // Al Jadaf
      [55.3350, 25.2060], // Creek
    ],
  },
  // FUTURE LINES (Under Construction - Opening 2029)
  {
    id: "blue-line-creek",
    name: "Blue Line (Creek Branch)",
    color: "#3B82F6",
    status: "future",
    expectedOpening: "2029",
    coordinates: [
      [55.3350, 25.2060], // Creek (interchange with Green Line)
      [55.3420, 25.2000], // Dubai Creek Harbour 1
      [55.3500, 25.1920], // Dubai Creek Harbour 2
      [55.3580, 25.1840], // Dubai Creek Harbour 3
      [55.3700, 25.1750], // Ras Al Khor Industrial
      [55.3820, 25.1850], // Car Mart
      [55.4050, 25.1730], // International City 1 (Y-junction)
    ],
  },
  {
    id: "blue-line-centrepoint",
    name: "Blue Line (Centrepoint Branch)",
    color: "#3B82F6",
    status: "future",
    expectedOpening: "2029",
    coordinates: [
      [55.3914, 25.2300], // Centrepoint/Rashidiya (interchange with Red Line)
      [55.4050, 25.2150], // City Centre Mirdif
      [55.4180, 25.2000], // Al Warqa
      [55.4200, 25.1850], // Dragon Mart
      [55.4050, 25.1730], // International City 1 (Y-junction)
    ],
  },
  {
    id: "blue-line-trunk",
    name: "Blue Line (Main)",
    color: "#3B82F6",
    status: "future",
    expectedOpening: "2029",
    coordinates: [
      [55.4050, 25.1730], // International City 1
      [55.4150, 25.1550], // International City 2
      [55.3900, 25.1200], // Dubai Silicon Oasis
      [55.4050, 25.1000], // Academic City
    ],
  },
  // PROPOSED LINES (Planning Phase)
  {
    id: "gold-line",
    name: "Gold Line",
    color: "#F59E0B",
    status: "proposed",
    expectedOpening: "TBD (RFP 2025)",
    coordinates: [
      [55.2905, 25.2735], // Al Ghubaiba (interchange Green Line)
      [55.2960, 25.2550], // Al Fahidi area
      [55.2977, 25.2452], // ADCB area
      [55.2694, 25.2014], // Business Bay (interchange Red Line)
      [55.2850, 25.1800], // Meydan 1
      [55.3050, 25.1550], // Meydan City
      [55.3150, 25.1200], // Nad Al Sheba
      [55.3700, 25.0600], // Global Village
      [55.4000, 25.0200], // Dubailand
    ],
  },
  {
    id: "purple-line",
    name: "Purple Line",
    color: "#8B5CF6",
    status: "proposed",
    expectedOpening: "TBD",
    coordinates: [
      [55.1500, 24.8800], // Al Maktoum International Airport
      [55.1800, 25.0300], // Jumeirah Golf Estates
      [55.2100, 25.0650], // Jumeirah Village Circle
      [55.2000, 25.1100], // Al Barsha
      [55.2900, 25.1600], // Nad Al Sheba
      [55.3569, 25.2453], // Dubai International Airport
    ],
  },
];
