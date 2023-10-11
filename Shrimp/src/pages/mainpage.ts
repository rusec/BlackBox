import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QIcon } from "@nodegui/nodegui";
import logo from "../../assets/logox200.png";
import { getWin } from "..";
import email from "./email";
import { top_bar } from "../components/top_bar";

export default function mainPage(win: QMainWindow) {
    const centralWidget = new QWidget();
    centralWidget.setObjectName("myroot");
    const rootLayout = new FlexLayout();
    centralWidget.setLayout(rootLayout);

    const body = new QWidget();
    const bodyLayout = new FlexLayout();
    body.setObjectName("body");
    body.setLayout(bodyLayout);

    const label = new QLabel();
    label.setObjectName("mylabel");
    label.setText("Hello");

    const email_btn = new QPushButton();
    email_btn.setObjectName("btn");
    email_btn.setIcon(new QIcon(logo));
    email_btn.addEventListener("clicked", () => {
        email(getWin());
    });
    const ir_btn = new QPushButton();
    ir_btn.setObjectName("btn");
    ir_btn.setIcon(new QIcon(logo));
    ir_btn.addEventListener("clicked", () => {
        email(getWin());
    });

    const label2 = new QLabel();
    label2.setText("World");
    label2.setInlineStyle(`
  color: red;
`);
    body.setStyleSheet(`
    #body{

    }
    #mylabel {
        font-size: 16px;
        font-weight: bold;
        padding: 1;
    }
    
    #btn{
        background-color: #f44336; /* Green */
      border: none;
      color: white;
      padding: 15px 32px;
      text-align: center;
      text-decoration: none;
      font-size: 16px;
    }`);
    rootLayout.addWidget(top_bar());

    bodyLayout.addWidget(label);
    bodyLayout.addWidget(email_btn);
    bodyLayout.addWidget(ir_btn);
    bodyLayout.addWidget(label2);
    rootLayout.addWidget(body);

    centralWidget.setStyleSheet(`
    #myroot {
        background:#e6bcb1;
        width: 600px;
        height: 700px;
        color: black;
    }
   
    `);
    win.setCentralWidget(centralWidget);
}
