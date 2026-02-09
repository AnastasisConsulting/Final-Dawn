
export const getStyles = (embedded: boolean) => `
  .visualizer-container {
    position: ${embedded ? 'relative' : 'absolute'};
    top: 0; left: 0; width: 100%; height: ${embedded ? '100%' : '100vh'};
    background: radial-gradient(circle at center, #111 0%, #000 100%);
    overflow: hidden; user-select: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  #canvas-container { width: 100%; height: 100%; position: absolute; z-index: 1; }
  .ui-overlay {
    position: absolute; bottom: 3rem; left: 50%; transform: translateX(-50%);
    z-index: 10; display: flex; flex-direction: column; align-items: center;
    gap: 1.5rem; width: 300px; pointer-events: none; transition: opacity 0.3s;
  }
  .button-row { display: flex; justify-content: center; gap: 1.5rem; pointer-events: auto; }
  .expand-btn {
    width: auto; padding: 12px 24px; background: rgba(0, 0, 0, 0.5);
    border: 1px solid #00ffcc; color: #00ffcc; border-radius: 22px;
    font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
    font-size: 12px; cursor: pointer; transition: all 0.2s ease;
  }
  .expand-btn:hover { background: rgba(0, 255, 204, 0.1); box-shadow: 0 0 15px rgba(0, 255, 204, 0.3); }
  .tooltip {
    position: absolute; padding: 8px 12px; background: rgba(0, 0, 0, 0.8);
    border: 1px solid #00ffcc; color: #00ffcc; font-size: 14px; border-radius: 4px;
    pointer-events: none; z-index: 20; white-space: nowrap;
    box-shadow: 0 0 10px rgba(0, 255, 204, 0.2); transform: translate(-50%, -100%);
    margin-top: -15px; display: none;
  }
  .side-panel {
    position: absolute; top: 0; right: 0; width: 350px; height: 100%;
    background: rgba(10, 10, 10, 0.9); backdrop-filter: blur(15px);
    border-left: 1px solid #333; z-index: 30; transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    display: flex; flex-direction: column; padding: 30px; box-sizing: border-box;
    color: #eee; pointer-events: auto; overflow-y: auto;
  }
  .side-panel.open { transform: translateX(0); }
  .side-panel h2 { margin: 0 0 10px 0; font-size: 20px; color: #00ffcc; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #333; padding-bottom: 10px; }
  .face-info { font-size: 14px; color: #aaa; margin-bottom: 20px; font-family: monospace; }
  .panel-content p { margin: 10px 0; font-size: 14px; color: #888; }
  .panel-content span { color: #fff; font-weight: bold; }
  .data-graph { margin-top: 15px; height: 4px; background: #333; width: 100%; position: relative; overflow: hidden; }
  .data-graph::after { content: ''; position: absolute; top: 0; left: 0; height: 100%; width: 60%; background: #00ffcc; box-shadow: 0 0 10px #00ffcc; }

  /* Glitch Text */
  .glitch-container {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; text-align: center;
  }
  .glitch-title {
    font-size: 32px; font-weight: bold; color: #fff; text-transform: uppercase;
    position: relative; letter-spacing: 4px; margin-bottom: 20px;
  }
  .glitch-title::before, .glitch-title::after {
    content: 'EIDEUS DAWN'; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10, 10, 10, 0.9);
  }
  .glitch-title::before {
    left: 2px; text-shadow: -1px 0 #ff00c1; clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim 5s infinite linear alternate-reverse;
  }
  .glitch-title::after {
    left: -2px; text-shadow: -1px 0 #00fff9; clip: rect(44px, 450px, 56px, 0);
    animation: glitch-anim2 5s infinite linear alternate-reverse;
  }
  @keyframes glitch-anim {
    0% { clip: rect(10px, 9999px, 30px, 0); }
    20% { clip: rect(80px, 9999px, 100px, 0); }
    40% { clip: rect(40px, 9999px, 60px, 0); }
    60% { clip: rect(20px, 9999px, 10px, 0); }
    80% { clip: rect(50px, 9999px, 90px, 0); }
    100% { clip: rect(30px, 9999px, 50px, 0); }
  }
  @keyframes glitch-anim2 {
    0% { clip: rect(60px, 9999px, 10px, 0); }
    20% { clip: rect(20px, 9999px, 40px, 0); }
    40% { clip: rect(90px, 9999px, 30px, 0); }
    60% { clip: rect(10px, 9999px, 70px, 0); }
    80% { clip: rect(30px, 9999px, 20px, 0); }
    100% { clip: rect(70px, 9999px, 60px, 0); }
  }
  .hover-info {
    margin-top: 30px; border: 1px solid #333; padding: 15px; width: 100%;
    background: rgba(0,0,0,0.5); text-align: left;
  }
  .hover-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
  .hover-value { font-size: 16px; color: #00ffcc; font-family: monospace; }
  .hover-path { font-size: 12px; color: #888; margin-bottom: 10px; }

  /* List View Styles */
  .list-container { display: flex; flex-direction: column; gap: 5px; }
  .list-item { 
    padding: 10px; border: 1px solid #222; background: rgba(255,255,255,0.02);
    cursor: pointer; color: #ccc; transition: all 0.2s; font-size: 14px;
  }
  .list-item:hover { border-color: #00ffcc; color: #fff; background: rgba(0, 255, 204, 0.05); }

  /* Detail View Styles */
  .detail-view { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  
  .back-btn { 
    background: transparent; border: none; color: #888; cursor: pointer; 
    padding: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;
    align-self: flex-start; margin-bottom: 5px;
  }
  .back-btn:hover { color: #00ffcc; }

  .info-block { margin-bottom: 5px; }
  .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .value { font-size: 14px; color: #fff; word-break: break-all; }
  .monospace { font-family: monospace; color: #00ffcc; }

  .direction-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  .direction-box { 
    background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 10px; 
    display: flex; flex-direction: column; gap: 4px;
  }
  .direction-label { font-size: 9px; color: #888; text-transform: uppercase; font-weight: bold; }
  .direction-value { font-size: 12px; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;
