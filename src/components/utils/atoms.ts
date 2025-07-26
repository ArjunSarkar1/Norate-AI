import { atom } from "jotai";
import type { Range } from "@tiptap/core";

export const rangeAtom = atom<Range | null>(null);
export const queryAtom = atom<string>(""); 