import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import "./App.css";
import jupyter from "./Assets/jupyter.svg";
import Notebook from "./Templates/NoteBook";

//jupyter notebook --NotebookApp.allow_origin='http://localhost:3000'

function App() {
  const [webSocket, setWebSocket] = useState(null);
  const [webSocketMessage, setWebSocketMessage] = useState([]);
  const session_id = uuidv4();
  const kernel_id = "1befe7d0-97ef-4565-88cb-3198a9f91b00";

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(
        `ws://localhost:8888/api/kernels/${kernel_id}/channels?session_id=${session_id}`
      );

      ws.onopen = () => {
        console.log("WebSocket connection open");
      };

      ws.onmessage = (event) => {
        console.log("Message received:", event.data);
        const {
          content: {
            text = "",
            execution_count = "",
            evalue,
            status,
            execution_state,
          } = {},
          parent_header: { msg_id = "" } = {},
        } = JSON.parse(event?.data) || {};

        if (!execution_state) {
          setWebSocketMessage((prevData) => {
            if (!Array.isArray(prevData)) {
              prevData = [];
            }

            const existingMessageIndex = prevData?.findIndex(
              (data) => data.msg_id === msg_id
            );

            if (existingMessageIndex !== -1) {
              // If msg_id exists in prevData, update the existing message
              const updatedData = [...prevData];
              updatedData[existingMessageIndex] = {
                ...prevData[existingMessageIndex],
                output:
                  text !== ""
                    ? text
                    : evalue
                    ? `syntax Error:${evalue}`
                    : prevData[existingMessageIndex].output,
                execution_count:
                  execution_count !== "" && ["ok", "error"].includes(status)
                    ? execution_count
                    : prevData[existingMessageIndex].execution_count,
              };
              return updatedData;
            }
          });
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event);
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      setWebSocket(ws);
    };

    connectWebSocket();
  }, []);

  const sendMessage = (message) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify(message[0]));
      setWebSocketMessage((prevcells) => {
        if (!Array.isArray(prevcells)) {
          prevcells = [];
        }
        return [
          ...prevcells,
          {
            msg_id: message[0].header.msg_id,
            output: "",
            execution_count: "*",
          },
        ];
      });
    } else {
      console.error("WebSocket connection not established.");
    }
  };

  const sendAllMessages = (messages) => {
    setWebSocketMessage([]);
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      messages.forEach((element) => {
        webSocket.send(JSON.stringify(element));
        setWebSocketMessage((prevcells) => {
          if (!Array.isArray(prevcells)) {
            prevcells = [];
          }
          return [
            ...prevcells,
            { msg_id: element.header.msg_id, output: "", execution_count: "*" },
          ];
        });
      });
    }
  };

  return (
    <div className="App">
      <div className="app-header">
        <img src={jupyter} alt="example" />
      </div>
      <div>
        <Notebook
          sendMessage={sendMessage}
          sessionId={session_id}
          webSocketMessage={webSocketMessage}
          sendAllMessages={sendAllMessages}
          setWebSocketMessage={setWebSocketMessage}
        />
      </div>
    </div>
  );
}

export default App;
