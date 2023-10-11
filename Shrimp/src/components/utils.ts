import { QMainWindow, QWidget } from "@nodegui/nodegui";


export ={
    updateWin: (win: QMainWindow, page: QWidget) =>{
        win.setCentralWidget(page);
    }
}