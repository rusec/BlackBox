import { QWidget, QLabel, FlexLayout, QPushButton, QMainWindow } from "@nodegui/nodegui";
import { top_bar } from "../components/top_bar";
import { inputBox } from "../components/inputBox";
import { textBox } from "../components/textBox";
import { attachment } from "../components/attachments";
import { createEmail } from "../modules/createPDF";
export default function email(win: QMainWindow) {
    const centralWidget = new QWidget();
    centralWidget.setObjectName("ir_template");

    const rootLayout = new FlexLayout();
    centralWidget.setLayout(rootLayout);

    const body = new QWidget();
    const body_layout = new FlexLayout();
    body.setObjectName("body");
    body.setLayout(body_layout);

    const label = new QLabel();
    label.setObjectName("title");
    label.setText("Create IR Report");

    const button_save = new QPushButton();
    button_save.setText("Save");
    button_save.addEventListener("clicked", () => {
        var values = {
            to: to_input.getValue(),
            from: from_input.getValue(),
            subject: subject.getValue(),
            body: body_input.getValue(),
            attachments: attachment_input.getValue(),
        };
        console.log(values);

        createEmail(values);

        // mainPage(getWin());
        // console.log(to_input.getValue());
    });
    rootLayout.addWidget(top_bar());

    const to_input = inputBox("To:", null);
    const from_input = inputBox("From:", null);
    const subject = inputBox("Subject: ", "");
    const body_input = textBox(
        "Body:",
        `font-size: 15px;
        font-weight: bold;
        padding: 1;
        margin-bottom: 2px;
        `
    );
    const attachment_input = attachment();

    body_layout.addWidget(label);
    body_layout.addWidget(to_input.inputBoxWidget);
    body_layout.addWidget(from_input.inputBoxWidget);
    body_layout.addWidget(subject.inputBoxWidget);
    body_layout.addWidget(body_input.textBoxWidget);
    body_layout.addWidget(attachment_input.attachmentWidget);
    body_layout.addWidget(button_save);
    body.setAcceptDrops(true);
    rootLayout.addWidget(body);

    centralWidget.setStyleSheet(
        `
      #email_template {
        background-color: #698291;
        height: auto;
      }
      #title {
        font-size: 20px;
        font-weight: bold;
        padding: 1;
      }
    `
    );
    win.setCentralWidget(centralWidget);
}
