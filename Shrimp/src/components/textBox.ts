import {
    FlexLayout,
    Key,
    QCursor,
    QKeySequence,
    QLabel,
    QKeyEvent,
    QLineEdit,
    QPlainTextEdit,
    QTextEdit,
    QWidget,
    WidgetEventTypes,
} from "@nodegui/nodegui";
import spellchecker from "spellchecker";

export function textBox(label: string, label_css: string): { textBoxWidget: QWidget; getValue: () => string } {
    //to felid
    const fieldset = new QWidget();
    const fieldsetLayout = new FlexLayout();
    fieldset.setObjectName("textFelid");
    fieldset.setLayout(fieldsetLayout);

    // Number characters row
    const numCharsRow = new QWidget();
    const textBoxLayout = new FlexLayout();
    numCharsRow.setObjectName("numCharsRow");
    numCharsRow.setLayout(textBoxLayout);

    const numCharsLabel = new QLabel();
    numCharsLabel.setText(label);
    textBoxLayout.addWidget(numCharsLabel);
    numCharsLabel.setStyleSheet(label_css);

    const textBoxInput = new QTextEdit();
    textBoxInput.setObjectName("numCharsInput");
    textBoxLayout.addWidget(textBoxInput);

    textBoxInput.addEventListener("textChanged", () => {
        let text = textBoxInput.toPlainText();
        let checks = spellchecker.checkSpelling(text);
        if (checks.length === 0) {
            spell_check.setText("");
        } else {
            let top_word = text.substring(checks[0].start, checks[0].end);
            let new_word = spellchecker.getCorrectionsForMisspelling(top_word);
            spell_check.setText(`Words Wrong: ${checks.length} | Word: ${top_word} Suggested: ${new_word[0] ? new_word[0] : ""}`);
        }
    });
    const spell_check = new QLabel();
    spell_check.setText("");
    textBoxLayout.addWidget(spell_check);

    fieldset.setStyleSheet(`#textFelid {
       

         padding: 5px;
         margin-bottom: 1px;
       }
    
       #numCharsRow {
         margin-bottom: 5px;
       }
       #numCharsInput {
        background:#b3b7ba;
         margin-left: 4px;
       }`);

    fieldsetLayout.addWidget(numCharsRow);
    return {
        textBoxWidget: fieldset,
        getValue: () => {
            return textBoxInput.toPlainText();
        },
    };
}
