import type { Block } from "./types";

export interface GroupRule {
  key: string;
  name: string;
  members: readonly string[];
  representative?: string;
}

const norm = (s: string): string =>
  s.trim().toLowerCase().replace(/[\s_-]+/g, " ");

function woodMembers(t: string): string[] {
  return [
    `${t} Log`,
    `Stripped ${t} Log`,
    `${t} Wood`,
    `Stripped ${t} Wood`,
    `${t} Leaves`,
    `${t} Planks`,
    `${t} Slab`,
    `${t} Stairs`,
  ];
}

function coralMembers(): string[] {
  const species = ["Tube", "Brain", "Bubble", "Fire", "Horn"];
  const suffixes = ["Coral", "Coral Block", "Coral Fan", "Coral Wall Fan"];
  const out: string[] = [];
  for (const sp of species) {
    for (const sx of suffixes) {
      out.push(`${sp} ${sx}`);
      out.push(`Dead ${sp} ${sx}`);
    }
  }
  return out;
}

export const GROUP_RULES: readonly GroupRule[] = [
  {
    key: "group:cobblestone",
    name: "Cobblestone",
    members: [
      "Cobblestone",
      "Cobblestone Slab",
      "Cobblestone Stairs",
      "Cobblestone Wall",
      "Mossy Cobblestone",
      "Mossy Cobblestone Slab",
      "Mossy Cobblestone Stairs",
      "Mossy Cobblestone Wall",
    ],
    representative: "Cobblestone",
  },
  {
    key: "group:smooth-stone",
    name: "Smooth Stone",
    members: ["Smooth Stone", "Smooth Stone Slab"],
    representative: "Smooth Stone",
  },
  {
    key: "group:deepslate-tile",
    name: "Deepslate Tile",
    members: [
      "Deepslate Tiles",
      "Deepslate Tile Slab",
      "Deepslate Tile Stairs",
      "Deepslate Tile Wall",
      "Cracked Deepslate Tiles",
    ],
    representative: "Deepslate Tiles",
  },
  {
    key: "group:deepslate-brick",
    name: "Deepslate Brick",
    members: [
      "Deepslate Bricks",
      "Deepslate Brick Slab",
      "Deepslate Brick Stairs",
      "Deepslate Brick Wall",
      "Cracked Deepslate Bricks",
    ],
    representative: "Deepslate Bricks",
  },
  {
    key: "group:red-sandstone",
    name: "Red Sandstone",
    members: [
      "Red Sandstone",
      "Red Sandstone Slab",
      "Red Sandstone Stairs",
      "Red Sandstone Wall",
      "Chiseled Red Sandstone",
      "Cut Red Sandstone",
      "Cut Red Sandstone Slab",
      "Smooth Red Sandstone",
      "Smooth Red Sandstone Slab",
      "Smooth Red Sandstone Stairs",
    ],
    representative: "Red Sandstone",
  },
  {
    key: "group:dark-prismarine",
    name: "Dark Prismarine",
    members: [
      "Dark Prismarine",
      "Dark Prismarine Slab",
      "Dark Prismarine Stairs",
    ],
    representative: "Dark Prismarine",
  },
  {
    key: "group:red-nether-bricks",
    name: "Red Nether Bricks",
    members: [
      "Red Nether Bricks",
      "Red Nether Brick Slab",
      "Red Nether Brick Stairs",
      "Red Nether Brick Wall",
    ],
    representative: "Red Nether Bricks",
  },

  {
    key: "group:stone",
    name: "Stone",
    members: [
      "Stone",
      "Stone Slab",
      "Stone Stairs",
      "Stone Bricks",
      "Stone Brick Slab",
      "Stone Brick Stairs",
      "Stone Brick Wall",
      "Chiseled Stone Bricks",
      "Mossy Stone Bricks",
      "Mossy Stone Brick Slab",
      "Mossy Stone Brick Stairs",
      "Mossy Stone Brick Wall",
      "Cracked Stone Bricks",
    ],
    representative: "Stone",
  },
  {
    key: "group:blackstone",
    name: "Blackstone",
    members: [
      "Blackstone",
      "Blackstone Slab",
      "Blackstone Stairs",
      "Blackstone Wall",
      "Polished Blackstone",
      "Polished Blackstone Slab",
      "Polished Blackstone Stairs",
      "Polished Blackstone Wall",
      "Chiseled Polished Blackstone",
      "Polished Blackstone Bricks",
      "Polished Blackstone Brick Slab",
      "Polished Blackstone Brick Stairs",
      "Polished Blackstone Brick Wall",
      "Cracked Polished Blackstone Bricks",
      "Gilded Blackstone",
    ],
    representative: "Blackstone",
  },
  {
    key: "group:granite",
    name: "Granite",
    members: [
      "Granite",
      "Granite Slab",
      "Granite Stairs",
      "Granite Wall",
      "Polished Granite",
      "Polished Granite Slab",
      "Polished Granite Stairs",
    ],
    representative: "Granite",
  },
  {
    key: "group:andesite",
    name: "Andesite",
    members: [
      "Andesite",
      "Andesite Slab",
      "Andesite Stairs",
      "Andesite Wall",
      "Polished Andesite",
      "Polished Andesite Slab",
      "Polished Andesite Stairs",
    ],
    representative: "Andesite",
  },
  {
    key: "group:diorite",
    name: "Diorite",
    members: [
      "Diorite",
      "Diorite Slab",
      "Diorite Stairs",
      "Diorite Wall",
      "Polished Diorite",
      "Polished Diorite Slab",
      "Polished Diorite Stairs",
    ],
    representative: "Diorite",
  },
  {
    key: "group:quartz",
    name: "Quartz",
    members: [
      "Block of Quartz",
      "Quartz Slab",
      "Quartz Stairs",
      "Quartz Pillar",
      "Chiseled Quartz Block",
      "Quartz Bricks",
      "Smooth Quartz",
      "Smooth Quartz Slab",
      "Smooth Quartz Stairs",
    ],
    representative: "Block of Quartz",
  },
  {
    key: "group:end-stone",
    name: "End Stone",
    members: [
      "End Stone",
      "End Stone Bricks",
      "End Stone Brick Slab",
      "End Stone Brick Stairs",
      "End Stone Brick Wall",
    ],
    representative: "End Stone",
  },
  {
    key: "group:purpur",
    name: "Purpur",
    members: ["Purpur Block", "Purpur Slab", "Purpur Stairs", "Purpur Pillar"],
    representative: "Purpur Block",
  },
  {
    key: "group:cobbled-deepslate",
    name: "Cobbled Deepslate",
    members: [
      "Cobbled Deepslate",
      "Cobbled Deepslate Slab",
      "Cobbled Deepslate Stairs",
      "Cobbled Deepslate Wall",
      "Polished Deepslate",
      "Polished Deepslate Slab",
      "Polished Deepslate Stairs",
      "Polished Deepslate Wall",
      "Chiseled Deepslate",
    ],
    representative: "Cobbled Deepslate",
  },
  {
    key: "group:tuff",
    name: "Tuff",
    members: [
      "Tuff",
      "Tuff Slab",
      "Tuff Stairs",
      "Tuff Wall",
      "Chiseled Tuff",
      "Tuff Bricks",
      "Tuff Brick Slab",
      "Tuff Brick Stairs",
      "Tuff Brick Wall",
      "Chiseled Tuff Bricks",
      "Polished Tuff",
      "Polished Tuff Slab",
      "Polished Tuff Stairs",
      "Polished Tuff Wall",
    ],
    representative: "Tuff",
  },
  {
    key: "group:brick",
    name: "Brick",
    members: ["Bricks", "Brick Slab", "Brick Stairs", "Brick Wall"],
    representative: "Bricks",
  },
  {
    key: "group:mud-block",
    name: "Mud Block",
    members: [
      "Mud",
      "Packed Mud",
      "Muddy Mangrove Roots",
      "Mud Bricks",
      "Mud Brick Slab",
      "Mud Brick Stairs",
      "Mud Brick Wall",
    ],
    representative: "Mud",
  },
  {
    key: "group:sandstone",
    name: "Sandstone",
    members: [
      "Sandstone",
      "Sandstone Slab",
      "Sandstone Stairs",
      "Sandstone Wall",
      "Chiseled Sandstone",
      "Cut Sandstone",
      "Cut Sandstone Slab",
      "Smooth Sandstone",
      "Smooth Sandstone Slab",
      "Smooth Sandstone Stairs",
    ],
    representative: "Sandstone",
  },
  {
    key: "group:prismarine",
    name: "Prismarine",
    members: [
      "Prismarine",
      "Prismarine Slab",
      "Prismarine Stairs",
      "Prismarine Wall",
      "Prismarine Bricks",
      "Prismarine Brick Slab",
      "Prismarine Brick Stairs",
    ],
    representative: "Prismarine",
  },
  {
    key: "group:block-of-copper",
    name: "Block of Copper",
    members: [
      "Block of Copper",
      "Cut Copper",
      "Chiseled Copper",
      "Copper Stairs",
      "Copper Slab",
      "Copper Grate",
    ],
    representative: "Block of Copper",
  },
  {
    key: "group:lightning-rod",
    name: "Lightning Rod",
    members: [
      "Lightning Rod",
      "Exposed Lightning Rod",
      "Weathered Lightning Rod",
      "Oxidized Lightning Rod",
    ],
    representative: "Lightning Rod",
  },
  {
    key: "group:block-of-resin",
    name: "Block of Resin",
    members: [
      "Block of Resin",
      "Resin Bricks",
      "Resin Brick Slab",
      "Resin Brick Stairs",
      "Resin Brick Wall",
      "Chiseled Resin Bricks",
    ],
    representative: "Block of Resin",
  },
  {
    key: "group:block-of-netherite",
    name: "Block of Netherite",
    members: ["Block of Netherite"],
    representative: "Block of Netherite",
  },

  {
    key: "group:mushroom-block",
    name: "Mushroom Block",
    members: ["Brown Mushroom Block", "Red Mushroom Block", "Mushroom Stem"],
    representative: "Red Mushroom Block",
  },
  {
    key: "group:ice-and-snow",
    name: "Ice and Snow",
    members: ["Ice", "Packed Ice", "Blue Ice", "Snow", "Snow Block", "Powder Snow"],
    representative: "Ice",
  },
  {
    key: "group:coral",
    name: "Coral",
    members: coralMembers(),
  },

  ...(["Oak", "Spruce", "Birch", "Jungle", "Acacia", "Dark Oak", "Mangrove", "Cherry", "Pale Oak"] as const).map<GroupRule>(
    (t) => ({
      key: `group:wood-${norm(t).replace(/ /g, "-")}`,
      name: t,
      members: woodMembers(t),
      representative: `${t} Planks`,
    }),
  ),

  // bamboo wood: planks/slab/stairs + Block of Bamboo + Block of Stripped Bamboo only
  // bamboo mosaic is excluded; bamboo plant stays ungrouped
  {
    key: "group:wood-bamboo",
    name: "Bamboo",
    members: [
      "Bamboo Planks",
      "Bamboo Slab",
      "Bamboo Stairs",
      "Block of Bamboo",
      "Block of Stripped Bamboo",
    ],
    representative: "Bamboo Planks",
  },

  {
    key: "group:wood-crimson",
    name: "Crimson",
    members: [
      "Crimson Planks",
      "Crimson Slab",
      "Crimson Stairs",
      "Crimson Stem",
      "Stripped Crimson Stem",
      "Crimson Hyphae",
      "Stripped Crimson Hyphae",
      "Crimson Fungus",
      "Crimson Roots",
      "Crimson Nylium",
    ],
    representative: "Crimson Planks",
  },
  {
    key: "group:wood-warped",
    name: "Warped",
    members: [
      "Warped Planks",
      "Warped Slab",
      "Warped Stairs",
      "Warped Stem",
      "Stripped Warped Stem",
      "Warped Hyphae",
      "Stripped Warped Hyphae",
      "Warped Fungus",
      "Warped Roots",
      "Warped Nylium",
    ],
    representative: "Warped Planks",
  },
  {
    key: "group:amethyst",
    name: "Amethyst",
    members: ["Amethyst Cluster", "Block of Amethyst", "Large Amethyst Bud", "Medium Amethyst Bud", "Small Amethyst Bud"]
  }
];

export interface GroupClassifier {
  groupKeyOfBlock: Map<string, string>;
  groupNameByKey: Map<string, string>;
  groupRepBlockByKey: Map<string, Block | null>;
  groupMembersByKey: Map<string, Block[]>;
}

export function buildGroupClassifier(blocks: Block[]): GroupClassifier {
  const blockByKey = new Map<string, Block>();
  for (const b of blocks) blockByKey.set(b.key, b);

  const groupKeyOfBlock = new Map<string, string>();
  const groupNameByKey = new Map<string, string>();
  const groupRepBlockByKey = new Map<string, Block | null>();
  const groupMembersByKey = new Map<string, Block[]>();

  for (const rule of GROUP_RULES) {
    const members: Block[] = [];
    for (const memberName of rule.members) {
      const k = norm(memberName);
      const block = blockByKey.get(k);
      if (!block) continue;

      const existing = groupKeyOfBlock.get(block.key);
      if (existing && existing !== rule.key) {
        throw new Error(
          `Block "${block.name}" claimed by two groups: ` +
            `"${groupNameByKey.get(existing) ?? existing}" and "${rule.name}". `
        );
      }

      groupKeyOfBlock.set(block.key, rule.key);
      block.groupKey = rule.key;
      block.groupName = rule.name;
      members.push(block);
    }

    if (members.length === 0) continue; // entire rule has no members in this dataset

    groupNameByKey.set(rule.key, rule.name);
    groupMembersByKey.set(rule.key, members);

    const repBlock = rule.representative
      ? blockByKey.get(norm(rule.representative)) ?? null
      : null;
    groupRepBlockByKey.set(rule.key, repBlock);
  }

  return {
    groupKeyOfBlock,
    groupNameByKey,
    groupRepBlockByKey,
    groupMembersByKey,
  };
}
