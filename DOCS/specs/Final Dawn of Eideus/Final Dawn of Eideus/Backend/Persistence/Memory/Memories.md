  

Memories are voxel cubes in Eideus Dawn. They are found at coordinate locations whe3re they were recorded. They follow a strict key format of location [gX.sX.oX_cX.ctX.rX] for (G)alaxy.(S)tar system.explorable (O)bject_(C)_ivilization.(C)i(T)y.(R)egional location

  

Memories are also encoded with a temporal key [s(0-6).b.(0-6)c(0-6).p(0-oo)] where,

s= Saga = Player save file with 6 availabkle slots for different characters in the same universe seed

b= Book = Which world you are essential on

c= Chapter = One gaming session

p = Page = The actual memories Each memory is a voxel at that coordinate location in that frame of time. Each memory voxel maps its 6 faces to a different mode of memory.x+= The summed input of the game turn

x-= The summed output of the game turn

y+= Up to 7 embeddings from the I/O of the game turn

y-= Up to 7 associative tags from the I/O of the game turn

z+= Any entities character cards

z-= The lorekey for that locations address in the per world lorebook

  

We udse a LLM/Embeddings pair to determine user intent and choose from among a handful of toolcalls to determine our entry point into the memory