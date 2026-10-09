import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../utils/api';
import { Button, Spinner } from '../common';

export default function TerminalTab({ projectId, env }) {
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const [connectionKey, setConnectionKey] = useState(0);
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    let mounted = true;
    api('/terminal/status')
      .then((status) => {
        if (mounted) setEnabled(status.enabled);
      })
      .catch(() => {
        if (mounted) setEnabled(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (enabled !== true) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      theme: { background: '#020617' },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(
      `${protocol}://${window.location.host}/api/terminal?projectId=${encodeURIComponent(projectId)}`,
    );
    socketRef.current = socket;
    socket.onmessage = (event) => terminal.write(event.data);
    socket.onopen = () => {
      fitAddon.fit();
      socket.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
    };
    socket.onclose = () => {
      terminal.writeln('\r\n[연결이 종료되었습니다. 재연결을 눌러 주세요.]');
    };
    const sendResize = () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: 'resize', cols: terminal.cols, rows: terminal.rows }));
    };
    const resizeObserver = new ResizeObserver(sendResize);
    resizeObserver.observe(container);
    const dataSubscription = terminal.onData((data) => {
      if (socket.readyState === WebSocket.OPEN)
        socket.send(JSON.stringify({ type: 'input', data }));
    });

    return () => {
      resizeObserver.disconnect();
      dataSubscription.dispose();
      socket.close();
      socketRef.current = null;
      terminal.dispose();
    };
  }, [projectId, connectionKey, enabled]);

  const runCommand = () => {
    if (env?.run_command && socketRef.current?.readyState === WebSocket.OPEN) {
      env.run_command
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .forEach((line) =>
          socketRef.current.send(JSON.stringify({ type: 'input', data: `${line}\r` })),
        );
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => setConnectionKey((value) => value + 1)}
          disabled={enabled !== true}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          재연결
        </Button>
        {env?.run_command && (
          <Button
            onClick={runCommand}
            disabled={enabled !== true}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            실행 명령어 실행
          </Button>
        )}
      </div>
      {enabled === null ? (
        <Spinner />
      ) : enabled === false ? (
        <div role="status" className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
          <h3 className="mb-1 font-semibold">서버에서 비활성화됨</h3>
          <p>
            이 서버에서는 터미널이 비활성화되어 있습니다(TERMINAL_ENABLED=false). 터미널은 로컬
            PC에서 실행한 AI DevTracker에서 사용하세요.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="h-[70vh] rounded-xl bg-slate-950 p-2" />
      )}
    </div>
  );
}
