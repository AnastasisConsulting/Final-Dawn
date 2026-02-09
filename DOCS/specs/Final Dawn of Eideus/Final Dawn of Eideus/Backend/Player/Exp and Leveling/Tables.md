## Leveling XP Table (as given)

| Reach Level | XP needed from previous | Total XP to reach level |
| ----------- | ----------------------- | ----------------------- |
| 1           | 1351                    | 1351                    |
| 2           | 1405                    | 2756                    |
| 3           | 1462                    | 4218                    |
| 4           | 1520                    | 5738                    |
| 5           | 1581                    | 7319                    |
| 6           | 1644                    | 8963                    |
| 7           | 1710                    | 10673                   |
| 8           | 1847                    | 12520                   |
| 9           | 1994                    | 14514                   |
| 10          | 2154                    | 16668                   |
| 11          | 2326                    | 18994                   |
| 12          | 2513                    | 21507                   |
| 13          | 2714                    | 24221                   |
| 14          | 2931                    | 27152                   |
| 15          | 3341                    | 30493                   |
| 16          | 3809                    | 34302                   |
| 17          | 4343                    | 38645                   |
| 18          | 4951                    | 43596                   |
| 19          | 5642                    | 49234                   |
| 20          | 6432                    | 55666                   |
| 21          | 7334                    | 63000                   |

---

## Story Quest XP Table (49 quests, strictly increasing, total = 31,500)

**Segmentation rule:** 49 quests split into thirds:

- Quests **1–16** use scalar **0.2** (segment total **6,109**)
    
- Quests **17–32** use scalar **0.3** (segment total **9,164**)
    
- Quests **33–49** use scalar **0.5** (segment total **16,227**)
    

|Story Quest #|Quest XP Award|
|---|---|
|1|374|
|2|375|
|3|376|
|4|377|
|5|378|
|6|379|
|7|380|
|8|381|
|9|382|
|10|383|
|11|384|
|12|386|
|13|387|
|14|388|
|15|389|
|16|390|
|17|565|
|18|566|
|19|567|
|20|568|
|21|569|
|22|570|
|23|571|
|24|572|
|25|573|
|26|574|
|27|575|
|28|576|
|29|578|
|30|579|
|31|580|
|32|581|
|33|946|
|34|947|
|35|948|
|36|949|
|37|950|
|38|951|
|39|952|
|40|953|
|41|955|
|42|956|
|43|957|
|44|958|
|45|959|
|46|960|
|47|961|
|48|962|
|49|963|

**Totals (for audit):**

- Quests 1–16 sum = **6,109**
    
- Quests 17–32 sum = **9,164**
    
- Quests 33–49 sum = **16,227**
    
- Grand total = **31,500** (exact)
    

---

## Enemy XP Tier Table (ranges)

**Base averages and spreads (your spec):**

- Common avg **200**, spread **±25**
    
- Medium avg **300**, spread **±50**
    
- Hard avg **500**, spread **±75**
    
- Legendary: **0 XP** (special loot/flags only)
    

|Enemy Tier|Avg XP|Min XP|Max XP|Notes|
|---|---|---|---|---|
|Common (Tier 1)|200|175|225|fodder/common enemies|
|Medium (Tier 2)|300|250|350|uncommon/strong enemies|
|Hard (Tier 3)|500|425|575|elite enemies|
|Legendary (Special)|0|0|0|no XP; unique drops/flags|

**Award rule:** pick a value in `[min,max]` deterministically (hash of sagaKey + encounter seed + enemyId), so replay is stable and farming can’t be trivially solved.