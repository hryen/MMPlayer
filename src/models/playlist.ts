import { Track } from "@/models/track";

export interface PlayList {
  id: string;
  name: string;
  path: string;
  tracks: Track[];
}
