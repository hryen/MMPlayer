export interface Track {
  title: string;
  artist: string;
  album: string;
  path: string;
  lyricsList: Lyrics[];
}

export interface Lyrics {
  time: string;
  text: string;
}