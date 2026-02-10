export type Scale =
    | "intergalactic"
    | "interstellar"
    | "interplanetary"
    | "planetary"
    | "civilizational"
    | "city"
    | "region"
    | "inhabitant";

export interface ScaleState {
    politics: number;
    economy: number;
    unrest: number;
}
