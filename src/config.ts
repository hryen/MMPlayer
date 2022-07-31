const path = require("path");

const config = {
  DatabaseFile: path.resolve(process.cwd(), "tools", "data.db") as string,

  PlayerSettingsFile: path.resolve(
    process.cwd(),
    "PlayerSettings.json"
  ) as string,

  MusicToolsFile: path.resolve(
    process.cwd(),
    "tools",
    "musicTool.exe"
  ) as string,

  defaultCoverImage: "./assets/album_black_48dp.svg" as string,
};

export default config;
