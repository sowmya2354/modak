// components/Notebook.js
import { isEmpty } from 'lodash';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Cell from '../Atoms/Cell';
import './Notebook.css';


const Notebook = ({ sendMessage, sessionId, webSocketMessage, sendAllMessages, setWebSocketMessage }) => {
    const msgId = uuidv4()
    const cellId = uuidv4()
    const message = {
        "header": {
            "msg_id": msgId,
            "username": "",
            "session": sessionId,
            "msg_type": "execute_request",
            "version": "5.3"
        },
        "metadata": {},
        "content": {
            "cellId": cellId,
            "code": '',
            "silent": false,
            "store_history": true,
            "user_expressions": {},
            "allow_stdin": false,
            "stop_on_error": true
        },
        "buffers": [],
        "parent_header": {},
        "channel": "shell"
    }
    const [cells, setCells] = useState([message]);
    const [shiftExecutionCount, setShiftExecutionCount] = useState([])

    const updateCellText = (id, newText) => {
        setCells(prevCells => prevCells.map(cell => {
            if (cell?.header?.msg_id === id) {
                return { ...cell, content: { ...cell.content, code: newText } };
            }
            return cell;
        }));
    };

    const addCell = () => {
        setCells([...cells, message]);
    };

    const deleteCell = (id) => {
        setCells(cells.filter(cell => cell?.header?.msg_id !== id));
    };

    const moveCellUp = (id) => {
        const index = cells.findIndex(cell => cell?.header?.msg_id === id);
        if (index > 0) {
            const newCells = [...cells];
            [newCells[index], newCells[index - 1]] = [newCells[index - 1], newCells[index]];
            setCells(newCells);
        }
    };

    const moveCellDown = (id) => {
        const index = cells.findIndex(cell => cell?.header?.msg_id === id);
        if (index < cells.length - 1) {
            const newCells = [...cells];
            [newCells[index], newCells[index + 1]] = [newCells[index + 1], newCells[index]];
            setCells(newCells);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.shiftKey) {
            if (!isEmpty(webSocketMessage) && webSocketMessage.filter((item) => item.msg_id === event.target.id).length > 0) {
                let messageIndex
                const websocketData = webSocketMessage?.filter((item) => item.msg_id !== event.target.id)
                cells?.forEach((msgToUpdate, index) => {
                    if (msgToUpdate
                        .header.msg_id === event.target.id.toString()) {
                        msgToUpdate.header.code = event.target.innerText;
                        msgToUpdate.header.msg_id = uuidv4();
                        messageIndex = index;
                    }
                });
                setCells(cells)
                setWebSocketMessage(websocketData)
                sendMessage([cells[messageIndex]])
                setShiftExecutionCount((prevdata) => [...prevdata, cells?.[messageIndex]?.header?.msg_id])
            } else {
                const message = cells.filter((cell) => cell?.header?.msg_id === event.target.id)
                setShiftExecutionCount((prevdata) => [...prevdata, message[0]?.header?.msg_id])
                sendMessage(message)

            }
            addCell()
        }
    };

    const runAllMessages = () => {
        const newCells = cells.map((cell) => {
            return { ...cell, header: { ...cell.header, msg_id: uuidv4() } }
        })
        setCells(newCells)
        sendAllMessages(newCells.filter((cell) => cell.content.code !== ''))
    }

    return (
        <>
            <div className='btn-wrapper'>
                <button className='btn' onClick={runAllMessages}>Run All</button>
            </div>
            <div className="notebook">
                <div className="cells">
                    {cells?.map((cell) => (
                        <React.Fragment key={cell?.content.cellId}>
                            <Cell
                                id={cell?.header?.msg_id}
                                text={cell.content}
                                updateCellText={updateCellText}
                                addCell={addCell}
                                onDelete={() => deleteCell(cell?.header?.msg_id)}
                                onMoveUp={() => moveCellUp(cell?.header?.msg_id)}
                                onMoveDown={() => moveCellDown(cell?.header?.msg_id)}
                                sendMessage={sendMessage}
                                handleKeyDown={handleKeyDown}
                                webSocketMessage={webSocketMessage}
                                cells={cells}
                                shiftExecutionCount={shiftExecutionCount}
                            />
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Notebook;