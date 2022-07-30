import Track from "./track";

export interface Playlist {
  id: string;
  name: string;
  path: string;
  tracks: Track[];
}

export default Playlist;
