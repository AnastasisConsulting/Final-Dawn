
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

interface Message {
    id: string;
    sender: string;
    content: string;
    type: 'text' | 'image' | 'system';
    timestamp: string;
}

export class CrashBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleDumpCore = () => {
        // Access the global log set by CenterPanel
        const logs = (window as any).__LATEST_CHAT_LOGS as Message[];

        let crashReport = `CRASH REPORT - ${new Date().toISOString()}\n`;
        crashReport += `ERROR: ${this.state.error?.message}\n`;
        crashReport += `STACK: ${this.componentDidCatch ? this.state.error?.stack : 'N/A'}\n`;
        crashReport += `\n----------------------------------------\n`;
        crashReport += `SYSTEM LOGS (LAST SESSION):\n\n`;

        if (logs && logs.length > 0) {
            crashReport += logs.map(m =>
                `[${m.timestamp}] ${m.sender.toUpperCase()}:\n${m.content}\n`
            ).join('\n----------------------------------------\n');
        } else {
            crashReport += "NO LOGS RECOVERED.";
        }

        const blob = new Blob([crashReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crash_core_dump_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Noir / Satire Crash Screen
            return (
                <div className="fixed inset-0 z-[9999] bg-black text-red-500 font-mono flex flex-col items-center justify-center p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent)] animate-pulse pointer-events-none" />

                    <div className="max-w-2xl w-full border border-red-900 bg-neutral-950/90 p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)] relative">
                        <h1 className="text-4xl font-bold tracking-widest mb-4 text-red-600 animate-pulse">CRITICAL SYSTEM FAILURE</h1>

                        <div className="text-xs text-red-400 mb-6 border-b border-red-900/50 pb-4">
                            EXCEPTION_UNHANDLED: {this.state.error?.message || 'UNKNOWN_FATAL_ERROR'}
                            <br />
                            See console for stack trace.
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="p-4 bg-red-950/20 border border-red-900/30 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                                {this.state.error?.stack}
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={this.handleDumpCore}
                                    className="flex-1 bg-red-900/20 border border-red-600 hover:bg-red-600 hover:text-white transition-all py-3 px-4 text-sm font-bold tracking-widest uppercase"
                                >
                                    DUMP_CORE_LOGS
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 hover:text-white transition-all py-3 px-4 text-sm font-bold tracking-widest uppercase text-neutral-500"
                                >
                                    SYSTEM_REBOOT
                                </button>
                            </div>
                        </div>

                        <div className="absolute bottom-2 right-2 text-[10px] text-red-900 opacity-50">
                            ERR_CODE: 0xDEADBEEF // FLIGHT_ONE_TERMINATED
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
