The Affinity system in Final Dawn of Eideus is a top down bottoms up simulation of the universe happening all around the player at any given time. There are 3 main gears to the Affinity system and those are 

1. Politics
2. Economy
3. Civil Unrest

These 3 gears churn at every drill down level from


MACRO 3x3x7
1. Inter-galactic
	1. Galaxy 1
	2. Galaxy 2
	3. Galaxy 3
2. Inter-stellar
	1. Star System 1
	2. Star System 2
	3. Star System 3
3. Planetary
	1. Planetary Object 1
	2. Planetary Object 2
	3. Planetary Object 3
	4. Planetary Object 4
	5. Planetary Object 5
	6. Planetary Object 6
	7. Planetary Object 7
	
MICRO 3x3x7
1. Globally(has citizens of city and regional inhabitants)
	1. Civilization 1
	2. Civilization 2
	3. Civilization 3
2. Civically(has inhabitants)
	1. City 1
	2. City 2
	3. City 3
3. Regionally(has inhabitants)
	1. Region 1
	2. Region 2
	3. Region 3
	4. Region 4
	5. Region 5
	6. Region 6
	7. Region 7

The drivers for the affinity simulation are as follows

Every person/place/in-game system(politics, economy, public unrest) has an affinity of either str, int, or dex. The affinity table:

        str  /  int  /  dex
  str           +1          0           -1

  int            -1        +1           0
 
  dex          0           -1          +1


We use relational scores between both the player and the supporting cast and the supporting casts relationship score with each other as well as the differences of both to modify the weights of the sim.

Politics drives Diplomacy
Diplomacy drives Economy 
Economy drives Politics

On-world affinity system

Inhabitants represent the public unrest 

the regional public unrest drives the city diplomacy
city diplomacy drives the city economy
city economy drives the civilizational politics
civilizational politics drives the civilizational unrest 
civilizational unrest drives the interplanetary diplomacy


interplanetary diplomacy drives the interplanetary economy
interplanetary economy drives the interplanetary politics 
interplanetary politics drives the interplanetary unrest
interplanetary unrest drives the interstellar diplomacy

interstellar diplomacy drives the interstellar economy
interstellar economy drives the interstellar politics
interstellar politics drives the interstellar unrest
interstellar unrest drives the intergalactic diplomacy

intergalactic diplomacy drives the intergalactic economy
intergalactic economy drives the intergalactic politics
intergalactic politics drives the intergalactic unrest
intergalactic unrest drives the intergalactic diplomacy
intergalactic diplomacy is tied to the actuator


these update in their inter-galactic, inter-stellar, and interplanetary groupings as well as a modifier of -3 for intergalactic to interstellar -2 for interstellar to interplanetary. -1 for interplanetary to planetary, 0 from planetary to civilizational, +1 for civilizational to cities, +2 for cities to regions, and +3 from regions to inhabitants. This modifier represents the speed at which things update per tic. Rationale being wheels turn slower at higher levels.

The actuators of this system 
Players relational scores are kept between the player , Lyra, Navbot, and vizzy and the difference of the difference between these scores is the modifier to the regional public unrest that is also the tensioner of the intergalactic diplomacy