import { FlexLayout, QBoxLayout, QGridLayout, QLabel, QLayout, QMainWindow, QMenuBar, QPushButton, QWidget } from "@nodegui/nodegui";
import mainPage from "../pages/mainpage";
import { getWin } from "..";
import email from "../pages/email";

export function top_bar(): QWidget {
    const top_bar = new QWidget();
    top_bar.setObjectName("menu");
    const top_bar_layout = new FlexLayout();
    top_bar.setLayout(top_bar_layout);

    const home = new QPushButton();
    home.setObjectName("menuBtn");
    home.setText("Home");
    home.addEventListener("clicked", () => {
        mainPage(getWin());
    });
    const email_btn = new QPushButton();
    email_btn.setObjectName("menuBtn");
    email_btn.setText("Email");
    email_btn.addEventListener("clicked", () => {
        email(getWin());
    });
    top_bar_layout.addWidget(home);
    top_bar_layout.addWidget(email_btn);

    top_bar.setStyleSheet(`
    #menu{
        flex-direction: "row";
        background:#324e5e;
        margin:0px;
        color: #000000;
        padding:0px;
    }
    #menuBtn{
        background: none;
        border: none;
        padding:10px;
        padding-right: 10px;
        padding-left: 10px;
        color:#000000;
    }
    #menuBtn:hover{
        background: #6399b8;
        opacity: 0.4;
    }
    `);

    return top_bar;
}
