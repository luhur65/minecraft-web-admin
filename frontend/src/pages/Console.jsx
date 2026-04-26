import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../api';

export default function Console() {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);

    const socket = io(socketUrl, {
      auth: { token }
    });

    socket.on('console_log', (data) => {
      setLogs((prev) => [...prev, data.log].slice(-100)); // Keep last 100 lines
    });

    socket.on('connect_error', (err) => {
      setLogs((prev) => [...prev, `Socket Error: ${err.message}`]);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const executeCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmdToRun = command;
    setCommand('');
    setLogs((prev) => [...prev, `> /${cmdToRun}`]);

    try {
      const res = await api.post('/command', { command: cmdToRun });
      if (res.data.response) {
        setLogs((prev) => [...prev, res.data.response]);
      }
    } catch (err) {
      setLogs((prev) => [...prev, `Error: Failed to execute command`]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
      <h2 className="text-2xl font-bold">Live Console</h2>

      <div className="flex-1 bg-black rounded-lg border border-gray-700 p-4 font-mono text-sm overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Waiting for logs...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-gray-300 break-words whitespace-pre-wrap">{log}</div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={executeCommand} className="flex space-x-2">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Enter command (e.g., say Hello World)"
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 font-mono"
        />
        <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium">
          Send
        </button>
      </form>
    </div>
  );
}
