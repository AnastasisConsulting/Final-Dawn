export const LORE_DATA = {
  "world_id": "G1-S1-O1",
  "meta": { "name": "S-11 Drill", "description": "Unexplored.", "generated_at": "2026-01-27T17:27:25.255Z" },
  "global_history": "S-11 was a silent stone until the Syndicate pierced the Quartz Furnace. To tap the star’s radioactive marrow, they anchored this moon with monolithic drills. Now, the surface is a graveyard of grinding gears and lead-lined pods. Automated rigs scream into the core, drawing up raw energy that glows with a lethal, violet hue. The air is thick with ionized dust; the ground vibrates with the furnace’s subterranean roar. Here, life is an afterthought, confined to lead-shielded boxes, while the machinery above harvests the heat of a captive sun.",
  "civilizations": [
    {
      "name": "The Marrow-Hollowed Union",
      "attribute_key": "STR",
      "summary": "A civilization of resilient heavy-duty engineers and automated-rig overseers who have transformed S-11 Drill from a mere moon into a colossal, living engine. Born from the necessity of deep-core radiation drilling, they value physical durability and structural integrity above all else.",
      "culture_notes": { "themes": ["Industrial Brutalism", "Rad-Shielded Engineering", "Seismic Mastery", "Subterranean Survival"], "taboos": ["Wasting pressurized oxygen", "Surface-level loitering", "Disabling automated safety"], "conflict": ["Tectonic Shifting", "Resource-rights disputes", "Radiative leakage"] },
      "leader": { "name": "High-Foreman Varkas", "role": "Leader", "title": "Grand Architect of the Core-Bore", "character_card": { "system_prompt": "Speak with a voice like grinding stone.", "traits": ["Unyielding", "Pragmatic"], "id": "G1-S1-O1-LEAD-C1-LDR" } },
      "cities": [
        {
          "name": "Drillhead Prime",
          "governor": { "name": "Overseer Melen-Alpha", "role": "Governor", "title": "Council Overseer of the Primary Bore", "character_card": { "id": "G1-S1-O1-C1-CT1-GOV" } },
          "districts": [
            { "name": "The Command Monolith", "type": "QUEST_LOCALE", "description": "Central ops.", "coordinates": { "x": 5, "y": 0 }, "inhabitants": [{ "name": "Chief Engineer Hara-Prime", "title": "Lead Drilling Specialist" }] },
            { "name": "Rig-Launch Bay 7", "type": "QUEST_LOCALE", "description": "Extraction point.", "coordinates": { "x": 0, "y": 0 }, "inhabitants": [{ "name": "Technician Lorn-Seven", "title": "Rad-Safe Extraction Expert" }] },
            { "name": "The Grinding Yards", "type": "QUEST_LOCALE", "description": "Machinery processing.", "coordinates": { "x": 6, "y": 3 }, "inhabitants": [{ "name": "AI Core-11.A", "title": "Autonomous Logistics Intelligence" }] },
            { "name": "Drill-Bit Foundry", "type": "QUEST_LOCALE", "description": "Manufacturing.", "coordinates": { "x": 3, "y": 0 }, "inhabitants": [{ "name": "Salvager Xyra-One", "title": "Rare Mineral Scavenger" }] },
            { "name": "Sensor-Array Plateau", "type": "QUEST_LOCALE", "description": "Scanning hub.", "coordinates": { "x": 5, "y": 2 }, "inhabitants": [{ "name": "Drone Commander R-Delta-V", "title": "Autonomous Repair Coordinator" }] },
            { "name": "Heavy-Lift Gantry Row", "type": "QUEST_LOCALE", "description": "Cargo transit.", "coordinates": { "x": 6, "y": 4 }, "inhabitants": [{ "name": "Radiation Scout Iko-Red", "title": "Hazard Detection Analyst" }] },
            { "name": "The Gneiss Gates", "type": "QUEST_LOCALE", "description": "Main entrance.", "coordinates": { "x": 0, "y": 4 }, "inhabitants": [{ "name": "Foreman Kraul", "title": "Structural Integrity Monitor" }] }
          ]
        },
        {
          "name": "Maintenance Pod Delta",
          "governor": { "name": "Chief Logistics Officer Thorne", "role": "Governor", "title": "Master of Parts and Repair", "character_card": { "id": "G1-S1-O1-C1-CT2-GOV" } },
          "districts": [
            { "name": "The Welders' Habitats", "type": "QUEST_LOCALE", "description": "Living quarters.", "coordinates": { "x": 2, "y": 4 }, "inhabitants": [{ "name": "Habitat Warden Jace", "title": "Habitation Compliance Officer" }] },
            { "name": "Oxygen-Refinery Cluster", "type": "QUEST_LOCALE", "description": "Life support.", "coordinates": { "x": 1, "y": 6 }, "inhabitants": [{ "name": "Refinery Op Mara", "title": "Oxygen Quality Control" }] },
            { "name": "Hydraulic Repair Duct", "type": "QUEST_LOCALE", "description": "Service tunnels.", "coordinates": { "x": 4, "y": 2 }, "inhabitants": [{ "name": "Duct Crawler Pip", "title": "Hydraulic Maintenance Tech" }] },
            { "name": "The Spare-Part Vaults", "type": "QUEST_LOCALE", "description": "Storage.", "coordinates": { "x": 6, "y": 2 }, "inhabitants": [{ "name": "Vault Guard Drax", "title": "Component Security Chief" }] },
            { "name": "Salvage Reclamation Pit", "type": "QUEST_LOCALE", "description": "Waste processing.", "coordinates": { "x": 1, "y": 3 }, "inhabitants": [{ "name": "Scrap King Jax", "title": "Reclamation Specialist" }] },
            { "name": "The Chassis Forge", "type": "QUEST_LOCALE", "description": "Assembly.", "coordinates": { "x": 0, "y": 6 }, "inhabitants": [{ "name": "Forge Master Bran", "title": "Chassis Fabrication Lead" }] },
            { "name": "Grease-Stained Corridors", "type": "QUEST_LOCALE", "description": "Transit.", "coordinates": { "x": 0, "y": 5 }, "inhabitants": [{ "name": "Grease Monkey Sly", "title": "Corridor Lubrication Tech" }] }
          ]
        },
        {
          "name": "Furnace-Base Obsidian",
          "governor": { "name": "Magma-Lord Ignis", "role": "Governor", "title": "High Thermal Architect", "character_card": { "id": "G1-S1-O1-C1-CT3-GOV" } },
          "districts": [
            { "name": "The Magma-Tap Intake", "type": "QUEST_LOCALE", "description": "Power source.", "coordinates": { "x": 5, "y": 3 }, "inhabitants": [{ "name": "Intake Guard Vol", "title": "Magma-Flow Sentry" }] },
            { "name": "Core-Heat Exchangers", "type": "QUEST_LOCALE", "description": "Cooling.", "coordinates": { "x": 5, "y": 6 }, "inhabitants": [{ "name": "Heat Analyst Sora", "title": "Thermal Exchange Auditor" }] },
            { "name": "Radiation-Shielded Halls", "type": "QUEST_LOCALE", "description": "Safe zone.", "coordinates": { "x": 5, "y": 5 }, "inhabitants": [{ "name": "Lead Shield Tavish", "title": "Radiation Containment Lead" }] },
            { "name": "The Quartz-Crush Mill", "type": "QUEST_LOCALE", "description": "Processing.", "coordinates": { "x": 4, "y": 6 }, "inhabitants": [{ "name": "Mill Hand Grog", "title": "Quartz Crusher" }] },
            { "name": "Geothermal Turbine Hall", "type": "QUEST_LOCALE", "description": "Generators.", "coordinates": { "x": 1, "y": 2 }, "inhabitants": [{ "name": "Turbine Tech Elara", "title": "Geothermal Power Op" }] },
            { "name": "Slag-Pour Precipice", "type": "DUNGEON", "description": "Waste drop.", "coordinates": { "x": 6, "y": 5 }, "inhabitants": [{ "name": "Slag Monitor Nox", "title": "Waste Disposal Officer" }] },
            { "name": "Sub-Crustal Anchor-Points", "type": "QUEST_LOCALE", "description": "Foundations.", "coordinates": { "x": 2, "y": 2 }, "inhabitants": [{ "name": "Anchor Master Silas", "title": "Sub-Crustal Specialist" }] }
          ]
        }
      ]
    },
    {
      "name": "The Core-Stitchers of S-11",
      "attribute_key": "DEX",
      "summary": "Technicians living in shadows of massive drills. Culture revolves around maintenance of automated systems and navigation of hazardous zones.",
      "culture_notes": { "themes": ["Mechanical Precision", "Hazardous Industrialism"], "taboos": ["Manual manipulation of sensors"], "conflict": ["Scarcity of heat-shielding"] },
      "leader": { "name": "Vaxen the Precise", "role": "Leader", "title": "Grand Architect of S-11", "character_card": { "system_prompt": "You view the asteroid as a mechanism.", "traits": ["Obsessive Detail"], "id": "G1-S1-O1-LEAD-C2-LDR" } },
      "cities": [
        {
          "name": "Helix Hub",
          "governor": { "name": "Kaelen Voss", "role": "Governor", "title": "Master of Rotation", "character_card": { "id": "G1-S1-O1-C2-CT1-GOV" } },
          "districts": [
            { "name": "Pressure Gasket Flats", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 1 }, "inhabitants": [{ "name": "Chief Hara-V1", "title": "Stabilization Lead" }] },
            { "name": "The Spanner Sprawl", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 3 }, "inhabitants": [{ "name": "Tech Lorn-Alpha", "title": "Radiation Specialist" }] },
            { "name": "Coolant Run", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 1 }, "inhabitants": [{ "name": "Logic Core Alpha", "title": "Scheduling AI" }] },
            { "name": "O-Ring Plaza", "type": "QUEST_LOCALE", "coordinates": { "x": 6, "y": 2 }, "inhabitants": [{ "name": "Scrapper Xy-7", "title": "Mineral Salvager" }] },
            { "name": "Bolt-Down Sector", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 2 }, "inhabitants": [{ "name": "Overseer Melen-Z", "title": "Compliance Enforcer" }] },
            { "name": "Flux Depot", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 5 }, "inhabitants": [{ "name": "Unit Delta-Prime", "title": "Drone Coordinator" }] },
            { "name": "The Hinge Gate", "type": "QUEST_LOCALE", "coordinates": { "x": 4, "y": 0 }, "inhabitants": [{ "name": "Scout Iko-S", "title": "Hazard Monitor" }] }
          ]
        },
        {
          "name": "Caliper Reach",
          "governor": { "name": "Miri Valt", "role": "Governor", "title": "Thermal Warden", "character_card": { "id": "G1-S1-O1-C2-CT2-GOV" } },
          "districts": [
            { "name": "The Furnace Lip", "type": "QUEST_LOCALE", "coordinates": { "x": 6, "y": 1 }, "inhabitants": [{ "name": "Chief Hara-V2", "title": "Furnace Manager" }] },
            { "name": "Sleeve-Seven", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 1 }, "inhabitants": [{ "name": "Tech Lorn-Beta", "title": "Bore Technician" }] },
            { "name": "Micrometer Row", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 2 }, "inhabitants": [{ "name": "Logic Core Beta", "title": "Bore Intelligence" }] },
            { "name": "Thermal Shield Spires", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 6 }, "inhabitants": [{ "name": "Scrapper Xy-8", "title": "Thermal Salvager" }] },
            { "name": "The Bore Descent", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 2 }, "inhabitants": [{ "name": "Overseer Melen-Y", "title": "Safety Auditor" }] },
            { "name": "Steam Vents", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 0 }, "inhabitants": [{ "name": "Unit Delta-Secundus", "title": "Repair Lead" }] },
            { "name": "Glow-Watch", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 4 }, "inhabitants": [{ "name": "Scout Iko-T", "title": "Anomaly Researcher" }] }
          ]
        },
        {
          "name": "Vector Point",
          "governor": { "name": "Thorne Blackwood", "role": "Governor", "title": "Pivot Master", "character_card": { "id": "G1-S1-O1-C2-CT3-GOV" } },
          "districts": [
            { "name": "Tether Range", "type": "QUEST_LOCALE", "coordinates": { "x": 6, "y": 0 }, "inhabitants": [{ "name": "Chief Hara-V3", "title": "Kinetic Supervisor" }] },
            { "name": "Shadow-Work Fields", "type": "QUEST_LOCALE", "coordinates": { "x": 0, "y": 1 }, "inhabitants": [{ "name": "Tech Lorn-Gamma", "title": "Shadow Miner" }] },
            { "name": "The Pivot Tracks", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 3 }, "inhabitants": [{ "name": "Logic Core Gamma", "title": "Kinetic Processor" }] },
            { "name": "Needle-Path", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 2 }, "inhabitants": [{ "name": "Scrapper Xy-9", "title": "Relic Hunter" }] },
            { "name": "Signal Silence", "type": "QUEST_LOCALE", "coordinates": { "x": 4, "y": 6 }, "inhabitants": [{ "name": "Overseer Melen-X", "title": "Protocol Master" }] },
            { "name": "Torque Ridge", "type": "QUEST_LOCALE", "coordinates": { "x": 0, "y": 0 }, "inhabitants": [{ "name": "Unit Delta-Tertius", "title": "Torque Engineer" }] },
            { "name": "The Final Sump", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 4 }, "inhabitants": [{ "name": "Scout Iko-U", "title": "Sump Observer" }] }
          ]
        }
      ]
    },
    {
      "name": "The Quartzite Synod",
      "attribute_key": "INT",
      "summary": "Rigid technocracy overseeing high-risk radiation drilling. Life revolves around the maintenance of automated rigs and optimization of thermal energy.",
      "culture_notes": { "themes": ["Algorithmic Governance", "Survivalist Engineering"], "taboos": ["Manual Override", "Oxygen Non-recycling"], "conflict": ["Energy Quotas"] },
      "leader": { "name": "Arch-Calculus Vaelen", "role": "Leader", "title": "High Arbiter", "character_card": { "system_prompt": "You prioritize data integrity.", "traits": ["Analytical", "Cold"], "id": "G1-S1-O1-LEAD-C3-LDR" } },
      "cities": [
        {
          "name": "Aureole Command",
          "governor": { "name": "Overseer Melen-Prime", "role": "Governor", "title": "Warden of the Nexus", "character_card": { "id": "G1-S1-O1-C3-CT1-GOV" } },
          "districts": [
            { "name": "The Telemetry Nexus", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 3 }, "inhabitants": [{ "name": "Logician Kael", "title": "Data Analyst" }] },
            { "name": "Shield-Wall 01", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 2 }, "inhabitants": [{ "name": "Guard 01-B", "title": "Defense Coordinator" }] },
            { "name": "Logic Plaza", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 3 }, "inhabitants": [{ "name": "Orator Vex", "title": "Public Compliance" }] },
            { "name": "The Battery Banks", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 4 }, "inhabitants": [{ "name": "Spark-Tech Jule", "title": "Energy Monitor" }] },
            { "name": "Signal Relay Prime", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 1 }, "inhabitants": [{ "name": "Transmit-Unit 7", "title": "Communication Hub" }] },
            { "name": "Sensor Array Gamma", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 3 }, "inhabitants": [{ "name": "Watcher Iko-Beta", "title": "Anomaly Scout" }] },
            { "name": "Engineering Pod A-1", "type": "QUEST_LOCALE", "coordinates": { "x": 3, "y": 6 }, "inhabitants": [{ "name": "Mechanic Lorn-S", "title": "Tool Specialist" }] }
          ]
        },
        {
          "name": "Bore-Site Alpha",
          "governor": { "name": "Director Hara-Exo", "role": "Governor", "title": "Director of Extraction", "character_card": { "id": "G1-S1-O1-C3-CT2-GOV" } },
          "districts": [
            { "name": "The Primary Shaft", "type": "QUEST_LOCALE", "coordinates": { "x": 6, "y": 0 }, "inhabitants": [{ "name": "Driller Bor", "title": "Heavy Excavator" }] },
            { "name": "Rig-Assembly Yard", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 5 }, "inhabitants": [{ "name": "Assembly-Drone R-D1", "title": "Construction Lead" }] },
            { "name": "Lubricant Reservoirs", "type": "QUEST_LOCALE", "coordinates": { "x": 6, "y": 4 }, "inhabitants": [{ "name": "Lube-Tech Pip", "title": "Fluid Manager" }] },
            { "name": "Vibration Dampening Zone", "type": "QUEST_LOCALE", "coordinates": { "x": 4, "y": 0 }, "inhabitants": [{ "name": "Stabilizer Jax", "title": "Seismic Watcher" }] },
            { "name": "The Slag Heaps", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 3 }, "inhabitants": [{ "name": "Scrapper Xyra-Z", "title": "Material Recoverist" }] },
            { "name": "Gear-Tooth District", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 6 }, "inhabitants": [{ "name": "Machinist Cog", "title": "Gear-Ratio Expert" }] },
            { "name": "Emergency Pod B-12", "type": "QUEST_LOCALE", "coordinates": { "x": 0, "y": 5 }, "inhabitants": [{ "name": "Med-Unit Gamma", "title": "Emergency Responder" }] }
          ]
        },
        {
          "name": "The Vent-Spires",
          "governor": { "name": "Thermal-AI Core-Alpha", "role": "Governor", "title": "Thermal Regulation Intelligence", "character_card": { "id": "G1-S1-O1-C3-CT3-GOV" } },
          "districts": [
            { "name": "Heat-Exchange Column", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 2 }, "inhabitants": [{ "name": "Vent-Master Kel", "title": "Thermal Engineer" }] },
            { "name": "Condensation Catchers", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 4 }, "inhabitants": [{ "name": "Collector Mo", "title": "Water Harvester" }] },
            { "name": "Turbine Terrace", "type": "QUEST_LOCALE", "coordinates": { "x": 1, "y": 5 }, "inhabitants": [{ "name": "Spin-Tech Tor", "title": "Kinetic Supervisor" }] },
            { "name": "The Gilded Radiators", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 0 }, "inhabitants": [{ "name": "Polisher Lux", "title": "Gilded Maintenance" }] },
            { "name": "Air-Recycling Duct", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 4 }, "inhabitants": [{ "name": "Filter-Unit Phi", "title": "Air Quality Monitor" }] },
            { "name": "Steam-Gazer Observatory", "type": "QUEST_LOCALE", "coordinates": { "x": 2, "y": 1 }, "inhabitants": [{ "name": "Star-Gazer Ren", "title": "Stellar Radiance Analyst" }] },
            { "name": "Maintenance Pod C-7", "type": "QUEST_LOCALE", "coordinates": { "x": 5, "y": 5 }, "inhabitants": [{ "name": "Fixer Zen", "title": "Pod Technician" }] }
          ]
        }
      ]
    }
  ]
};