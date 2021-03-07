const electron = require('electron');

const { app, BrowserWindow, ipcMain } = electron;




app.on('ready', () => {
    console.log('App is now ready');
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        frame: false,
        fullscreen: true
    });


    mainWindow.maximize();
    mainWindow.loadURL('file://' + __dirname + '/UI/index.html');

    // ipcMain.on('invokeAction', function(event, data) {
    //     console.log("action invoked");
    //     event.sender.send('actionReply', 'reply from electron');

    //     const sideWindow = new BrowserWindow({
    //         webPreferences: {
    //             nodeIntegration: true
    //         },
    //         // frame: false,
    //         // fullscreen: true
    //     });
    //     // sideWindow.setMenu(null)

    //     sideWindow.loadURL('file://' + __dirname + '/UI/System_Modes.html');
    // });
});