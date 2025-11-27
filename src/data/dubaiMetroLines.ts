export interface MetroLine {
  id: string;
  name: string;
  color: string;
  coordinates: [number, number][];
}

export const dubaiMetroLines: MetroLine[] = [
  {
    id: "red-line",
    name: "Red Line",
    color: "#EF4444",
    coordinates: [
      // Rashidiya to UAE Exchange/Expo 2020 (west direction)
      [55.3865, 25.2711], // Rashidiya
      [55.3645, 25.2531], // Airport Terminal 3
      [55.3514, 25.2528], // Airport Terminal 1
      [55.3365, 25.2516], // GGICO
      [55.3281, 25.2517], // Deira City Centre
      [55.3156, 25.2561], // Al Nahda
      [55.3047, 25.2589], // Stadium
      [55.2965, 25.2628], // Al Qiyadah
      [55.2874, 25.2680], // Abu Hail
      [55.2789, 25.2721], // Abu Baker Al Siddique
      [55.2708, 25.2751], // Salah Al Din
      [55.2624, 25.2789], // Union (interchange)
      [55.2553, 25.2658], // BurJuman
      [55.2471, 25.2575], // Al Jafiliya
      [55.2394, 25.2485], // World Trade Centre
      [55.2318, 25.2402], // Emirates Towers
      [55.2241, 25.2325], // Financial Centre
      [55.2164, 25.2243], // Burj Khalifa/Dubai Mall
      [55.2021, 25.2104], // Business Bay
      [55.1883, 25.1958], // Noor Bank
      [55.1742, 25.1809], // First Abu Dhabi Bank
      [55.1603, 25.1664], // Mall of the Emirates
      [55.1462, 25.1516], // Sharaf DG
      [55.1321, 25.1369], // Dubai Internet City
      [55.1183, 25.1224], // Nakheel
      [55.1137, 25.1098], // Damac Properties
      [55.1094, 25.0973], // Dubai Marina
      [55.1052, 25.0848], // Jumeirah Lakes Towers
      [55.1009, 25.0724], // Nakheel Harbour & Tower
      [55.0967, 25.0599], // Ibn Battuta
      [55.0924, 25.0474], // Energy
      [55.0882, 25.0350], // Jebel Ali
      [55.0840, 25.0225], // UAE Exchange
      [55.0667, 25.0100], // Expo 2020
    ],
  },
  {
    id: "green-line",
    name: "Green Line",
    color: "#22C55E",
    coordinates: [
      // Etisalat to Creek (south direction)
      [55.3650, 25.3176], // Etisalat
      [55.3578, 25.3089], // Al Nahda
      [55.3506, 25.3002], // Al Qusais
      [55.3434, 25.2915], // Dubai Airport Free Zone
      [55.3362, 25.2828], // Al Twar
      [55.3247, 25.2741], // Stadium
      [55.3132, 25.2654], // Al Qiyadah
      [55.3017, 25.2589], // Abu Hail
      [55.2902, 25.2568], // Salah Al Din
      [55.2787, 25.2625], // Union (interchange)
      [55.2672, 25.2682], // Baniyas Square
      [55.2614, 25.2709], // Palm Deira
      [55.2556, 25.2737], // Al Ras
      [55.2498, 25.2764], // Al Ghubaiba
      [55.2440, 25.2654], // Al Fahidi
      [55.2382, 25.2544], // BurJuman
      [55.2324, 25.2434], // Oud Metha
      [55.2266, 25.2324], // Dubai Healthcare City
      [55.2208, 25.2214], // Al Jadaf
      [55.2150, 25.2104], // Creek
    ],
  },
];
