export interface Track {
  title: string;
  artist: string;
  album: string;
  path: string;
  lyrics: Lyric[];
}

export interface Lyric {
  time: number;
  text: string;
}