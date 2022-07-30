import Lyric from "./lyric";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  path: string;
  liked: boolean;
  lyrics: Lyric[];
}

export default Track;
