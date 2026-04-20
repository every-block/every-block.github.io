export type Rgb = readonly [number, number, number];

export interface Block {
  name: string;
  key: string;
  id: string;
  version: string;
  rgb: Rgb;
  imageUrl: string;
  imageFrameHeight?: number;
  image: HTMLImageElement | null | false;
  groupKey?: string;
  groupName?: string;
}

export interface Response {
  timestamp: number;
  rawBlock: string;
}

export interface Vote {
  timestamp: number;
  block: Block;
}

export interface DataBundle {
  blocks: Block[];
  blockByKey: Map<string, Block>;
  votes: Vote[];
  startTime: number;
  endTime: number;
  unmatched: string[];
  groupClassifier: import("@/data/block-groups").GroupClassifier;
}
