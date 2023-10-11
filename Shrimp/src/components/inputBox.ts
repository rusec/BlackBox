import { FlexLayout, QLabel, QLineEdit, QPlainTextEdit, QWidget } from "@nodegui/nodegui";

export function inputBox(label: string, input_style: undefined | string | null): { inputBoxWidget: QWidget; getValue: () => string } {
    //to felid
    const fieldset = new QWidget();
    const fieldsetLayout = new FlexLayout();
    fieldset.setObjectName("fieldset");
    fieldset.setLayout(fieldsetLayout);

    // Number characters row
    const numCharsRow = new QWidget();
    const numCharsRowLayout = new FlexLayout();
    numCharsRow.setObjectName("numCharsRow");
    numCharsRow.setLayout(numCharsRowLayout);

    const numCharsLabel = new QLabel();
    numCharsLabel.setText(label);
    numCharsRowLayout.addWidget(numCharsLabel);

    const numCharsInput = new QLineEdit();
    numCharsInput.setObjectName("numCharsInput");
    numCharsRowLayout.addWidget(numCharsInput);
    input_style && numCharsInput.setStyleSheet(input_style);
    fieldset.setStyleSheet(`#fieldset {
         padding: 5px;
         margin-bottom: 1px;
       }
       #numCharsRow, #buttonRow {
         flex-direction: row;
       }
       #numCharsRow {
         margin-bottom: 5px;
       }
       #numCharsInput {
        background:#b3b7ba;

         width: 150px;
         margin-left: 4px;
       }`);

    fieldsetLayout.addWidget(numCharsRow);
    return {
        inputBoxWidget: fieldset,
        getValue: () => {
            return numCharsInput.text();
        },
    };
}
