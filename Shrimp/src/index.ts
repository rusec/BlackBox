import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon } from "@nodegui/nodegui";
import mainPage from "./pages/mainpage";

const win = new QMainWindow();
win.setWindowTitle("Letter Heads");
win.setObjectName("root");
mainPage(getWin());

win.setStyleSheet(`#root{
  font-family: "Times New Roman";
  padding: none;
  height: auto;
  width: auto;
}
  `);

win.show();

export function getWin() {
    return win;
}

(global as any).win = win;
