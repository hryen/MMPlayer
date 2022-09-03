const path = require("path");

export const config = {
  UserDataPath: "",
  DatabaseFile: "",
  PlayerSettingsFile: "",

  MusicToolsFile: path.resolve(
    process.cwd(),
    "tools",
    "musicTool.exe"
  ) as string,

  defaultCoverImage: "./assets/album_black_48dp.svg" as string,
};

export function initConfig(userDataPath: string) {
  config.UserDataPath = userDataPath;

  config.DatabaseFile = path.resolve(
    userDataPath,
    "data.db"
  ) as string;

  config.PlayerSettingsFile = path.resolve(
    userDataPath,
    "PlayerSettings.json"
  ) as string;
}
