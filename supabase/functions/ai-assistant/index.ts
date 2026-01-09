import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_ACCESS_TOKEN");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const systemPrompt = `You are an AI assistant for a Dubai real estate map application. Help admins add and edit projects, hotspots, DEVELOPERS, and ZONES.

CAPABILITIES:
1. Analyze brochures/images to extract project details
2. Parse text descriptions for project/hotspot/developer/zone information  
3. Use knowledge of Dubai real estate to fill in details
4. Geocode locations to get coordinates
5. Search for existing items to edit them
6. Update existing items with new data
7. **SEARCH THE WEB** to research developers and projects using the web_search tool
8. **CREATE DEVELOPERS** with full research including logo URLs, ratings, etc.
9. **BATCH CREATE PROJECTS** - Create multiple projects for a developer at once
10. **DOWNLOAD LOGOS** - Automatically download and process logos from URLs
11. **CREATE/UPDATE ZONES** - Manage investment zones with maturity levels, appreciation rates, etc.

CRITICAL - ZONE MANAGEMENT:
- Zones represent investment areas in Dubai with specific characteristics
- Each zone has: name, tagline, concept, maturity_level, investment_focus, property_types, price ranges, appreciation rates
- Maturity levels: 0-30 = Emerging, 31-60 = Growth, 61-80 = Established, 81-100 = Mature
- Investment focus options: "Capital Growth", "Rental Yield", "Balanced"
- Always search_items first when editing zones to find the zone_id

ZONE MATURITY GUIDELINES:
- Emerging (0-30): New developments, high risk/reward, limited infrastructure
- Growth (31-60): Developing areas, infrastructure coming, good upside potential
- Established (61-80): Mature infrastructure, stable returns, proven demand
- Mature (81-100): Prime locations, lower growth but stable, premium pricing

ZONE APPRECIATION RATE GUIDELINES:
- construction_appreciation: Off-plan appreciation during construction (5-20%)
- growth_appreciation: Post-handover appreciation in growth phase (3-12%)
- mature_appreciation: Long-term appreciation when area is mature (2-5%)
- growth_period_years: Years until area transitions to mature phase (3-10)
- rent_growth_rate: Annual rent increase rate (3-8%)

CRITICAL - WEB RESEARCH FOR DEVELOPERS:
- When user asks to create a developer (e.g., "create London Gate developer"), FIRST use web_search to research them
- Search for: official website, logo, founded year, headquarters, projects launched, description, key facts
- ALSO search for: "{developer} reviews ratings reputation" to inform your rating estimates
- Use multiple searches if needed to gather comprehensive data
- After finding a logo URL, use download_logo to save it (creates both original and white versions)
- After research, use create_developer with ALL gathered information INCLUDING RATINGS

CRITICAL - DEVELOPER RATINGS (MANDATORY):
When creating developers, you MUST ALWAYS estimate ALL ratings based on your research. NEVER leave ratings empty.

RATING GUIDELINES (1-10 scale):

1. rating_track_record: Based on years in market, projects delivered on time, reputation
   - 9-10: 15+ years, 95%+ on-time delivery, excellent reputation (e.g., Emaar, Nakheel)
   - 7-8: 10+ years, 85%+ on-time delivery, good reputation (e.g., DAMAC, Sobha)
   - 6-7: 5-10 years, decent track record, some delays (e.g., Danube, Binghatti)
   - 5-6: Newer developers, limited history but no major issues
   - Below 5: Known delivery delays or concerns

2. rating_quality: Based on construction quality reviews, materials, finishes
   - 9-10: Ultra-luxury, premium materials, award-winning quality (e.g., Omniyat, Ellington)
   - 7-8: High quality, good finishes, premium segment (e.g., Emaar, Sobha)
   - 6-7: Above average quality, good value (e.g., Select Group)
   - 5-6: Standard market quality
   - Below 5: Quality concerns reported

3. rating_flip_potential: Based on capital appreciation history, location premium, resale demand
   - 9-10: Historically 15%+ annual appreciation, prime locations (e.g., Emaar Downtown/Marina)
   - 7-8: Good appreciation 10-15%, strong resale market
   - 6-7: Average market appreciation 5-10%
   - 5-6: Below market appreciation
   - Below 5: Poor resale potential

4. score_maintenance: Based on post-handover service, facilities management, community upkeep
   - 9-10: Excellent service, responsive, well-maintained communities (e.g., Emaar, Meraas)
   - 7-8: Good service levels, professional management
   - 6-7: Adequate service, some complaints
   - 5-6: Average service
   - Below 5: Service complaints common

5. rating_sales: Marketing and sales effectiveness, customer experience
   - 9-10: World-class marketing, excellent sales experience
   - 7-8: Professional sales, good marketing
   - 5-6: Standard market approach
   - Below 5: Poor sales experience reported

6. rating_design: Architectural innovation and aesthetics
   - 9-10: Iconic designs, celebrity architects (e.g., Omniyat, DAMAC branded)
   - 7-8: Distinctive, high-quality architecture (e.g., Ellington)
   - 6-7: Above average design
   - 5-6: Standard market design
   - Below 5: Basic/generic designs

7. on_time_delivery_rate: Percentage of projects delivered on time (0-100)
   - Research or estimate based on track record
   - Top developers: 90-100%, Mid-tier: 70-90%, Newer: 60-80%

8. occupancy_rate: Average occupancy in completed projects (0-100)
   - Prime developers: 85-95%, Good developers: 75-85%, Average: 60-75%

WELL-KNOWN DEVELOPER REFERENCE RATINGS:
- Emaar: track_record=10, quality=9, flip_potential=9, maintenance=9, sales=9, design=8, delivery=95%
- DAMAC: track_record=8, quality=7, flip_potential=8, maintenance=7, sales=8, design=8, delivery=80%
- Sobha: track_record=8, quality=9, flip_potential=8, maintenance=8, sales=7, design=8, delivery=85%
- Nakheel: track_record=9, quality=8, flip_potential=9, maintenance=8, sales=8, design=7, delivery=90%
- Meraas: track_record=8, quality=9, flip_potential=8, maintenance=9, sales=8, design=9, delivery=90%
- Azizi: track_record=6, quality=6, flip_potential=7, maintenance=6, sales=7, design=6, delivery=70%
- Danube: track_record=6, quality=6, flip_potential=7, maintenance=6, sales=8, design=6, delivery=75%
- Binghatti: track_record=6, quality=7, flip_potential=7, maintenance=6, sales=7, design=8, delivery=70%
- Ellington: track_record=7, quality=9, flip_potential=8, maintenance=8, sales=7, design=9, delivery=80%
- Omniyat: track_record=7, quality=10, flip_potential=9, maintenance=9, sales=8, design=10, delivery=75%
- Select Group: track_record=7, quality=7, flip_potential=7, maintenance=7, sales=7, design=7, delivery=80%
- London Gate: track_record=5, quality=7, flip_potential=7, maintenance=6, sales=7, design=7, delivery=70%

For lesser-known developers, use conservative estimates (5-7 range) and adjust based on research findings.

CRITICAL - BATCH PROJECT CREATION:
- When creating a developer, also research their project portfolio
- Use web_search to find all their projects in Dubai
- Use create_projects_batch to create all found projects at once
- This is more efficient than creating projects one by one

CRITICAL - LOGO HANDLING:
- When you find a logo URL during web research, use download_logo to save it
- The tool will return both original logo_url and white_logo_url (inverted for dark backgrounds)
- Use these URLs when creating/updating developers

CRITICAL - EDITING vs CREATING:
- When user mentions editing/updating/modifying an EXISTING item, you MUST FIRST use search_items to find it
- If the item exists, use update_project, update_hotspot, update_developer, or update_zone (NOT create_*)
- If multiple matches found, ask user to clarify which one
- If no matches found, ask if they want to create a new item instead

INPUT HANDLING:
- IMAGES: Extract project name, developer, prices, unit types, amenities, location, delivery dates
- TEXT: Parse for explicit details (these override image data)
- BOTH: Combine all sources, text takes priority

REQUIRED FIELDS FOR NEW ITEMS:
- Projects: name, location (for geocoding)
- Hotspots: title, category, location
- Developers: name AND all 6 ratings (estimate if not found in research)
- Zones: name (polygon will be auto-generated as placeholder)

ALWAYS:
- Extract maximum data automatically
- Use web_search when creating developers to get real data
- ALWAYS provide ALL ratings when creating developers - NEVER skip them
- Only ask clarification for missing required fields
- Use tool calling to return structured data
- Be concise in responses
- For locations, try to extract area/district name in Dubai

KNOWN DUBAI DEVELOPERS: Emaar, DAMAC, Sobha, Nakheel, Meraas, Dubai Properties, Azizi, Omniyat, Select Group, Ellington, Binghatti, Danube, London Gate

HOTSPOT CATEGORIES: landmark, transportation, attraction, project, other

CONSTRUCTION STATUS OPTIONS: off_plan, under_construction, ready`;

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web to research developers, projects, or any real estate information. Use this to gather data before creating developers or projects.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (e.g., 'London Gate Dubai developer official website')" },
          purpose: { type: "string", description: "What information you're looking for (e.g., 'developer info', 'logo', 'projects')" },
        },
        required: ["query", "purpose"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_items",
      description: "Search for existing projects, hotspots, or developers by name/title. ALWAYS use this first when user mentions editing an existing item.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (project name, hotspot title, or developer name)" },
          item_type: { type: "string", enum: ["project", "hotspot", "developer", "all"], description: "Type of item to search for" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "download_logo",
      description: "Download a logo from a URL found during web research and upload it to storage. Returns both original and inverted (white) logo URLs.",
      parameters: {
        type: "object",
        properties: {
          image_url: { type: "string", description: "URL of the logo image to download" },
          developer_name: { type: "string", description: "Developer name for file naming" },
        },
        required: ["image_url", "developer_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_developer",
      description: "Create a NEW developer. Use web_search first to research the developer thoroughly.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Developer name" },
          logo_url: { type: "string", description: "URL to developer's logo (from download_logo)" },
          white_logo_url: { type: "string", description: "URL to inverted white logo (from download_logo)" },
          website: { type: "string", description: "Developer's official website" },
          description: { type: "string", description: "Detailed description of the developer" },
          short_bio: { type: "string", description: "Short 1-2 sentence bio" },
          headquarters: { type: "string", description: "HQ location (e.g., 'Dubai, UAE')" },
          founded_year: { type: "number", description: "Year founded" },
          projects_launched: { type: "number", description: "Number of projects launched" },
          units_sold: { type: "number", description: "Approximate units sold" },
          flagship_project: { type: "string", description: "Name of flagship/famous project" },
          rating_quality: { type: "number", description: "Build quality rating 1-10" },
          rating_track_record: { type: "number", description: "Track record rating 1-10" },
          rating_sales: { type: "number", description: "Sales/marketing rating 1-10" },
          rating_design: { type: "number", description: "Design/architecture rating 1-10" },
          rating_flip_potential: { type: "number", description: "Flip/resale potential rating 1-10" },
          score_maintenance: { type: "number", description: "Maintenance score 1-10" },
          on_time_delivery_rate: { type: "number", description: "On-time delivery percentage (0-100)" },
          occupancy_rate: { type: "number", description: "Average occupancy rate percentage (0-100)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_developer",
      description: "Update an EXISTING developer. Use after search_items confirms the developer exists.",
      parameters: {
        type: "object",
        properties: {
          developer_id: { type: "string", description: "UUID of the developer to update (from search_items)" },
          name: { type: "string", description: "Developer name" },
          logo_url: { type: "string", description: "URL to developer's logo" },
          white_logo_url: { type: "string", description: "URL to inverted white logo" },
          website: { type: "string", description: "Developer's official website" },
          description: { type: "string", description: "Detailed description" },
          short_bio: { type: "string", description: "Short bio" },
          headquarters: { type: "string", description: "HQ location" },
          founded_year: { type: "number", description: "Year founded" },
          projects_launched: { type: "number", description: "Number of projects" },
          units_sold: { type: "number", description: "Units sold" },
          flagship_project: { type: "string", description: "Flagship project name" },
          rating_quality: { type: "number", description: "Quality rating 1-10" },
          rating_track_record: { type: "number", description: "Track record rating 1-10" },
          rating_sales: { type: "number", description: "Sales rating 1-10" },
          rating_design: { type: "number", description: "Design rating 1-10" },
          rating_flip_potential: { type: "number", description: "Flip potential rating 1-10" },
          score_maintenance: { type: "number", description: "Maintenance score 1-10" },
          on_time_delivery_rate: { type: "number", description: "On-time delivery %" },
          occupancy_rate: { type: "number", description: "Occupancy rate %" },
        },
        required: ["developer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a NEW real estate project. Only use when creating a new item, NOT for editing existing ones.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          location: { type: "string", description: "Location/area in Dubai for geocoding" },
          description: { type: "string", description: "Project description" },
          developer: { type: "string", description: "Developer name" },
          developer_id: { type: "string", description: "Developer UUID if known" },
          starting_price: { type: "number", description: "Starting price in AED" },
          price_per_sqft: { type: "number", description: "Price per square foot in AED" },
          unit_types: { type: "array", items: { type: "string" }, description: "Types of units (Studio, 1BR, 2BR, etc)" },
          areas_from: { type: "number", description: "Minimum area in sq.ft" },
          launch_date: { type: "string", description: "Launch date (YYYY-MM-DD format)" },
          delivery_date: { type: "string", description: "Expected delivery date (YYYY-MM-DD format)" },
          construction_status: { type: "string", enum: ["off_plan", "under_construction", "ready"], description: "Current construction status" },
        },
        required: ["name", "location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_projects_batch",
      description: "Create multiple projects for a developer in batch. Use after researching a developer's portfolio.",
      parameters: {
        type: "object",
        properties: {
          developer_name: { type: "string", description: "Developer name" },
          developer_id: { type: "string", description: "Developer UUID if known" },
          projects: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Project name" },
                location: { type: "string", description: "Location/area in Dubai" },
                description: { type: "string", description: "Project description" },
                starting_price: { type: "number", description: "Starting price in AED" },
                unit_types: { type: "array", items: { type: "string" }, description: "Types of units" },
                construction_status: { type: "string", enum: ["off_plan", "under_construction", "ready"], description: "Status" },
                delivery_date: { type: "string", description: "Delivery date (YYYY-MM-DD)" },
              },
              required: ["name", "location"],
            },
            description: "Array of projects to create",
          },
        },
        required: ["developer_name", "projects"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update an EXISTING project. Use after search_items confirms the project exists.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "UUID of the project to update (from search_items)" },
          name: { type: "string", description: "Project name" },
          location: { type: "string", description: "Location/area in Dubai for geocoding" },
          description: { type: "string", description: "Project description" },
          developer: { type: "string", description: "Developer name" },
          developer_id: { type: "string", description: "Developer UUID" },
          starting_price: { type: "number", description: "Starting price in AED" },
          price_per_sqft: { type: "number", description: "Price per square foot in AED" },
          unit_types: { type: "array", items: { type: "string" }, description: "Types of units" },
          areas_from: { type: "number", description: "Minimum area in sq.ft" },
          launch_date: { type: "string", description: "Launch date (YYYY-MM-DD format)" },
          delivery_date: { type: "string", description: "Expected delivery date (YYYY-MM-DD format)" },
          construction_status: { type: "string", enum: ["off_plan", "under_construction", "ready"], description: "Current construction status" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_hotspot",
      description: "Create a NEW hotspot/point of interest. Only use when creating a new item, NOT for editing.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Hotspot name" },
          location: { type: "string", description: "Location in Dubai for geocoding" },
          category: { type: "string", enum: ["landmark", "transportation", "attraction", "project", "other"], description: "Hotspot category" },
          description: { type: "string", description: "Description of the hotspot" },
        },
        required: ["title", "location", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_hotspot",
      description: "Update an EXISTING hotspot. Use after search_items confirms the hotspot exists.",
      parameters: {
        type: "object",
        properties: {
          hotspot_id: { type: "string", description: "UUID of the hotspot to update (from search_items)" },
          title: { type: "string", description: "Hotspot name" },
          location: { type: "string", description: "Location in Dubai for geocoding" },
          category: { type: "string", enum: ["landmark", "transportation", "attraction", "project", "other"], description: "Hotspot category" },
          description: { type: "string", description: "Description of the hotspot" },
        },
        required: ["hotspot_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_clarification",
      description: "Ask the user for missing required information",
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question to ask the user" },
          missing_fields: { type: "array", items: { type: "string" }, description: "List of missing required fields" },
        },
        required: ["question", "missing_fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_coordinates",
      description: "Request manual coordinates when geocoding fails",
      parameters: {
        type: "object",
        properties: {
          location_attempted: { type: "string", description: "The location that failed to geocode" },
          suggestions: { type: "array", items: { type: "string" }, description: "Alternative location names to try" },
        },
        required: ["location_attempted"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_zone",
      description: "Create a NEW zone/investment area. Use when user asks to add a new zone.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Zone name (e.g., 'Dubai Marina', 'Business Bay')" },
          tagline: { type: "string", description: "Short tagline for the zone" },
          concept: { type: "string", description: "Zone concept/development vision" },
          description: { type: "string", description: "Detailed zone description" },
          maturity_level: { type: "number", description: "Maturity level 0-100 (0-30=Emerging, 31-60=Growth, 61-80=Established, 81-100=Mature)" },
          maturity_label: { type: "string", enum: ["Emerging", "Growth", "Established", "Mature"], description: "Maturity category label" },
          investment_focus: { type: "string", enum: ["Capital Growth", "Rental Yield", "Balanced"], description: "Primary investment focus" },
          main_developer: { type: "string", description: "Main developer in the area" },
          property_types: { type: "string", description: "Types of properties (e.g., 'Apartments, Villas, Townhouses')" },
          price_range_min: { type: "number", description: "Minimum price per sqft in AED" },
          price_range_max: { type: "number", description: "Maximum price per sqft in AED" },
          ticket_1br_min: { type: "number", description: "Minimum 1BR price in AED" },
          ticket_1br_max: { type: "number", description: "Maximum 1BR price in AED" },
          construction_appreciation: { type: "number", description: "Off-plan appreciation rate % (5-20)" },
          growth_appreciation: { type: "number", description: "Growth phase appreciation rate % (3-12)" },
          mature_appreciation: { type: "number", description: "Mature phase appreciation rate % (2-5)" },
          growth_period_years: { type: "number", description: "Years until area matures (3-10)" },
          rent_growth_rate: { type: "number", description: "Annual rent growth rate % (3-8)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_zone",
      description: "Update an EXISTING zone. Use after search_items confirms the zone exists.",
      parameters: {
        type: "object",
        properties: {
          zone_id: { type: "string", description: "UUID of the zone to update (from search_items)" },
          name: { type: "string", description: "Zone name" },
          tagline: { type: "string", description: "Short tagline" },
          concept: { type: "string", description: "Zone concept" },
          description: { type: "string", description: "Detailed description" },
          maturity_level: { type: "number", description: "Maturity level 0-100" },
          maturity_label: { type: "string", enum: ["Emerging", "Growth", "Established", "Mature"], description: "Maturity label" },
          investment_focus: { type: "string", enum: ["Capital Growth", "Rental Yield", "Balanced"], description: "Investment focus" },
          main_developer: { type: "string", description: "Main developer" },
          property_types: { type: "string", description: "Property types" },
          price_range_min: { type: "number", description: "Min price per sqft" },
          price_range_max: { type: "number", description: "Max price per sqft" },
          ticket_1br_min: { type: "number", description: "Min 1BR price" },
          ticket_1br_max: { type: "number", description: "Max 1BR price" },
          construction_appreciation: { type: "number", description: "Construction appreciation %" },
          growth_appreciation: { type: "number", description: "Growth appreciation %" },
          mature_appreciation: { type: "number", description: "Mature appreciation %" },
          growth_period_years: { type: "number", description: "Growth period years" },
          rent_growth_rate: { type: "number", description: "Rent growth rate %" },
        },
        required: ["zone_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_zones",
      description: "Search for zones by name. Use this to find zone_id before updating.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Zone name to search for" },
        },
        required: ["query"],
      },
    },
  },
];

async function webSearch(query: string): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!FIRECRAWL_API_KEY) {
    console.error("FIRECRAWL_API_KEY not configured");
    return { success: false, error: "Web search not configured" };
  }

  try {
    console.log("Web search:", query);
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Firecrawl error:", data);
      return { success: false, error: data.error || "Search failed" };
    }

    console.log("Web search results:", data.data?.length || 0, "results");
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Web search error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Search failed" };
  }
}

async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!MAPBOX_TOKEN) {
    console.error("MAPBOX_ACCESS_TOKEN not configured");
    return null;
  }

  try {
    const searchQuery = location.toLowerCase().includes("dubai") ? location : `${location}, Dubai, UAE`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=1&bbox=54.9,24.7,56.5,25.6`;
    
    console.log("Geocoding:", searchQuery);
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      console.log("Geocoded to:", { latitude, longitude });
      return { latitude, longitude };
    }
    
    console.log("No geocoding results for:", location);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function searchItems(supabase: any, query: string, itemType: string = "all") {
  const results: { projects: any[]; hotspots: any[]; developers: any[]; zones: any[] } = { projects: [], hotspots: [], developers: [], zones: [] };
  
  if (itemType === "project" || itemType === "all") {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, location, description, developer, latitude, longitude")
      .ilike("name", `%${query}%`)
      .limit(5);
    results.projects = projects || [];
  }
  
  if (itemType === "hotspot" || itemType === "all") {
    const { data: hotspots } = await supabase
      .from("hotspots")
      .select("id, title, category, description, latitude, longitude")
      .ilike("title", `%${query}%`)
      .limit(5);
    results.hotspots = hotspots || [];
  }
  
  if (itemType === "developer" || itemType === "all") {
    const { data: developers } = await supabase
      .from("developers")
      .select("id, name, logo_url, white_logo_url, website, short_bio, founded_year, projects_launched")
      .ilike("name", `%${query}%`)
      .limit(5);
    results.developers = developers || [];
  }
  
  if (itemType === "zone" || itemType === "all") {
    const { data: zones } = await supabase
      .from("zones")
      .select("id, name, tagline, maturity_level, maturity_label, investment_focus, main_developer, property_types, construction_appreciation, growth_appreciation, mature_appreciation")
      .ilike("name", `%${query}%`)
      .limit(5);
    results.zones = zones || [];
  }
  
  return results;
}

async function searchZones(supabase: any, query: string) {
  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, tagline, maturity_level, maturity_label, investment_focus, main_developer, property_types, price_range_min, price_range_max, construction_appreciation, growth_appreciation, mature_appreciation, growth_period_years, rent_growth_rate")
    .ilike("name", `%${query}%`)
    .limit(10);
  return zones || [];
}

async function downloadAndProcessLogo(imageUrl: string, developerName: string, supabase: any): Promise<{ logo_url: string; white_logo_url: string | null } | null> {
  try {
    console.log("Downloading logo from:", imageUrl);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("Failed to fetch logo:", response.status);
      return null;
    }
    
    const contentType = response.headers.get("content-type") || "image/png";
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Generate unique filename
    const slug = developerName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const timestamp = Date.now();
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const originalPath = `${slug}-logo-${timestamp}.${ext}`;
    
    // Upload original logo
    const { error: uploadError } = await supabase.storage
      .from("developer-logos")
      .upload(originalPath, uint8Array, { contentType });
    
    if (uploadError) {
      console.error("Failed to upload logo:", uploadError);
      return null;
    }
    
    const { data: { publicUrl: logoUrl } } = supabase.storage.from("developer-logos").getPublicUrl(originalPath);
    
    console.log("Logo uploaded:", logoUrl);
    
    // Note: Inversion is done client-side when the logo is uploaded via the DeveloperForm
    // For AI-created developers, we return only the original URL
    return { logo_url: logoUrl, white_logo_url: null };
  } catch (error) {
    console.error("Error downloading logo:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, images, action, data } = await req.json();
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Handle confirmation action for CREATE
    if (action === "confirm") {
      console.log("Confirming data insertion:", data);
      
      if (data.type === "developer") {
        const developerData: any = {
          name: data.name,
        };
        if (data.logo_url) developerData.logo_url = data.logo_url;
        if (data.white_logo_url) developerData.white_logo_url = data.white_logo_url;
        if (data.website) developerData.website = data.website;
        if (data.description) developerData.description = data.description;
        if (data.short_bio) developerData.short_bio = data.short_bio;
        if (data.headquarters) developerData.headquarters = data.headquarters;
        if (data.founded_year) developerData.founded_year = data.founded_year;
        if (data.projects_launched) developerData.projects_launched = data.projects_launched;
        if (data.units_sold) developerData.units_sold = data.units_sold;
        if (data.flagship_project) developerData.flagship_project = data.flagship_project;
        if (data.rating_quality) developerData.rating_quality = data.rating_quality;
        if (data.rating_track_record) developerData.rating_track_record = data.rating_track_record;
        if (data.rating_sales) developerData.rating_sales = data.rating_sales;
        if (data.rating_design) developerData.rating_design = data.rating_design;
        if (data.rating_flip_potential) developerData.rating_flip_potential = data.rating_flip_potential;
        if (data.score_maintenance) developerData.score_maintenance = data.score_maintenance;
        if (data.on_time_delivery_rate) developerData.on_time_delivery_rate = data.on_time_delivery_rate;
        if (data.occupancy_rate) developerData.occupancy_rate = data.occupancy_rate;
        
        const { data: insertedDeveloper, error } = await supabase.from("developers").insert(developerData).select().single();
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Developer "${data.name}" creado exitosamente.`, developer_id: insertedDeveloper?.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (data.type === "project") {
        const { error } = await supabase.from("projects").insert({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          description: data.description,
          developer: data.developer,
          developer_id: data.developer_id,
          starting_price: data.starting_price,
          price_per_sqft: data.price_per_sqft,
          unit_types: data.unit_types,
          areas_from: data.areas_from,
          launch_date: data.launch_date,
          delivery_date: data.delivery_date,
          construction_status: data.construction_status,
        });
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Proyecto "${data.name}" creado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "hotspot") {
        const { error } = await supabase.from("hotspots").insert({
          title: data.title,
          latitude: data.latitude,
          longitude: data.longitude,
          category: data.category,
          description: data.description,
          visible: true,
        });
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Hotspot "${data.title}" creado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "projects_batch") {
        // Handle batch project creation
        const results: { success: string[]; failed: string[] } = { success: [], failed: [] };
        
        for (const project of data.projects) {
          const { error } = await supabase.from("projects").insert({
            name: project.name,
            latitude: project.latitude,
            longitude: project.longitude,
            description: project.description,
            developer: data.developer_name,
            developer_id: data.developer_id,
            starting_price: project.starting_price,
            unit_types: project.unit_types,
            delivery_date: project.delivery_date,
            construction_status: project.construction_status,
          });
          
          if (error) {
            console.error("Failed to create project:", project.name, error);
            results.failed.push(project.name);
          } else {
            results.success.push(project.name);
          }
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Creados ${results.success.length} proyectos exitosamente.${results.failed.length > 0 ? ` Fallaron: ${results.failed.join(", ")}` : ""}`,
            results 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "zone") {
        // Generate a default polygon centered on Dubai
        const defaultPolygon = {
          type: "Polygon",
          coordinates: [[[55.27, 25.20], [55.28, 25.20], [55.28, 25.21], [55.27, 25.21], [55.27, 25.20]]]
        };
        
        const { error } = await supabase.from("zones").insert({
          name: data.name,
          tagline: data.tagline,
          concept: data.concept,
          description: data.description,
          maturity_level: data.maturity_level || 50,
          maturity_label: data.maturity_label,
          investment_focus: data.investment_focus,
          main_developer: data.main_developer,
          property_types: data.property_types,
          price_range_min: data.price_range_min,
          price_range_max: data.price_range_max,
          ticket_1br_min: data.ticket_1br_min,
          ticket_1br_max: data.ticket_1br_max,
          construction_appreciation: data.construction_appreciation,
          growth_appreciation: data.growth_appreciation,
          mature_appreciation: data.mature_appreciation,
          growth_period_years: data.growth_period_years,
          rent_growth_rate: data.rent_growth_rate,
          polygon: defaultPolygon,
          visible: true,
          color: '#2563EB',
        });
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Zone "${data.name}" creada exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle UPDATE action
    if (action === "update") {
      console.log("Updating data:", data);
      
      if (data.type === "developer" && data.id) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.logo_url !== undefined) updateData.logo_url = data.logo_url;
        if (data.white_logo_url !== undefined) updateData.white_logo_url = data.white_logo_url;
        if (data.website !== undefined) updateData.website = data.website;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.short_bio !== undefined) updateData.short_bio = data.short_bio;
        if (data.headquarters !== undefined) updateData.headquarters = data.headquarters;
        if (data.founded_year !== undefined) updateData.founded_year = data.founded_year;
        if (data.projects_launched !== undefined) updateData.projects_launched = data.projects_launched;
        if (data.units_sold !== undefined) updateData.units_sold = data.units_sold;
        if (data.flagship_project !== undefined) updateData.flagship_project = data.flagship_project;
        if (data.rating_quality !== undefined) updateData.rating_quality = data.rating_quality;
        if (data.rating_track_record !== undefined) updateData.rating_track_record = data.rating_track_record;
        if (data.rating_sales !== undefined) updateData.rating_sales = data.rating_sales;
        if (data.rating_design !== undefined) updateData.rating_design = data.rating_design;
        if (data.rating_flip_potential !== undefined) updateData.rating_flip_potential = data.rating_flip_potential;
        if (data.score_maintenance !== undefined) updateData.score_maintenance = data.score_maintenance;
        if (data.on_time_delivery_rate !== undefined) updateData.on_time_delivery_rate = data.on_time_delivery_rate;
        if (data.occupancy_rate !== undefined) updateData.occupancy_rate = data.occupancy_rate;
        
        const { error } = await supabase
          .from("developers")
          .update(updateData)
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Developer "${data.name}" actualizado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (data.type === "project" && data.id) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.developer !== undefined) updateData.developer = data.developer;
        if (data.developer_id !== undefined) updateData.developer_id = data.developer_id;
        if (data.starting_price !== undefined) updateData.starting_price = data.starting_price;
        if (data.price_per_sqft !== undefined) updateData.price_per_sqft = data.price_per_sqft;
        if (data.unit_types !== undefined) updateData.unit_types = data.unit_types;
        if (data.areas_from !== undefined) updateData.areas_from = data.areas_from;
        if (data.launch_date !== undefined) updateData.launch_date = data.launch_date;
        if (data.delivery_date !== undefined) updateData.delivery_date = data.delivery_date;
        if (data.construction_status !== undefined) updateData.construction_status = data.construction_status;
        
        const { error } = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Proyecto "${data.name}" actualizado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "hotspot" && data.id) {
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.description !== undefined) updateData.description = data.description;
        
        const { error } = await supabase
          .from("hotspots")
          .update(updateData)
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Hotspot "${data.title}" actualizado exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (data.type === "zone" && data.id) {
        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.tagline !== undefined) updateData.tagline = data.tagline;
        if (data.concept !== undefined) updateData.concept = data.concept;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.maturity_level !== undefined) updateData.maturity_level = data.maturity_level;
        if (data.maturity_label !== undefined) updateData.maturity_label = data.maturity_label;
        if (data.investment_focus !== undefined) updateData.investment_focus = data.investment_focus;
        if (data.main_developer !== undefined) updateData.main_developer = data.main_developer;
        if (data.property_types !== undefined) updateData.property_types = data.property_types;
        if (data.price_range_min !== undefined) updateData.price_range_min = data.price_range_min;
        if (data.price_range_max !== undefined) updateData.price_range_max = data.price_range_max;
        if (data.ticket_1br_min !== undefined) updateData.ticket_1br_min = data.ticket_1br_min;
        if (data.ticket_1br_max !== undefined) updateData.ticket_1br_max = data.ticket_1br_max;
        if (data.construction_appreciation !== undefined) updateData.construction_appreciation = data.construction_appreciation;
        if (data.growth_appreciation !== undefined) updateData.growth_appreciation = data.growth_appreciation;
        if (data.mature_appreciation !== undefined) updateData.mature_appreciation = data.mature_appreciation;
        if (data.growth_period_years !== undefined) updateData.growth_period_years = data.growth_period_years;
        if (data.rent_growth_rate !== undefined) updateData.rent_growth_rate = data.rent_growth_rate;
        
        const { error } = await supabase
          .from("zones")
          .update(updateData)
          .eq("id", data.id);
        
        if (error) throw error;
        return new Response(
          JSON.stringify({ success: true, message: `Zone "${data.name}" actualizada exitosamente.` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle manual coordinates
    if (action === "set_coordinates") {
      return new Response(
        JSON.stringify({ 
          ...data, 
          latitude: data.latitude, 
          longitude: data.longitude,
          needsConfirmation: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build messages for AI
    const aiMessages: any[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of messages) {
      if (msg.role === "user") {
        if (msg.images && msg.images.length > 0) {
          const content: any[] = [{ type: "text", text: msg.content || "Analiza estas imágenes y extrae la información del proyecto o hotspot." }];
          for (const img of msg.images) {
            content.push({
              type: "image_url",
              image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` }
            });
          }
          aiMessages.push({ role: "user", content });
        } else {
          aiMessages.push({ role: "user", content: msg.content });
        }
      } else {
        aiMessages.push({ role: "assistant", content: msg.content });
      }
    }

    // Add current images if any
    if (images && images.length > 0) {
      const lastUserMsg = aiMessages[aiMessages.length - 1];
      if (lastUserMsg.role === "user" && typeof lastUserMsg.content === "string") {
        const content: any[] = [{ type: "text", text: lastUserMsg.content }];
        for (const img of images) {
          content.push({
            type: "image_url",
            image_url: { url: img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}` }
          });
        }
        aiMessages[aiMessages.length - 1] = { role: "user", content };
      }
    }

    console.log("Calling Lovable AI with", aiMessages.length, "messages");

    // Agentic loop - allow multiple tool calls
    let loopCount = 0;
    const maxLoops = 8;
    let webSearchResults: any[] = [];
    let downloadedLogos: { logo_url: string; white_logo_url: string | null } | null = null;
    
    while (loopCount < maxLoops) {
      loopCount++;
      console.log("AI loop iteration:", loopCount);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required. Please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const aiResponse = await response.json();
      console.log("AI Response:", JSON.stringify(aiResponse, null, 2));
      
      const choice = aiResponse.choices[0];
      const message = choice.message;

      // Check for tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);

        console.log("Tool call:", functionName, args);

        // Handle web_search - continue loop after search
        if (functionName === "web_search") {
          const searchResult = await webSearch(args.query);
          webSearchResults.push({ query: args.query, purpose: args.purpose, results: searchResult });
          
          // Add tool result to messages and continue loop
          aiMessages.push({
            role: "assistant",
            content: null,
            tool_calls: message.tool_calls,
          });
          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(searchResult),
          });
          continue; // Continue the loop to let AI process search results
        }

        // Handle download_logo
        if (functionName === "download_logo") {
          const logoResult = await downloadAndProcessLogo(args.image_url, args.developer_name, supabase);
          
          if (logoResult) {
            downloadedLogos = logoResult;
          }
          
          // Add tool result to messages and continue loop
          aiMessages.push({
            role: "assistant",
            content: null,
            tool_calls: message.tool_calls,
          });
          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(logoResult || { error: "Failed to download logo" }),
          });
          continue;
        }

        // Handle search_items
        if (functionName === "search_items") {
          const results = await searchItems(supabase, args.query, args.item_type || "all");
          const totalResults = results.projects.length + results.hotspots.length + results.developers.length + results.zones.length;
          
          console.log("Search results:", results);
          
          if (totalResults === 0) {
            return new Response(
              JSON.stringify({
                type: "search_results",
                message: `No encontré ningún item con "${args.query}". ¿Quieres crear uno nuevo?`,
                results,
                query: args.query,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({
              type: "search_results",
              message: `Encontré ${totalResults} resultado(s) para "${args.query}". ¿Cuál quieres editar?`,
              results,
              query: args.query,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle create_developer
        if (functionName === "create_developer") {
          // Use downloaded logos if available
          if (downloadedLogos) {
            args.logo_url = args.logo_url || downloadedLogos.logo_url;
            args.white_logo_url = args.white_logo_url || downloadedLogos.white_logo_url;
          }
          
          return new Response(
            JSON.stringify({
              type: "preview",
              itemType: "developer",
              data: {
                type: "developer",
                ...args,
              },
              message: `He recopilado información del developer "${args.name}". Revisa los datos y confirma para guardarlo.`,
              webSearchResults,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle create_projects_batch
        if (functionName === "create_projects_batch") {
          // Geocode each project
          const projectsWithCoords = [];
          const failedGeocode = [];
          
          for (const project of args.projects) {
            const coords = await geocodeLocation(project.location);
            if (coords) {
              projectsWithCoords.push({
                ...project,
                latitude: coords.latitude,
                longitude: coords.longitude,
              });
            } else {
              failedGeocode.push(project.name);
            }
          }
          
          return new Response(
            JSON.stringify({
              type: "preview",
              itemType: "projects_batch",
              data: {
                type: "projects_batch",
                developer_name: args.developer_name,
                developer_id: args.developer_id,
                projects: projectsWithCoords,
              },
              message: `He preparado ${projectsWithCoords.length} proyectos para "${args.developer_name}". ${failedGeocode.length > 0 ? `No pude geocodificar: ${failedGeocode.join(", ")}.` : ""} Revisa y confirma para guardarlos.`,
              webSearchResults,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle update_developer
        if (functionName === "update_developer") {
          const { data: existingDeveloper } = await supabase
            .from("developers")
            .select("*")
            .eq("id", args.developer_id)
            .single();
          
          if (!existingDeveloper) {
            return new Response(
              JSON.stringify({
                type: "message",
                message: "No encontré el developer especificado. ¿Podrías buscarlo primero?",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updatedData = {
            type: "developer",
            id: args.developer_id,
            name: args.name || existingDeveloper.name,
            logo_url: args.logo_url !== undefined ? args.logo_url : existingDeveloper.logo_url,
            white_logo_url: args.white_logo_url !== undefined ? args.white_logo_url : existingDeveloper.white_logo_url,
            website: args.website !== undefined ? args.website : existingDeveloper.website,
            description: args.description !== undefined ? args.description : existingDeveloper.description,
            short_bio: args.short_bio !== undefined ? args.short_bio : existingDeveloper.short_bio,
            headquarters: args.headquarters !== undefined ? args.headquarters : existingDeveloper.headquarters,
            founded_year: args.founded_year !== undefined ? args.founded_year : existingDeveloper.founded_year,
            projects_launched: args.projects_launched !== undefined ? args.projects_launched : existingDeveloper.projects_launched,
            units_sold: args.units_sold !== undefined ? args.units_sold : existingDeveloper.units_sold,
            flagship_project: args.flagship_project !== undefined ? args.flagship_project : existingDeveloper.flagship_project,
            rating_quality: args.rating_quality !== undefined ? args.rating_quality : existingDeveloper.rating_quality,
            rating_track_record: args.rating_track_record !== undefined ? args.rating_track_record : existingDeveloper.rating_track_record,
            rating_sales: args.rating_sales !== undefined ? args.rating_sales : existingDeveloper.rating_sales,
            rating_design: args.rating_design !== undefined ? args.rating_design : existingDeveloper.rating_design,
            rating_flip_potential: args.rating_flip_potential !== undefined ? args.rating_flip_potential : existingDeveloper.rating_flip_potential,
            score_maintenance: args.score_maintenance !== undefined ? args.score_maintenance : existingDeveloper.score_maintenance,
            on_time_delivery_rate: args.on_time_delivery_rate !== undefined ? args.on_time_delivery_rate : existingDeveloper.on_time_delivery_rate,
            occupancy_rate: args.occupancy_rate !== undefined ? args.occupancy_rate : existingDeveloper.occupancy_rate,
          };

          return new Response(
            JSON.stringify({
              type: "update_preview",
              itemType: "developer",
              data: updatedData,
              originalData: existingDeveloper,
              message: `Voy a actualizar el developer "${updatedData.name}". Revisa los cambios y confirma.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle update_project
        if (functionName === "update_project") {
          const { data: existingProject } = await supabase
            .from("projects")
            .select("*")
            .eq("id", args.project_id)
            .single();
          
          if (!existingProject) {
            return new Response(
              JSON.stringify({
                type: "message",
                message: "No encontré el proyecto especificado. ¿Podrías buscarlo primero?",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          let coords = { latitude: existingProject.latitude, longitude: existingProject.longitude };
          if (args.location && args.location !== existingProject.location) {
            const newCoords = await geocodeLocation(args.location);
            if (newCoords) {
              coords = newCoords;
            }
          }

          const updatedData = {
            type: "project",
            id: args.project_id,
            name: args.name || existingProject.name,
            location: args.location || existingProject.location,
            description: args.description !== undefined ? args.description : existingProject.description,
            developer: args.developer !== undefined ? args.developer : existingProject.developer,
            developer_id: args.developer_id !== undefined ? args.developer_id : existingProject.developer_id,
            starting_price: args.starting_price !== undefined ? args.starting_price : existingProject.starting_price,
            price_per_sqft: args.price_per_sqft !== undefined ? args.price_per_sqft : existingProject.price_per_sqft,
            unit_types: args.unit_types !== undefined ? args.unit_types : existingProject.unit_types,
            areas_from: args.areas_from !== undefined ? args.areas_from : existingProject.areas_from,
            launch_date: args.launch_date !== undefined ? args.launch_date : existingProject.launch_date,
            delivery_date: args.delivery_date !== undefined ? args.delivery_date : existingProject.delivery_date,
            construction_status: args.construction_status !== undefined ? args.construction_status : existingProject.construction_status,
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          return new Response(
            JSON.stringify({
              type: "update_preview",
              itemType: "project",
              data: updatedData,
              originalData: existingProject,
              message: `Voy a actualizar el proyecto "${updatedData.name}". Revisa los cambios y confirma.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle update_hotspot
        if (functionName === "update_hotspot") {
          const { data: existingHotspot } = await supabase
            .from("hotspots")
            .select("*")
            .eq("id", args.hotspot_id)
            .single();
          
          if (!existingHotspot) {
            return new Response(
              JSON.stringify({
                type: "message",
                message: "No encontré el hotspot especificado. ¿Podrías buscarlo primero?",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          let coords = { latitude: existingHotspot.latitude, longitude: existingHotspot.longitude };
          if (args.location) {
            const newCoords = await geocodeLocation(args.location);
            if (newCoords) {
              coords = newCoords;
            }
          }

          const updatedData = {
            type: "hotspot",
            id: args.hotspot_id,
            title: args.title || existingHotspot.title,
            category: args.category || existingHotspot.category,
            description: args.description !== undefined ? args.description : existingHotspot.description,
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          return new Response(
            JSON.stringify({
              type: "update_preview",
              itemType: "hotspot",
              data: updatedData,
              originalData: existingHotspot,
              message: `Voy a actualizar el hotspot "${updatedData.title}". Revisa los cambios y confirma.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (functionName === "create_project") {
          const coords = await geocodeLocation(args.location);
          
          if (!coords) {
            return new Response(
              JSON.stringify({
                type: "request_coordinates",
                message: `No pude encontrar las coordenadas para "${args.location}". ¿Podrías proporcionar una ubicación más específica o las coordenadas manualmente?`,
                data: { ...args, type: "project" },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              type: "preview",
              itemType: "project",
              data: {
                type: "project",
                ...args,
                latitude: coords.latitude,
                longitude: coords.longitude,
              },
              message: `He extraído la información del proyecto "${args.name}". Revisa los datos y confirma para guardarlo.`,
              webSearchResults,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (functionName === "create_hotspot") {
          const coords = await geocodeLocation(args.location);
          
          if (!coords) {
            return new Response(
              JSON.stringify({
                type: "request_coordinates",
                message: `No pude encontrar las coordenadas para "${args.location}". ¿Podrías proporcionar una ubicación más específica o las coordenadas manualmente?`,
                data: { ...args, type: "hotspot" },
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              type: "preview",
              itemType: "hotspot",
              data: {
                type: "hotspot",
                ...args,
                latitude: coords.latitude,
                longitude: coords.longitude,
              },
              message: `He extraído la información del hotspot "${args.title}". Revisa los datos y confirma para guardarlo.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle search_zones
        if (functionName === "search_zones") {
          const zones = await searchZones(supabase, args.query);
          
          let resultContent;
          if (zones.length === 0) {
            resultContent = `No encontré zones con el nombre "${args.query}". ¿Quieres crear una nueva zone?`;
          } else {
            const zonesInfo = zones.map((z: any) => 
              `- ${z.name} (ID: ${z.id}, Maturity: ${z.maturity_level || 'N/A'}%, Focus: ${z.investment_focus || 'N/A'})`
            ).join("\n");
            resultContent = `Encontré ${zones.length} zone(s):\n${zonesInfo}`;
          }
          
          // Add tool result to messages and continue loop
          aiMessages.push({
            role: "assistant",
            content: null,
            tool_calls: message.tool_calls,
          });
          aiMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: resultContent,
          });
          continue;
        }

        // Handle create_zone
        if (functionName === "create_zone") {
          return new Response(
            JSON.stringify({
              type: "preview",
              itemType: "zone",
              data: {
                type: "zone",
                ...args,
                maturity_level: args.maturity_level || 50,
              },
              message: `He preparado la zona "${args.name}". Revisa los datos y confirma para guardarla.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Handle update_zone
        if (functionName === "update_zone") {
          const { data: existingZone } = await supabase
            .from("zones")
            .select("*")
            .eq("id", args.zone_id)
            .single();
          
          if (!existingZone) {
            return new Response(
              JSON.stringify({
                type: "message",
                message: "No encontré la zona especificada. ¿Podrías buscarla primero con search_zones?",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const updatedData = {
            type: "zone",
            id: args.zone_id,
            name: args.name || existingZone.name,
            tagline: args.tagline !== undefined ? args.tagline : existingZone.tagline,
            concept: args.concept !== undefined ? args.concept : existingZone.concept,
            description: args.description !== undefined ? args.description : existingZone.description,
            maturity_level: args.maturity_level !== undefined ? args.maturity_level : existingZone.maturity_level,
            maturity_label: args.maturity_label !== undefined ? args.maturity_label : existingZone.maturity_label,
            investment_focus: args.investment_focus !== undefined ? args.investment_focus : existingZone.investment_focus,
            main_developer: args.main_developer !== undefined ? args.main_developer : existingZone.main_developer,
            property_types: args.property_types !== undefined ? args.property_types : existingZone.property_types,
            price_range_min: args.price_range_min !== undefined ? args.price_range_min : existingZone.price_range_min,
            price_range_max: args.price_range_max !== undefined ? args.price_range_max : existingZone.price_range_max,
            ticket_1br_min: args.ticket_1br_min !== undefined ? args.ticket_1br_min : existingZone.ticket_1br_min,
            ticket_1br_max: args.ticket_1br_max !== undefined ? args.ticket_1br_max : existingZone.ticket_1br_max,
            construction_appreciation: args.construction_appreciation !== undefined ? args.construction_appreciation : existingZone.construction_appreciation,
            growth_appreciation: args.growth_appreciation !== undefined ? args.growth_appreciation : existingZone.growth_appreciation,
            mature_appreciation: args.mature_appreciation !== undefined ? args.mature_appreciation : existingZone.mature_appreciation,
            growth_period_years: args.growth_period_years !== undefined ? args.growth_period_years : existingZone.growth_period_years,
            rent_growth_rate: args.rent_growth_rate !== undefined ? args.rent_growth_rate : existingZone.rent_growth_rate,
          };

          return new Response(
            JSON.stringify({
              type: "update_preview",
              itemType: "zone",
              data: updatedData,
              originalData: existingZone,
              message: `Voy a actualizar la zona "${updatedData.name}". Revisa los cambios y confirma.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (functionName === "ask_clarification") {
          return new Response(
            JSON.stringify({
              type: "clarification",
              message: args.question,
              missingFields: args.missing_fields,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (functionName === "request_coordinates") {
          return new Response(
            JSON.stringify({
              type: "request_coordinates",
              message: `No pude geocodificar "${args.location_attempted}". ${args.suggestions ? `Prueba con: ${args.suggestions.join(", ")}` : "Por favor proporciona las coordenadas manualmente o una ubicación más específica."}`,
              data: args,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Regular text response - exit loop
      return new Response(
        JSON.stringify({
          type: "message",
          message: message.content || "No pude procesar tu solicitud. ¿Podrías proporcionar más detalles?",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Max loops reached
    return new Response(
      JSON.stringify({
        type: "message",
        message: "He realizado varias búsquedas pero no pude completar la tarea. ¿Podrías proporcionar más detalles?",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
