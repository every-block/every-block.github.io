// vote-name remapping applied while loading responses
export const VOTE_REMAP: Readonly<Record<string, string>> = {
  "Waxed Block of Copper": "Block of Copper",
  "Weathered Copper": "Block of Copper",
  "Weathered Chiseled Copper": "Block of Copper",
  "Waxed Cut Copper": "Cut Copper",
  "Waxed Cut Copper Slab": "Cut Copper Slab",
  "Waxed Cut Copper Stairs": "Cut Copper Stairs",
  "Waxed Exposed Copper": "Exposed Copper",
  "Waxed Exposed Cut Copper": "Exposed Cut Copper",
  "Waxed Exposed Cut Copper Slab": "Exposed Cut Copper Slab",
  "Waxed Exposed Cut Copper Stairs": "Exposed Cut Copper Stairs",
  "Waxed Lightning Rod": "Lightning Rod",
  "Waxed Oxidized Copper": "Oxidized Copper",
  "Waxed Oxidized Cut Copper": "Oxidized Cut Copper",
  "Waxed Oxidized Cut Copper Slab": "Oxidized Cut Copper Slab",
  "Waxed Oxidized Cut Copper Stairs": "Oxidized Cut Copper Stairs",
  "Waxed Weathered Copper": "Weathered Copper",
  "Waxed Weathered Cut Copper": "Weathered Cut Copper",
  "Waxed Weathered Cut Copper Slab": "Weathered Cut Copper Slab",
  "Waxed Weathered Cut Copper Stairs": "Weathered Cut Copper Stairs",
  "Black Wall Banner": "Black Banner",
  "Blue Wall Banner": "Blue Banner",
  "Brown Wall Banner": "Brown Banner",
  "Cyan Wall Banner": "Cyan Banner",
  "Gray Wall Banner": "Gray Banner",
  "Green Wall Banner": "Green Banner",
  "Light Blue Wall Banner": "Light Banner",
  "Light Gray Wall Banner": "Light Gray Banner",
  "Lime Wall Banner": "Lime Banner",
  "Magenta Wall Banner": "Magenta Banner",
  "Orange Wall Banner": "Orange Banner",
  "Pink Wall Banner": "Pink Banner",
  "Purple Wall Banner": "Purple Banner",
  "Red Wall Banner": "Red Banner",
  "White Wall Banner": "White Banner",
  "Yellow Wall Banner": "Yellow Banner",
};

export const VOTE_REMAP_BY_KEY: ReadonlyMap<string, string> = (() => {
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/[\s_-]+/g, " ");
  const out = new Map<string, string>();
  for (const [from, to] of Object.entries(VOTE_REMAP)) {
    out.set(norm(from), norm(to));
  }
  return out;
})();
