import { faArrowDown, faArrowUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isEmpty } from 'lodash';
import React, { useState } from 'react';

import "./Cell.css";


const JupyterCell = ({ id, text: initialText, updateCellText, addCell, onDelete, onMoveUp, onMoveDown, handleKeyDown, webSocketMessage, shiftExecutionCount }) => {
    const [text, setText] = useState(initialText);

    function sanitizeInput(input) {
        return input.replace(/\u00A0/g, ' ');
    }

    const handleChange = (event) => {
        const newText = event.target.innerText;
        setText(newText);
        updateCellText(id, sanitizeInput(newText));
    }

    const executionCount = () => {
        let executionData
        if (!isEmpty(webSocketMessage) && webSocketMessage?.length > 0) {
            let syntaxErrorFound = false;
            for (let i = 0; i < webSocketMessage.length; i++) {
                if (webSocketMessage[i].output.includes("syntax Error")) {
                    syntaxErrorFound = true;
                    continue;
                }
                if (syntaxErrorFound) {
                    if (shiftExecutionCount.includes(webSocketMessage[i].msg_id)) {
                        continue;
                    } else {
                     webSocketMessage[i].execution_count =''
                    }
                }
            }
        }

        const filteredMsg = webSocketMessage
            ?.filter((output) => output?.msg_id === id)
        if (!isEmpty(filteredMsg) && filteredMsg.length > 0) {
            executionData =
                <>
                    <span className='execution-color'></span>
                    <span className='execution-count-wrapper'>{'[' + filteredMsg[0].execution_count + ']:'}</span>
                </>
        } else {
            executionData =
                <>
                    <span className='execution-color'></span>
                    <span className='execution-count-wrapper'>{'[]:'}</span>
                </>
        }

        return executionData;
    }

    const websocketOutput = () => {
        const output = webSocketMessage
            ?.filter((output) => output?.msg_id === id)
            ?.map((item) => (
                <div className='output-msg'>{item?.output}</div>
            ))
        return output;
    }

    return (
        <>
            <div class='outer-wrapper'>
                {executionCount()}
                <div className='cell-wrapper'>
                    <div
                        value={text}
                        onInput={handleChange}
                        onKeyDown={handleKeyDown}
                        contentEditable
                        className='cell-text'
                        id={id}
                    />
                    <span className='cell-icons-wrapper'>
                        <FontAwesomeIcon icon={faPlus} onClick={addCell} className='cell-icons' />
                        <FontAwesomeIcon icon={faTrash} onClick={onDelete} className='cell-icons' />
                        <FontAwesomeIcon icon={faArrowUp} onClick={onMoveUp} className='cell-icons' />
                        <FontAwesomeIcon icon={faArrowDown} onClick={onMoveDown} className='cell-icons' />
                    </span>
                    {websocketOutput()}
                </div>
            </div>

        </>
    );
};

export default JupyterCell;
