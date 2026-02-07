// PATH: src/fractalTemplate.ts
import templateJson from "../data/template.json";
import type { Template } from "./types.js";

export const TEMPLATE: Template = templateJson as unknown as Template;
