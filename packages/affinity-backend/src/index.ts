
import { registerEntity, applyDelta, step } from "./api.js";

registerEntity({ id: "player", affinity: "str", tension: { recent: 0, longTerm: 0 } });
registerEntity({ id: "lyra", affinity: "int", tension: { recent: 0, longTerm: 0 } });

applyDelta({ source: "player", target: "lyra", delta: -10 });

console.log(step());
