export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  path: string;
  liked: boolean;
  lyrics: Lyric[];
}

export interface Lyric {
  time: number;
  text: string;
}

export default Track;