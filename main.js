const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const windowStateKeeper = require("electron-window-state");
const path = require("path");

let mainWindow;
function createMainWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1152,
    defaultHeight: 720,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1152,
    minHeight: 720,
    show: false,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // webSecurity: true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  mainWindowState.manage(mainWindow);

  mainWindow.loadFile(path.join(__dirname, "dist-html", "index.html"));
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }
}

Menu.setApplicationMenu(null);

// 设置任务栏缩略图按钮
function setThumbarButtons(isPlaying) {
  mainWindow.setThumbarButtons([
    {
      tooltip: "上一曲",
      icon: path.join(__dirname, "dist-html", "assets", "playPrev.png"),
      click() {
        mainWindow.webContents.send("playPrev");
      },
    },
    {
      tooltip: isPlaying ? "暂停" : "播放",
      icon: isPlaying
        ? path.join(__dirname, "dist-html", "assets", "pause.png")
        : path.join(__dirname, "dist-html", "assets", "play.png"),
      click() {
        mainWindow.webContents.send("playPause");
      },
    },
    {
      tooltip: "下一曲",
      icon: path.join(__dirname, "dist-html", "assets", "playNext.png"),
      click() {
        mainWindow.webContents.send("playNext");
      },
    },
  ]);
}

app.whenReady().then(() => {
  createMainWindow();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.send("rendered");
    setThumbarButtons(false);
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("minimize", (event, arg) => {
  mainWindow.minimize();
});
ipcMain.on("maximize", (event, arg) => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  event.reply("maximize-reply", mainWindow.isMaximized());
});
ipcMain.on("quit", (event, arg) => {
  app.quit();
});

// 选择文件夹，并返回文件夹路径，arg：true为多选 false为单选
ipcMain.on("dialogOpenDirectory", (event, arg) => {
  let properties = ["openDirectory"];
  if (arg) {
    properties.push("multiSelections");
  }
  dialog
    .showOpenDialog({ properties: properties })
    .then((result) => {
      event.reply("dialogOpenDirectory-reply", result);
    })
    .catch((err) => {
      console.log(err);
    });
});

// 选择文件，返回文件路径
ipcMain.on("dialogSaveFile", (event, arg) => {
  dialog
    .showOpenDialog({ properties: ["openFile", "promptToCreate"] })
    .then((result) => {
      event.reply("dialogSaveFile-reply", result);
    })
    .catch((err) => {
      console.log(err);
    });
});

// 删除歌单对话框，传入的是提示的消息内容，返回0代表确定，1代表取消
ipcMain.on("dialogDeletePlaylist", (event, arg) => {
  dialog
    .showMessageBox({
      type: "question",
      title: "提示",
      message: "确定要删除该歌单吗？",
      buttons: ["确定", "取消"],
      cancelId: 1,
    })
    .then((result) => {
      event.reply("dialogDeletePlaylist-reply", result.response, arg);
    });
});

// 歌曲 右键菜单
ipcMain.on("showTrackMenu", (event, arg) => {
  const template = [
    {
      label: "播放",
      click: () => {
        event.sender.send("showTrackMenu-reply", "play", arg);
      },
    },
    {
      label: "在文件资源管理器中显示",
      click: () => {
        event.sender.send("showTrackMenu-reply", "locateInExplorer", arg);
      },
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

// 播放列表 右键菜单
ipcMain.on("showPlaylistMenu", (event, arg) => {
  const template = [
    {
      label: "重新扫描歌曲",
      click: () => {
        event.sender.send("showPlaylistMenu-reply", "refresh", arg);
      },
    },
    {
      label: "打开目录",
      click: () => {
        event.sender.send("showPlaylistMenu-reply", "locateInExplorer", arg);
      },
    },
    {
      label: "删除",
      click: () => {
        event.sender.send("showPlaylistMenu-reply", "delete", arg);
      },
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

// 点击了播放或暂停按钮，更新任务栏缩略图按钮的图标
ipcMain.on("changePlayStatus", (_event, arg) => {
  setThumbarButtons(arg);
});
