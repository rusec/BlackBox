import { FlexLayout, QLabel, QListWidget, QListWidgetItem, QPushButton, QWidget, QDialog, QFileDialog, FileMode } from "@nodegui/nodegui";
import fs from "fs";
export function attachment(): { attachmentWidget: QWidget; getValue: () => string[] } {
    const fieldset = new QWidget();
    const fieldsetLayout = new FlexLayout();
    fieldset.setObjectName("attachmentFelid");
    fieldset.setLayout(fieldsetLayout);

    const attachment_row = new QWidget();
    const attachment_rowLayout = new FlexLayout();
    attachment_row.setObjectName("numCharsRow");
    attachment_row.setLayout(attachment_rowLayout);

    const attachmentLabel = new QLabel();
    attachmentLabel.setText("Attachments");
    attachment_rowLayout.addWidget(attachmentLabel);
    // attachmentLabel.setStyleSheet();

    const fileInput = new QPushButton();
    fileInput.setText("Upload File");
    const fileList = new QListWidget();
    fileList.setObjectName("files");
    attachment_rowLayout.addWidget(fileInput);
    attachment_rowLayout.addWidget(fileList);

    fileInput.addEventListener("clicked", () => {
        const filePaths = new QFileDialog();
        filePaths.setFileMode(FileMode.AnyFile);
        filePaths.setNameFilter("Images (*.png *.xpm *.jpg)");
        const code = filePaths.exec();
        const selectedFiles = filePaths.selectedFiles();
        if (code && selectedFiles && selectedFiles.length > 0) {
            selectedFiles.forEach((filePath: string) => {
                const fileWidget = new QListWidgetItem();
                let split_path = filePath.split("/");
                fileWidget.setText(split_path[split_path.length - 1]);
                fileWidget.setWhatsThis(filePath);
                return fileList.addItem(fileWidget);
            });
        }
    });
    fileList.addEventListener("itemDoubleClicked", (item) => {
        const selectedFiles = fileList.selectedItems();
        fileList.takeItem(fileList.row(selectedFiles[0]));
    });

    fieldsetLayout.addWidget(attachment_row);
    fieldset.setStyleSheet(`
    #files{
        height:60px;
    }
    `);

    return {
        attachmentWidget: fieldset,
        getValue: () => {
            let list = [];
            for (let x = 0; x < fileList.count(); x++) {
                list.push(fileList.item(x).whatsThis());
            }
            return list;
        },
    };
}
