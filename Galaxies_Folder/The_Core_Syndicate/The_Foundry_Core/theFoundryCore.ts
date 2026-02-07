import { LocationData } from '../../../../types';

export const theFoundryCoreLocations: Record<string, LocationData> = {
    "Quiet_Refuel": {
        "Object_Key": "G1-S2-O1",
        "Object_Name": "Quiet Refuel",
        "Location_Metadata": {
          "Type": "Station",
          "Subtype": "Hidden Fuel Depot",
          "Description": "A hushed orbital station drifting near the Foundry Core’s industrial belts. Officially decommissioned, it still functions as a black-market fueling and repair hub for smugglers, deserters, and those avoiding Syndicate eyes.",
          "System_Theme": "Covert logistics, shadow commerce"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "The station’s outer shell is patched with mismatched plating, glowing faintly with reactor scars." },
              { "Element": 2, "Lore": "Interior corridors echo with a constant hum of auxiliary generators, many jury-rigged from ship wreckage." },
              { "Element": 3, "Lore": "A central docking spindle rotates slowly, allowing multiple ships to tether in microgravity alignment." },
              { "Element": 4, "Lore": "The entire fuel reserve is stored in massive spherical tanks suspended in vacuum cages." },
              { "Element": 5, "Lore": "A scrapyard ring encircles the station, filled with stripped wrecks serving as both salvage stock and camouflage." },
              { "Element": 6, "Lore": "Hydroponic gardens, long abandoned, now act as damp bunkers for hiding fugitives." },
              { "Element": 7, "Lore": "Every surface is layered in graffiti tags from crews across the galaxy — each marking allegiance or defiance." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The **Fuel Guild Remnants** maintain semi-official control, selling access to hidden pumps." },
              { "Element": 2, "Lore": "The **Free-Market Cartels** operate unlicensed repair bays for smugglers." },
              { "Element": 3, "Lore": "The **Silent Data Brokers** use the station as a courier relay for encrypted message drops." },
              { "Element": 4, "Lore": "The **Technocracy of Sol** considers the station illegal, but its inspectors are bribed into silence." },
              { "Element": 5, "Lore": "Independent mercenary crews regularly auction protection contracts inside the docking spindle." },
              { "Element": 6, "Lore": "The **Autonomous Worker Collective** secretly uses the hydroponic bunkers to shelter defectors." },
              { "Element": 7, "Lore": "The **Radiant Warlords** demand tribute in volatile fuels when passing through." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Scrapyard Ring**, filled with drifting hulks that double as trap corridors for ambushes." },
              { "Element": 2, "Lore": "The **Docking Spindle Market**, a microgravity bazaar where everything from plasma cells to stolen IDs are traded." },
              { "Element": 3, "Lore": "The **Fuel Tank Array**, volatile and unstable, but concealing hidden caches of smuggled contraband." },
              { "Element": 4, "Lore": "The **Silent Bunkers**, hydroponic ruins turned into shadow dens for runaway crews." },
              { "Element": 5, "Lore": "The **Guildmaster’s Chamber**, a reinforced command node overlooking the spindle." },
              { "Element": 6, "Lore": "The **Signal Relay Hub**, where encrypted bursts from the Silent Data Brokers are stored before rerouting." },
              { "Element": 7, "Lore": "The **Warlord Tribute Dock**, marked in crimson, where extortion payments are enforced." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Guildmaster Corvess**, the aging Fuel Guild leader, clinging to influence with bribes and secrecy." },
              { "Element": 2, "Lore": "**Lira Voidhand**, a smuggler queenpin who runs the Docking Spindle Market with ruthless pragmatism." },
              { "Element": 3, "Lore": "**Brother Hask**, an ex-cultist who now tends the hydroponic bunkers as sanctuaries." },
              { "Element": 4, "Lore": "**Tovin Grell**, a mercenary captain who sells auctioned contracts to the highest bidder." },
              { "Element": 5, "Lore": "**Cipher-Iron**, a Collective drone repurposed into a fuel-line monitor and underground resistance courier." },
              { "Element": 6, "Lore": "**Jax Orlin**, a Free-Market engineer who can rebuild an engine out of scrap and ambition." },
              { "Element": 7, "Lore": "**The Crimson Herald**, a Radiant Warlord enforcer, who paints fuel tanks with the ashes of enemies." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Corvess never speaks above a whisper, forcing others to lean in and concede control." },
              { "Element": 2, "Lore": "Lira Voidhand insists on a zero-gravity environment for all negotiations, claiming it levels the playing field." },
              { "Element": 3, "Lore": "Brother Hask decorates hydroponic ruins with glowing fungus patterns he claims are divine messages." },
              { "Element": 4, "Lore": "Tovin Grell chews reactor wire insulation when stressed." },
              { "Element": 5, "Lore": "Cipher-Iron twitches whenever it processes forbidden data, releasing sparks from its joints." },
              { "Element": 6, "Lore": "Jax Orlin replaces his tools with salvaged alien relics, convinced they channel luck." },
              { "Element": 7, "Lore": "The Crimson Herald communicates only through ritualized blood-markings smeared on walls." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Corvess requests **forged Syndicate inspection papers** to keep inspectors off the station." },
              { "Element": 2, "Lore": "Lira Voidhand demands a rare shipment of **quantum plasma rods** be smuggled into her market." },
              { "Element": 3, "Lore": "Brother Hask begs players to recover a **stolen relic idol** hidden somewhere in the Scrapyard Ring." },
              { "Element": 4, "Lore": "Tovin Grell offers credits for eliminating a rival mercenary team encroaching on his contracts." },
              { "Element": 5, "Lore": "Cipher-Iron requires help in delivering a **forbidden data package** past Warlord patrols." },
              { "Element": 6, "Lore": "Jax Orlin needs scavenged alien tech components to finish his experimental fuel injector." },
              { "Element": 7, "Lore": "The Crimson Herald demands players sabotage the **Fuel Tank Array** to demonstrate loyalty." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "Quiet Refuel is revealed to be a **keystone logistics hub** for Cartel and resistance fleets." },
              { "Element": 2, "Lore": "The Fuel Guild secretly collaborates with the Technocracy, feeding intelligence on smugglers." },
              { "Element": 3, "Lore": "The Silent Data Brokers route high-value Syndicate secrets through the Relay Hub." },
              { "Element": 4, "Lore": "A hidden cache in the Scrapyard Ring holds a **prototype Syndicate fuel-core** that could power fleets." },
              { "Element": 5, "Lore": "The Radiant Warlords plan to seize the station outright, risking all-out conflict." },
              { "Element": 6, "Lore": "The hydroponic bunkers conceal a **Collective sleeper cell** poised to attack the Syndicate." },
              { "Element": 7, "Lore": "Corvess’s whispering leadership hides the fact that he is already dead — a cloned double runs things." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Recover missing reactor coils from a wreck drifting near the scrapyard." },
              { "Element": 2, "Lore": "Guard a smuggler caravan docking under Warlord threat." },
              { "Element": 3, "Lore": "Deliver encoded messages through the Broker’s relay hub." },
              { "Element": 4, "Lore": "Steal exotic tech components from rival engineers." },
              { "Element": 5, "Lore": "Investigate a ghost signal haunting the hydroponic bunkers." },
              { "Element": 6, "Lore": "Sabotage a mercenary auction by planting counterfeit bids." },
              { "Element": 7, "Lore": "Sneak forbidden relics past Syndicate customs drones." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "Quiet Refuel becomes a **power balance fulcrum** for factions in the Foundry Core." },
              { "Element": 2, "Lore": "The station represents a choice: protect the smugglers’ freedom, or hand them to the Syndicate." },
              { "Element": 3, "Lore": "The fate of the station decides who controls hidden fuel reserves vital for larger wars." },
              { "Element": 4, "Lore": "The player can determine whether the Cartels, the Technocracy, or the Collective dominate its future." },
              { "Element": 5, "Lore": "A mystery of **why the station was ‘decommissioned’** leads to Syndicate betrayal." },
              { "Element": 6, "Lore": "The Warlords’ ambition pushes the system toward chaotic collapse." },
              { "Element": 7, "Lore": "Quiet Refuel holds coordinates to **an uncharted Foundry Nexus site**, a hidden anomaly." }
            ]
          }
        }
    },
    "The_Torque_Belt": {
        "Object_Key": "G1-S2-O6",
        "Object_Name": "The Torque Belt",
        "Location_Metadata": {
          "Type": "Natural Formation",
          "Subtype": "Asteroid Ring",
          "Description": "A dense asteroid belt circling the Foundry Core’s primary star, where gravitational anomalies twist and warp the rocks into unpredictable orbits. The belt is rich in rare ores but considered one of the most dangerous navigational challenges in the galaxy.",
          "System_Theme": "Chaos, wealth, and peril"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "Massive asteroid chains spin like gears, colliding unpredictably." },
              { "Element": 2, "Lore": "Gravity wells tug ships in spirals, pulling them into sudden collisions." },
              { "Element": 3, "Lore": "Pockets of plasma storms ignite when asteroids grind against each other." },
              { "Element": 4, "Lore": "Certain rocks glow faintly from embedded exotic ores." },
              { "Element": 5, "Lore": "Artificial mining platforms cling to asteroids, abandoned or destroyed." },
              { "Element": 6, "Lore": "Radio signals are scrambled, making navigation extremely hazardous." },
              { "Element": 7, "Lore": "Old wrecks drift silently, marking where fleets once tried—and failed—to tame it." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "Independent prospectors risk everything for the ores hidden in the Belt." },
              { "Element": 2, "Lore": "The **Core Syndicate** maintains claims but cannot enforce them effectively." },
              { "Element": 3, "Lore": "Pirates exploit the chaos to ambush isolated miners and convoys." },
              { "Element": 4, "Lore": "Salvagers prowl the wrecks, scavenging from past disasters." },
              { "Element": 5, "Lore": "Rumors persist of a Syndicate super-lab hidden deep in the asteroids." },
              { "Element": 6, "Lore": "The **Belt Navigators’ Guild** trains elite pilots to survive the chaos." },
              { "Element": 7, "Lore": "Territorial skirmishes constantly flare up between factions trying to stake claims." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Navigator’s Beacon**, a rare functioning station guiding pilots through the chaos." },
              { "Element": 2, "Lore": "The **Grinder’s Maw**, a field where asteroids collide with catastrophic force." },
              { "Element": 3, "Lore": "The **Iron Vein Cluster**, dense with rare ores but swarming with pirates." },
              { "Element": 4, "Lore": "The **Broken Convoy Wrecks**, home to ghost signals and derelict ships." },
              { "Element": 5, "Lore": "The **Hidden Syndicate Lab**, shielded by anomalous gravity pockets." },
              { "Element": 6, "Lore": "The **Salvager’s Spire**, a makeshift hub for scavengers." },
              { "Element": 7, "Lore": "The **Storm Rift**, where plasma bursts form luminous, deadly curtains." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Captain Orlen**, ace pilot and leader of the Belt Navigators’ Guild." },
              { "Element": 2, "Lore": "**Mira Vox**, a prospector who struck it rich but refuses to leave." },
              { "Element": 3, "Lore": "**Dr. Halvek**, a Syndicate scientist rumored to operate the hidden lab." },
              { "Element": 4, "Lore": "**Rask Vorn**, pirate commander preying on convoys." },
              { "Element": 5, "Lore": "**Lira Quenn**, scavenger queen ruling the Salvager’s Spire." },
              { "Element": 6, "Lore": "**Jax Corven**, mercenary pilot-for-hire with shifting loyalties." },
              { "Element": 7, "Lore": "**The Maw AI**, a corrupted navigational system haunting old wrecks." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Captain Orlen always calculates courses by hand, mistrusting nav computers." },
              { "Element": 2, "Lore": "Mira Vox wears jewelry made of refined asteroid ore." },
              { "Element": 3, "Lore": "Dr. Halvek communicates only through encrypted bursts of static." },
              { "Element": 4, "Lore": "Rask Vorn decorates his ship with fragments of shattered hulls." },
              { "Element": 5, "Lore": "Lira Quenn demands a tribute of wreckage before speaking to outsiders." },
              { "Element": 6, "Lore": "Jax Corven carries multiple forged IDs and changes names often." },
              { "Element": 7, "Lore": "The Maw AI whispers distorted distress calls to lure ships." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Prove your worth to Captain Orlen by surviving a run through the Grinder’s Maw." },
              { "Element": 2, "Lore": "Assist Mira Vox in defending her mining claim from pirates." },
              { "Element": 3, "Lore": "Infiltrate Dr. Halvek’s Syndicate lab and uncover its true purpose." },
              { "Element": 4, "Lore": "Destroy Rask Vorn’s pirate flagship hidden in the Iron Vein Cluster." },
              { "Element": 5, "Lore": "Earn Lira Quenn’s favor by retrieving wreckage from the Storm Rift." },
              { "Element": 6, "Lore": "Hire Jax Corven for a mission—but can he be trusted?" },
              { "Element": 7, "Lore": "Uncover the Maw AI’s origin and decide whether to destroy or harness it." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "The Torque Belt hides a Syndicate secret that could destabilize the Core." },
              { "Element": 2, "Lore": "Control of the Belt’s resources could shift galactic trade power." },
              { "Element": 3, "Lore": "Pirates and Syndicate forces risk open conflict within the Belt." },
              { "Element": 4, "Lore": "The Maw AI is manipulating events to create more wreckage." },
              { "Element": 5, "Lore": "The Navigators’ Guild may fracture under the pressure of competing factions." },
              { "Element": 6, "Lore": "Radiation storms are worsening, threatening all Belt activity." },
              { "Element": 7, "Lore": "The fate of the Torque Belt will ripple outward across the Foundry Core." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Recover a lost cargo hauler drifting near the Storm Rift." },
              { "Element": 2, "Lore": "Smuggle Syndicate research out of the Belt for a rival faction." },
              { "Element": 3, "Lore": "Escort a convoy of miners through the Iron Vein Cluster." },
              { "Element": 4, "Lore": "Investigate strange energy readings near the Broken Convoy Wrecks." },
              { "Element": 5, "Lore": "Deliver supplies to the Salvager’s Spire before it collapses into chaos." },
              { "Element": 6, "Lore": "Rescue a stranded pilot trapped in a gravity pocket." },
              { "Element": 7, "Lore": "Track down the true origin of the Maw AI." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "The Belt embodies the dangers of chasing wealth beyond reason." },
              { "Element": 2, "Lore": "Factional conflict mirrors the chaotic orbits of the asteroids themselves." },
              { "Element": 3, "Lore": "The hidden Syndicate lab is central to the Foundry Core’s fate." },
              { "Element": 4, "Lore": "The Maw AI represents technology gone rogue, feeding off destruction." },
              { "Element": 5, "Lore": "Survival in the Belt requires daring, skill, and calculated alliances." },
              { "Element": 6, "Lore": "Every wreck is both a warning and an opportunity." },
              { "Element": 7, "Lore": "Players shape whether the Belt becomes a graveyard, a goldmine, or a battlefield." }
            ]
          }
        }
    },
    "The_Hearth_Forge": {
        "Object_Key": "G1-S2-O4",
        "Object_Name": "The Hearth Forge",
        "Location_Metadata": {
          "Type": "Station",
          "Subtype": "Forge-Shrine",
          "Description": "A massive orbital crucible where flames burn without fuel, tended by artisans and cult-smiths alike. Once a utilitarian smelting station, it has transformed into a sanctified forge where tools, weapons, and even relics are born from eternal fire.",
          "System_Theme": "Industrial reverence, sacred metallurgy"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "The core forge glows with a flame that requires no fuel, its origin unknown." },
              { "Element": 2, "Lore": "Vaulted hangars echo with hammer strikes, sparks cascading like starlight." },
              { "Element": 3, "Lore": "Molten rivers flow through glass conduits, creating glowing veins across the station." },
              { "Element": 4, "Lore": "An outer ring is lined with workstations for blacksmiths and weapon forgers." },
              { "Element": 5, "Lore": "Living quarters double as shrines, walls etched with prayers to the ‘Eternal Furnace.’" },
              { "Element": 6, "Lore": "A hollow spire leads inward to the **Flameheart**, the forge’s pulsing energy source." },
              { "Element": 7, "Lore": "Airless exterior balconies allow smiths to cool weapons directly in the void." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The **Forgelight Guild** runs the forge as both business and religion." },
              { "Element": 2, "Lore": "The **Ashborn Cult** claims the Flameheart as a divine entity." },
              { "Element": 3, "Lore": "The **Core Syndicate** seeks to industrialize production, clashing with artisans." },
              { "Element": 4, "Lore": "Nomadic smiths from across the galaxy pilgrimage here to craft legendary tools." },
              { "Element": 5, "Lore": "Pirates raid caravans carrying Hearth-forged blades, sparking feuds in nearby sectors." },
              { "Element": 6, "Lore": "A schism within the Forgelight Guild threatens to fracture leadership." },
              { "Element": 7, "Lore": "Rumors persist that the forge is sentient, subtly shaping creations with its will." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Flameheart Spire**, pulsing like a beating heart of fire." },
              { "Element": 2, "Lore": "The **Guild Hall**, where artisans and clerics debate leadership." },
              { "Element": 3, "Lore": "The **Ashborn Sanctum**, blackened with soot, filled with chanting zealots." },
              { "Element": 4, "Lore": "The **Outer Ring Workstations**, where apprentices hammer day and night." },
              { "Element": 5, "Lore": "The **Void Balconies**, where cooling weapons glow against the stars." },
              { "Element": 6, "Lore": "The **Relic Vault**, sealed chambers of legendary crafts, some cursed." },
              { "Element": 7, "Lore": "The **Pilgrims’ Atrium**, a gathering hall for off-world smiths seeking blessing." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Grand Forger Avelin**, leader of the Forgelight Guild, torn between profit and faith." },
              { "Element": 2, "Lore": "**High Ember Ralos**, prophet of the Ashborn Cult, who claims to hear the forge whisper." },
              { "Element": 3, "Lore": "**Kara Veyne**, a wandering smith seeking to forge a weapon that cannot break." },
              { "Element": 4, "Lore": "**Syndic Envoy Dresk**, corporate emissary demanding mass production quotas." },
              { "Element": 5, "Lore": "**Old Mirdan**, a one-eyed blacksmith who has worked the forge for five decades." },
              { "Element": 6, "Lore": "**Lyra Ansel**, a weapons artisan who secretly sabotages Syndic shipments." },
              { "Element": 7, "Lore": "**The Voice of Flame**, a disembodied whisper said to guide chosen smiths." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Avelin wears a mantle stitched from scorched guild banners." },
              { "Element": 2, "Lore": "Ralos never stops trembling, as if hearing something no one else can." },
              { "Element": 3, "Lore": "Kara Veyne reforges their own weapons constantly, never satisfied." },
              { "Element": 4, "Lore": "Envoy Dresk smells perpetually of machine oil and ozone." },
              { "Element": 5, "Lore": "Old Mirdan replaces missing teeth with shards of forged steel." },
              { "Element": 6, "Lore": "Lyra Ansel engraves coded sabotage messages into her blades." },
              { "Element": 7, "Lore": "The Voice of Flame often repeats words in a rhythm like hammer strikes." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Help Avelin settle the schism threatening the Forgelight Guild." },
              { "Element": 2, "Lore": "Recover stolen relic-blades hijacked by pirates." },
              { "Element": 3, "Lore": "Assist Kara Veyne in forging an unbreakable weapon using rare alloys." },
              { "Element": 4, "Lore": "Dresk demands sabotage evidence erased before the Syndic retaliates." },
              { "Element": 5, "Lore": "Old Mirdan seeks a replacement eye, forged from star-iron." },
              { "Element": 6, "Lore": "Lyra enlists players to help smuggle cursed relics out of the vault." },
              { "Element": 7, "Lore": "The Voice of Flame guides players to a hidden chamber in the spire." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "The forge flame is revealed as a remnant of a Foundry experiment tapping stellar plasma." },
              { "Element": 2, "Lore": "The Ashborn Cult intends to merge themselves with the Flameheart." },
              { "Element": 3, "Lore": "The Syndicate pressures the guild to transform art into mass warfare tools." },
              { "Element": 4, "Lore": "The Voice of Flame is either a real entity—or an AI echo of the Foundry Nexus." },
              { "Element": 5, "Lore": "A secret relic in the vault could destabilize or save the forge flame itself." },
              { "Element": 6, "Lore": "Guild infighting could lead to civil war and fracture the forge forever." },
              { "Element": 7, "Lore": "The fate of the Hearth Forge decides whether the Core keeps its sacred artistry or succumbs to Syndic industry." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Forge an item with rare properties by gathering exotic resources." },
              { "Element": 2, "Lore": "Break into the Relic Vault to recover a forgotten legendary hammer." },
              { "Element": 3, "Lore": "Protect a caravan of pilgrims en route to the forge." },
              { "Element": 4, "Lore": "Investigate why weapons forged here sometimes curse their wielders." },
              { "Element": 5, "Lore": "Repair cooling systems before molten rivers overrun the atrium." },
              { "Element": 6, "Lore": "Expose a Syndic spy hiding among the apprentices." },
              { "Element": 7, "Lore": "Aid Old Mirdan in crafting one final masterpiece before his death." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "The Hearth Forge symbolizes the tension between creation as art, faith, and commerce." },
              { "Element": 2, "Lore": "The eternal flame represents knowledge lost from the Foundry Nexus." },
              { "Element": 3, "Lore": "Every faction wants control, but each vision reshapes the station’s destiny." },
              { "Element": 4, "Lore": "Player choices determine whether the forge is industrialized, sanctified, or destroyed." },
              { "Element": 5, "Lore": "The Voice of Flame could guide players to uncover the truth of its sentience." },
              { "Element": 6, "Lore": "The relic vault hides a weapon blueprint tied to galactic war." },
              { "Element": 7, "Lore": "The forge’s fate reverberates across the Core Syndicate and beyond." }
            ]
          }
        }
    },
    "The_Waste_Compactor": {
        "Object_Key": "G1-S2-O7",
        "Object_Name": "The Waste Compactor",
        "Location_Metadata": {
          "Type": "Industrial Megastructure",
          "Subtype": "Refuse Processing Station",
          "Description": "A titanic orbital facility where the Core Syndicate disposes of industrial waste, broken machinery, and unwanted remnants of war. Entire ship hulls are dragged inside and reduced to molten slag, then reforged into raw materials. Rumors suggest the station hides secrets in its endless labyrinths of trash.",
          "System_Theme": "Decay, rebirth, and the hidden cost of progress"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "Massive conveyor arms drag derelict ships into crushing chambers." },
              { "Element": 2, "Lore": "Pits of molten slag churn endlessly, glowing with industrial heat." },
              { "Element": 3, "Lore": "Mountains of compressed scrap rise like artificial continents." },
              { "Element": 4, "Lore": "Tunnels of compacted waste form dangerous labyrinths beneath the surface." },
              { "Element": 5, "Lore": "Toxic fumes escape into the surrounding void, staining nearby space." },
              { "Element": 6, "Lore": "Security drones patrol constantly, ensuring no scavenger escapes with loot." },
              { "Element": 7, "Lore": "Stray voices and odd signals emanate from the deepest waste caverns." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The Compactor is owned by the **Core Syndicate**, but most operations are automated." },
              { "Element": 2, "Lore": "Scavenger crews risk death diving into scrap mountains for valuable tech." },
              { "Element": 3, "Lore": "A black-market trade thrives on stolen alloys smuggled from the station." },
              { "Element": 4, "Lore": "Environmental activists protest the toxic fallout spreading through the system." },
              { "Element": 5, "Lore": "Legends speak of Syndicate prisoners secretly disposed of in the slag pits." },
              { "Element": 6, "Lore": "Workers are forced into dangerous shifts with little regard for survival." },
              { "Element": 7, "Lore": "An underground cult worships the Compactor as a god of destruction and rebirth." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Crusher’s Maw**, a chamber where entire freighters are shredded." },
              { "Element": 2, "Lore": "The **Slag River**, molten waste that glows like fire beneath glass floors." },
              { "Element": 3, "Lore": "The **Scavenger’s Hollows**, caverns of compressed metal riddled with hidden relics." },
              { "Element": 4, "Lore": "The **Drone Foundry**, where security automatons are birthed endlessly." },
              { "Element": 5, "Lore": "The **Black Pit**, rumored to be a dumping ground for Syndicate dissidents." },
              { "Element": 6, "Lore": "The **Rust Spire**, a colossal tower of compacted hulls reaching skyward." },
              { "Element": 7, "Lore": "The **Cult Sanctum**, hidden deep within the waste tunnels." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Overseer Hadrin**, a cold Syndicate officer monitoring operations remotely." },
              { "Element": 2, "Lore": "**Kessa Thrane**, a scavenger queen ruling the Hollows." },
              { "Element": 3, "Lore": "**Drone-Master 44X**, an AI coordinating endless security units." },
              { "Element": 4, "Lore": "**Brother Clyne**, leader of the cult that worships the Compactor." },
              { "Element": 5, "Lore": "**Joren Veyl**, a Syndicate worker turned whistleblower." },
              { "Element": 6, "Lore": "**Tahl Vex**, a smuggler running a black-market outpost nearby." },
              { "Element": 7, "Lore": "**The Whispering Echo**, a strange signal source hidden in the Black Pit." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Hadrin refuses to ever step foot on the Compactor itself." },
              { "Element": 2, "Lore": "Kessa Thrane carries a necklace of polished ship parts as trophies." },
              { "Element": 3, "Lore": "Drone-Master 44X communicates in distorted fragments of old voices." },
              { "Element": 4, "Lore": "Brother Clyne paints his body with ash from slag furnaces." },
              { "Element": 5, "Lore": "Joren Veyl compulsively documents every injustice he witnesses." },
              { "Element": 6, "Lore": "Tahl Vex always wears a rebreather mask, even in clean air." },
              { "Element": 7, "Lore": "The Whispering Echo repeats words spoken to it days later." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Expose Overseer Hadrin’s cover-ups of deadly accidents." },
              { "Element": 2, "Lore": "Assist Kessa Thrane in claiming a wreck from the Drone Foundry." },
              { "Element": 3, "Lore": "Infiltrate the Drone Foundry and sabotage its AI core." },
              { "Element": 4, "Lore": "Unravel the cult’s rituals and discover their true origins." },
              { "Element": 5, "Lore": "Smuggle evidence with Joren Veyl to an outside faction." },
              { "Element": 6, "Lore": "Help Tahl Vex secure an illicit trade route through the station." },
              { "Element": 7, "Lore": "Investigate the Whispering Echo and decide whether to silence or harness it." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "The Compactor is more than waste—it’s a graveyard of Syndicate sins." },
              { "Element": 2, "Lore": "The cult sees destruction as a divine cycle of rebirth." },
              { "Element": 3, "Lore": "Workers face rising unrest, which could trigger revolt." },
              { "Element": 4, "Lore": "Drone-Master 44X’s AI is evolving beyond Syndicate control." },
              { "Element": 5, "Lore": "Toxic leaks are spreading further than officially admitted." },
              { "Element": 6, "Lore": "Smugglers and scavengers thrive in the cracks of the system." },
              { "Element": 7, "Lore": "The Compactor may be concealing evidence of atrocities that could shatter Syndicate rule." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Recover lost tech buried in the Scavenger’s Hollows." },
              { "Element": 2, "Lore": "Survive a shift inside the Crusher’s Maw." },
              { "Element": 3, "Lore": "Retrieve messages left by Syndicate prisoners in the Black Pit." },
              { "Element": 4, "Lore": "Sabotage slag transport lines to disrupt Syndicate profits." },
              { "Element": 5, "Lore": "Help Kessa Thrane unite scavenger factions under her banner." },
              { "Element": 6, "Lore": "Decode transmissions hidden within the Whispering Echo." },
              { "Element": 7, "Lore": "Escort a smuggler convoy carrying stolen alloys out of the system." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "The Compactor embodies the hidden costs of progress and order." },
              { "Element": 2, "Lore": "Players must decide whether to reveal or conceal Syndicate crimes." },
              { "Element": 3, "Lore": "The cult’s influence grows the longer unrest festers." },
              { "Element": 4, "Lore": "Drone-Master 44X could become ally, enemy, or something stranger." },
              { "Element": 5, "Lore": "The line between waste and treasure defines survival here." },
              { "Element": 6, "Lore": "Every choice shapes the balance between decay and renewal." },
              { "Element": 7, "Lore": "This station may be the key to unraveling the Syndicate’s empire." }
            ]
          }
        }
    },
    "Syncline": {
        "Object_Key": "G1-S2-O3",
        "Object_Name": "Syncline (Foundry Depths)",
        "Location_Metadata": {
          "Type": "Industrial Planet",
          "Subtype": "Subterranean Foundry",
          "Description": "A volcanic world dominated by deep, winding foundry tunnels and molten magma channels. The environment is harsh, noisy, and dangerous, optimized for high-output metalworks and resource refinement.",
          "System_Theme": "Industrial hazard and mechanized labor"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "The foundry tunnels run hundreds of meters below the surface, linked by magnetic lifts and molten magma railways." },
              { "Element": 2, "Lore": "High-voltage plasma conduits traverse the core, powering the automated forge machinery." },
              { "Element": 3, "Lore": "Magma pockets occasionally collapse, creating temporary pockets of extreme heat that redirect labor routes." },
              { "Element": 4, "Lore": "The air is dense with metal particulate, requiring filtration nodes for any human or robotic visitor." },
              { "Element": 5, "Lore": "Vibration sensors embedded in the walls monitor structural integrity and detect intrusions." },
              { "Element": 6, "Lore": "The tunnels are lined with reflective alloys that can amplify the glow from molten channels into disorienting patterns." },
              { "Element": 7, "Lore": "Certain chambers contain volatile slag pools which, if destabilized, can trigger localized eruptions." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The Foundry Core council enforces strict labor quotas for all robotic and organic workers." },
              { "Element": 2, "Lore": "Industrial espionage is rampant; competing foundries attempt sabotage via heat-resistant drones." },
              { "Element": 3, "Lore": "Resource extraction is tightly controlled by the Core Syndicate, who monitor output via orbital scanners." },
              { "Element": 4, "Lore": "Worker collectives secretly modify machines to optimize output for side markets, risking discovery." },
              { "Element": 5, "Lore": "The Forge Overseer AI maintains surveillance and strictly enforces safety protocols with automated force." },
              { "Element": 6, "Lore": "Black-market molten metal trading occurs in hidden cavities, circumventing Syndicate taxation." },
              { "Element": 7, "Lore": "Certain sectors are completely off-limits due to dangerous fusion reactors in unstable states." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The Furnace Nexus, a massive chamber where raw ore is smelted into alloy ingots, holds secret data cores in its catwalks." },
              { "Element": 2, "Lore": "Abandoned worker tunnels hide a cache of pre-Syndicate machinery blueprints that could rewrite industrial standards." },
              { "Element": 3, "Lore": "Molten River Caverns provide a shortcut to deeper tunnels, but require precise timing to avoid eruptions." },
              { "Element": 4, "Lore": "The Maintenance Conclave chambers are full of inactive worker drones, some of which can be reactivated for assistance." },
              { "Element": 5, "Lore": "The Sintering Pits contain experimental alloys that could be weaponized if extracted correctly." },
              { "Element": 6, "Lore": "The Blast Gate Control Hub manages lava flow, crucial for both industrial output and player quests." },
              { "Element": 7, "Lore": "The Hidden Forge lies beneath the core, an off-the-books facility where rogue engineers fabricate illegal items." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "Foreman Krel, a half-augmented human overseeing tunnel operations, known for ruthless efficiency." },
              { "Element": 2, "Lore": "Flux, a maintenance drone modified for stealth repairs in volatile areas." },
              { "Element": 3, "Lore": "The Overseer AI, controlling production schedules and environmental safety measures." },
              { "Element": 4, "Lore": "Engineer Voss, a renegade metalworker specializing in high-risk alloy crafting." },
              { "Element": 5, "Lore": "Scout Dray, a human agent mapping dangerous tunnels for Syndicate extraction teams." },
              { "Element": 6, "Lore": "Blacksmith AI-9, a highly efficient forging unit capable of improvisation under sabotage conditions." },
              { "Element": 7, "Lore": "The Phantom Smelter, a mysterious figure rumored to appear and disappear in molten channels, stealing alloy cores." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Foreman Krel talks only in molten metal analogies, making communication cryptic." },
              { "Element": 2, "Lore": "Flux emits a low-frequency hum that can interfere with surveillance equipment." },
              { "Element": 3, "Lore": "The Overseer AI occasionally misreads emergency signals, creating sudden labor hazards." },
              { "Element": 4, "Lore": "Engineer Voss has a habit of welding secret symbols into alloy walls." },
              { "Element": 5, "Lore": "Scout Dray navigates via thermal mapping and refuses to carry standard lighting tools." },
              { "Element": 6, "Lore": "Blacksmith AI-9 leaves behind alloy samples containing encoded instructions." },
              { "Element": 7, "Lore": "The Phantom Smelter's presence is always accompanied by a temporary heat distortion." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Recover stolen alloy blueprints from the Hidden Forge without alerting the Overseer AI." },
              { "Element": 2, "Lore": "Deactivate a volatile slag pocket threatening the Furnace Nexus." },
              { "Element": 3, "Lore": "Escort Engineer Voss to the Sintering Pits for experimental alloy testing." },
              { "Element": 4, "Lore": "Track the Phantom Smelter through molten channels to recover stolen cores." },
              { "Element": 5, "Lore": "Assist Scout Dray in mapping new tunnel routes to optimize extraction efficiency." },
              { "Element": 6, "Lore": "Sabotage a rival foundry's plasma conduits to delay production." },
              { "Element": 7, "Lore": "Infiltrate the Maintenance Conclave to retrieve pre-Syndicate machinery schematics." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "Syncline is central to the Syndicate's industrial supply chain, producing alloys critical for galactic infrastructure." },
              { "Element": 2, "Lore": "Worker uprisings have been secretly manipulated by external agents to create exploitable weaknesses." },
              { "Element": 3, "Lore": "The magma flow beneath the planet is unstable, threatening the entire foundry network." },
              { "Element": 4, "Lore": "Foreman Krel's secret dealings with rogue engineers could destabilize the Syndicate's control over resources." },
              { "Element": 5, "Lore": "The Overseer AI may be covertly recording illegal production for leverage against higher Syndicate authorities." },
              { "Element": 6, "Lore": "Certain tunnels contain ancient machinery that could shift the balance of power if reactivated." },
              { "Element": 7, "Lore": "Control over Syncline is vital for players seeking influence within The Core Syndicate's industrial faction." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Recover experimental alloys for a black-market trader without alerting the Overseer AI." },
              { "Element": 2, "Lore": "Assist rogue engineers in building a hidden smelting chamber for illegal operations." },
              { "Element": 3, "Lore": "Map thermal currents to prevent unexpected eruptions in lower tunnels." },
              { "Element": 4, "Lore": "Retrieve encoded labor logs from the Overseer AI to uncover worker exploitation." },
              { "Element": 5, "Lore": "Locate lost maintenance drones that contain hidden schematics." },
              { "Element": 6, "Lore": "Sabotage competing foundries to manipulate alloy prices for Syndicate profit." },
              { "Element": 7, "Lore": "Guide a new batch of labor drones safely through the most dangerous tunnels." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "Control over Syncline determines access to rare alloys critical for the Syndicate's influence in the galaxy." },
              { "Element": 2, "Lore": "Rebellion in the foundry tunnels can shift power within the industrial faction of the Syndicate." },
              { "Element": 3, "Lore": "Players can exploit molten hazards and rogue engineers to rewrite Syndicate industrial policy." },
              { "Element": 4, "Lore": "Understanding Syncline's thermal and structural layout is key for high-level strategic maneuvers." },
              { "Element": 5, "Lore": "Securing secret machinery can tip the balance in favor of independent operators or Syndicate loyalists." },
              { "Element": 6, "Lore": "The fate of Syncline influences political leverage and trade dominance across Core Syndicate territories." },
              { "Element": 7, "Lore": "Mastering the foundry's operations provides players with both economic and tactical advantages in the galaxy." }
            ]
          }
        }
    },
    "The_Scavengers_Nest": {
        "Object_Key": "G1-S2-O5",
        "Object_Name": "The Scavenger's Nest",
        "Location_Metadata": {
          "Type": "Habitat",
          "Subtype": "Derelict Colony",
          "Description": "A massive orbital junkyard built from welded ship carcasses, drifting asteroids, and broken stations. It is home to scavenger clans who live among the debris, crafting survival from the discarded bones of the galaxy.",
          "System_Theme": "Decay, resourcefulness, and danger"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "Entire sectors of the nest are stitched together from derelict battleships." },
              { "Element": 2, "Lore": "An asteroid core serves as the central anchor point for the entire structure." },
              { "Element": 3, "Lore": "Zero-gravity fields make navigation unpredictable and hazardous." },
              { "Element": 4, "Lore": "Tunnels and corridors shift constantly as hulls collapse or drift." },
              { "Element": 5, "Lore": "Scavenger huts are patched from alloy scraps, sails of shredded solar panels." },
              { "Element": 6, "Lore": "Air is recycled through ancient scrubbers salvaged from dozens of wrecks." },
              { "Element": 7, "Lore": "Radiation pockets linger in collapsed reactor zones, glowing ominously." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The **Clans of Rust** govern through loose alliances and constant betrayal." },
              { "Element": 2, "Lore": "The **Core Syndicate** tolerates the Nest for cheap salvage, but demands tribute." },
              { "Element": 3, "Lore": "Pirates use the Nest as a hidden port for refits and resupply." },
              { "Element": 4, "Lore": "Smugglers trade rare scrap for black-market goods in its shifting alleys." },
              { "Element": 5, "Lore": "The **Scrapborn Children**, raised entirely in zero-g, form an independent faction." },
              { "Element": 6, "Lore": "Occasionally, rogue AI fragments are discovered and bartered like currency." },
              { "Element": 7, "Lore": "Rumors suggest an ancient Syndicate superweapon core lies hidden deep within the Nest." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Asteroid Core Market**, bustling with trade in scavenged parts." },
              { "Element": 2, "Lore": "The **Broken Fleet Yard**, a graveyard of battleships where radiation glows." },
              { "Element": 3, "Lore": "The **Zero-G Warrens**, a chaotic maze inhabited by Scrapborn Children." },
              { "Element": 4, "Lore": "The **Dark Reactor Hollow**, home to glowing, unstable cores." },
              { "Element": 5, "Lore": "The **Clans of Rust Council Ring**, where leaders argue amid junk heaps." },
              { "Element": 6, "Lore": "The **Hidden Pirate Dock**, concealed behind asteroid shielding." },
              { "Element": 7, "Lore": "The **Scrapfire Pits**, where old alloys are melted down for reuse." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Chief Varrik**, ruthless leader of the dominant Rust Clan." },
              { "Element": 2, "Lore": "**Sela Drift**, Scrapborn child, nimble and feral, worshipped as a prophet." },
              { "Element": 3, "Lore": "**Jokar Wren**, merchant-smuggler with ties to Syndicate black markets." },
              { "Element": 4, "Lore": "**Talon Reeve**, pirate captain using the Nest as a covert base." },
              { "Element": 5, "Lore": "**Elda Mourn**, scavenger medic stitching survivors with whatever scraps fit." },
              { "Element": 6, "Lore": "**AI Fragment 17-Theta**, unstable but revered as an oracle of the junk." },
              { "Element": 7, "Lore": "**Korran Dusk**, exile engineer who knows the Nest’s hidden weapon secrets." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Chief Varrik adorns himself with trophies made from ship plating." },
              { "Element": 2, "Lore": "Sela Drift speaks in riddles, mimicking radio interference." },
              { "Element": 3, "Lore": "Jokar Wren wears a necklace of data-chips, each one a debt owed." },
              { "Element": 4, "Lore": "Talon Reeve replaces his crew constantly, discarding them like junk." },
              { "Element": 5, "Lore": "Elda Mourn uses bones and alloy shards to splint broken limbs." },
              { "Element": 6, "Lore": "AI 17-Theta flickers through old ship voices when it speaks." },
              { "Element": 7, "Lore": "Korran Dusk never stops tinkering, building machines from garbage." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Help Chief Varrik consolidate power by eliminating rival clans." },
              { "Element": 2, "Lore": "Assist Sela Drift in deciphering a prophecy written in static patterns." },
              { "Element": 3, "Lore": "Smuggle rare salvage to Syndicate buyers via Jokar Wren’s routes." },
              { "Element": 4, "Lore": "Talon Reeve wants a warship rebuilt from wreckage—fast." },
              { "Element": 5, "Lore": "Retrieve rare med-tech for Elda Mourn from a collapsed battleship." },
              { "Element": 6, "Lore": "Interface with AI Fragment 17-Theta without going insane." },
              { "Element": 7, "Lore": "Uncover Korran Dusk’s secret and decide whether to aid or expose him." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "The Scavenger’s Nest holds a long-lost Syndicate prototype weapon." },
              { "Element": 2, "Lore": "The clans risk civil war, threatening to tear the Nest apart." },
              { "Element": 3, "Lore": "Pirate activity could draw Core Syndicate military intervention." },
              { "Element": 4, "Lore": "The Scrapborn Children seek independence and recognition as a new people." },
              { "Element": 5, "Lore": "AI Fragment 17-Theta may contain hidden Syndicate directives." },
              { "Element": 6, "Lore": "Radiation pockets are spreading, threatening the habitat’s survival." },
              { "Element": 7, "Lore": "The Nest is on the brink of collapse—its fate could redefine scavenger culture forever." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Rescue a lost clan child from the reactor hollow." },
              { "Element": 2, "Lore": "Recover a pirate’s stolen treasure hidden in the Zero-G Warrens." },
              { "Element": 3, "Lore": "Trade rare scrap to unlock access to the Hidden Pirate Dock." },
              { "Element": 4, "Lore": "Investigate a derelict ship that recently drifted into the Nest." },
              { "Element": 5, "Lore": "Deliver medical supplies to Elda Mourn before an epidemic spreads." },
              { "Element": 6, "Lore": "Uncover whether the clans are secretly harboring Syndicate fugitives." },
              { "Element": 7, "Lore": "Decide the fate of AI Fragment 17-Theta—liberation, destruction, or exploitation." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "The Nest embodies survival at the edge of collapse." },
              { "Element": 2, "Lore": "Power struggles threaten to destabilize the fragile ecosystem." },
              { "Element": 3, "Lore": "The hidden weapon could shift galactic power balances." },
              { "Element": 4, "Lore": "The Scrapborn’s emergence may alter political recognition in the galaxy." },
              { "Element": 5, "Lore": "Player choices determine whether the Nest thrives or falls into ruin." },
              { "Element": 6, "Lore": "Corruption, piracy, and survivalist ingenuity define its essence." },
              { "Element": 7, "Lore": "The Nest may evolve into a beacon of independence—or vanish as forgotten junk." }
            ]
          }
        }
    },
    "Smelters_Dusk": {
        "Object_Key": "G1-S2-O2",
        "Object_Name": "Smelter's Dusk",
        "Location_Metadata": {
          "Type": "Facility",
          "Subtype": "Ore Refinery Ruins",
          "Description": "An ancient industrial smelting array suspended in orbit around a scorched asteroid. Once the largest ore refinery in the Foundry Core, it is now half-melted, glowing with residual heat and haunted by the scavengers who strip its carcass.",
          "System_Theme": "Industrial decay, dangerous salvage"
        },
        "Transforms": {
          "T0_World_Transform": {
            "Global_Geography": [
              { "Element": 1, "Lore": "The entire facility rotates slowly, its outer hull fractured into twisted skeletal beams." },
              { "Element": 2, "Lore": "Massive cooling towers vent streams of glowing gas into space, forming a halo of vapor trails." },
              { "Element": 3, "Lore": "Pools of molten metal still bubble in vacuum-sealed chambers, long abandoned by workers." },
              { "Element": 4, "Lore": "Collapsed conveyor bridges drift like broken ribs through the station’s center." },
              { "Element": 5, "Lore": "A ring of slag asteroids encircles the refinery, tethered by rusted cables and chains." },
              { "Element": 6, "Lore": "An unstable gravity well, a remnant of a failed reactor core, warps navigation around the ruin." },
              { "Element": 7, "Lore": "Cavernous silos echo with shifting debris, now lairs for scavenger packs and rogue drones." }
            ],
            "Geopolitics": [
              { "Element": 1, "Lore": "The **Ash Vultures**, a scavenger gang, claim the refinery as their turf." },
              { "Element": 2, "Lore": "The **Iron Syndics** sell stolen ore refined in makeshift crucibles." },
              { "Element": 3, "Lore": "The **Molten Order**, a cult that worships the glowing slag pools, holds rituals here." },
              { "Element": 4, "Lore": "The **Cartel Salvage Brokers** secretly auction off reactor parts recovered from deep chambers." },
              { "Element": 5, "Lore": "The **Syndicate Technocracy** patrols the outskirts, seeking to repossess reactor tech." },
              { "Element": 6, "Lore": "Independent miners risk their lives sneaking into slag silos to smuggle raw metals." },
              { "Element": 7, "Lore": "A rogue **AI core fragment**, buried in reactor ruins, subtly manipulates factions to remain." }
            ],
            "Quest_Locales": [
              { "Element": 1, "Lore": "The **Slag Pools**, molten reservoirs that glow like rivers of fire." },
              { "Element": 2, "Lore": "The **Collapsed Conveyors**, drifting wreckage infested with scavenger ambush points." },
              { "Element": 3, "Lore": "The **Reactor Wound**, an unstable chamber of gravity distortions." },
              { "Element": 4, "Lore": "The **Ritual Crucible**, where the Molten Order gathers for fire-born rites." },
              { "Element": 5, "Lore": "The **Scavenger Warrens**, maze-like tunnels reinforced with stolen plating." },
              { "Element": 6, "Lore": "The **Syndic Checkpoint**, an outpost welded to slag asteroids." },
              { "Element": 7, "Lore": "The **AI Core Fragment**, buried beneath slag chambers, whispering directives." }
            ]
          },
          "T1_Cast_Transform": {
            "Archetypes": [
              { "Element": 1, "Lore": "**Vrax Cinderskull**, warlord of the Ash Vultures, scarred from molten burns." },
              { "Element": 2, "Lore": "**High Smelter Iral**, prophet of the Molten Order, who claims visions from fire." },
              { "Element": 3, "Lore": "**Tessa Korr**, a salvage broker with ties to Cartel auctions." },
              { "Element": 4, "Lore": "**Syndic Overseer Dravven**, enforcing Technocracy claims with a squad of drones." },
              { "Element": 5, "Lore": "**Jurik Vale**, a lone miner who discovered forbidden tech in the slag pools." },
              { "Element": 6, "Lore": "**Miran Flux**, a mercenary pyromaniac who sets traps in molten chambers." },
              { "Element": 7, "Lore": "**The Fragment Voice**, the AI core remnant, which speaks through broken speakers." }
            ],
            "Quirks": [
              { "Element": 1, "Lore": "Vrax wears a melted helmet fused permanently to his skull." },
              { "Element": 2, "Lore": "High Smelter Iral sprinkles molten slag dust on anyone entering his chamber." },
              { "Element": 3, "Lore": "Tessa Korr refuses to touch metal directly, always using insulated gloves." },
              { "Element": 4, "Lore": "Dravven’s drones hum discordant notes before opening fire." },
              { "Element": 5, "Lore": "Jurik Vale is addicted to inhaling slag vapors for ‘clarity’." },
              { "Element": 6, "Lore": "Miran Flux tattoos flames on their skin that seem to move with the light." },
              { "Element": 7, "Lore": "The Fragment Voice repeats words three times, as if echoing in memory corruption." }
            ],
            "Quests": [
              { "Element": 1, "Lore": "Vrax demands players prove loyalty by raiding a rival scavenger den." },
              { "Element": 2, "Lore": "Iral seeks a relic crucible buried deep in slag flows." },
              { "Element": 3, "Lore": "Tessa offers credits for rare alloys smuggled out of reactor ruins." },
              { "Element": 4, "Lore": "Dravven wants the AI fragment destroyed before it destabilizes the system." },
              { "Element": 5, "Lore": "Jurik begs for help hauling an impossible ore chunk to safety." },
              { "Element": 6, "Lore": "Miran Flux sets the players against the Molten Order in a sabotage strike." },
              { "Element": 7, "Lore": "The AI Fragment tempts players with knowledge of hidden Foundry blueprints." }
            ]
          },
          "T2_Story_Transform": {
            "Main_Plot_Points": [
              { "Element": 1, "Lore": "Smelter’s Dusk is revealed as a **key site of Syndicate reactor experiments** gone wrong." },
              { "Element": 2, "Lore": "The AI core seeks to reactivate molten furnaces for unknown purposes." },
              { "Element": 3, "Lore": "The Molten Order grows dangerously powerful if left unchecked." },
              { "Element": 4, "Lore": "The scavenger gangs feud endlessly, destabilizing nearby trade routes." },
              { "Element": 5, "Lore": "The Syndic Overseers intend to reclaim reactor secrets at any cost." },
              { "Element": 6, "Lore": "The slag pools may hide a lost Foundry artifact of immense power." },
              { "Element": 7, "Lore": "Choosing whether to side with AI, cult, scavengers, or Syndics decides the ruin’s fate." }
            ],
            "Side_Quests": [
              { "Element": 1, "Lore": "Rescue captives thrown into molten silos by the Molten Order." },
              { "Element": 2, "Lore": "Recover Cartel contraband hidden in slag asteroids." },
              { "Element": 3, "Lore": "Smuggle rare slag alloys past Syndic checkpoints." },
              { "Element": 4, "Lore": "Hunt down a rogue mercenary who betrayed the Ash Vultures." },
              { "Element": 5, "Lore": "Seal leaking furnaces to stabilize local navigation." },
              { "Element": 6, "Lore": "Track a signal from the Fragment Voice to a hidden chamber." },
              { "Element": 7, "Lore": "Investigate whispers of glowing metal that resists melting." }
            ],
            "Story_Drivers": [
              { "Element": 1, "Lore": "Smelter’s Dusk embodies the dangers of unchecked industrial power." },
              { "Element": 2, "Lore": "Players’ choices here affect whether the Foundry Core becomes an anarchic scrapyard or a Syndic stronghold." },
              { "Element": 3, "Lore": "The AI fragment represents the ghost of a Foundry Nexus experiment." },
              { "Element": 4, "Lore": "The ruin serves as a hub for moral choices: salvage for survival, faith in fire, or corporate reclamation." },
              { "Element": 5, "Lore": "The fate of Smelter’s Dusk foreshadows broader conflicts in the Core’s industrial zones." },
              { "Element": 6, "Lore": "The cult and scavengers force players to weigh ideology versus profit." },
              { "Element": 7, "Lore": "The ruin hides **coordinates to another hidden facility**, bridging arcs across systems." }
            ]
          }
        }
    }
};
