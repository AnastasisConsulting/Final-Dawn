// /src/fsUtil.ts
import * as fs from "node:fs";
import * as path from "node:path";

export function listDirs(p: string): string[] {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d: fs.Dirent) => d.isDirectory())
    .map((d: fs.Dirent) => d.name)
    .sort((a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function listFiles(p: string): string[] {
  return fs
    .readdirSync(p, { withFileTypes: true })
    .filter((d: fs.Dirent) => d.isFile())
    .map((d: fs.Dirent) => d.name)
    .sort((a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function join(...parts: string[]): string {
  return path.join(...parts);
}

export function isWorldObjectFolderName(name: string): boolean {
  return !!name && !name.startsWith(".");
}

export function isSystemFolderName(name: string): boolean {
  return !!name && !name.startsWith(".");
}

export function isGalaxyFolderName(name: string): boolean {
  return !!name && !name.startsWith(".");
}