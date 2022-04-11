import { Track } from "@/models/track";

export interface PlayList {
  id: number;
  path: string;
  tracks: Track[];
}
