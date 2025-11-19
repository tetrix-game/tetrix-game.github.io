// Simple crash overlay that bypasses React error boundaries
const showCrashOverlay = (errorMessage: string) => {
  // Remove any existing crash overlay
  const existingOverlay = document.getElementById('crash-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Create crash overlay element
  const overlay = document.createElement('div');
  overlay.id = 'crash-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #cccccc;
      color: #333333;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: var(--z-critical);
      font-family: Arial, sans-serif;
      font-size: 16px;
      text-align: center;
      padding: 40px;
      box-sizing: border-box;
      overflow: hidden;
    ">
      <div style="
        background-color: #f5f5f5;
        padding: 60px;
        border: 1px solid #999999;
        max-width: 600px;
        width: 100%;
      ">
        <h1 style="
          font-size: 24px;
          margin: 0 0 30px 0;
          color: #666666;
          font-weight: normal;
        ">
          Application Error
        </h1>
        
        <div style="
          background-color: #eeeeee;
          padding: 20px;
          border: 1px solid #dddddd;
          margin: 20px 0;
          text-align: left;
          font-family: monospace;
          font-size: 14px;
          color: #555555;
        ">
          <strong>Error Details:</strong><br/>
          ${errorMessage}
        </div>
        
        <p style="
          font-size: 14px;
          color: #777777;
          margin: 30px 0;
          line-height: 1.5;
        ">
          The application has encountered an error and cannot continue. 
          Please refresh the page to restart the application.
        </p>
        
        <button 
          onclick="location.reload()"
          style="
            background-color: #e0e0e0;
            color: #333333;
            border: 1px solid #999999;
            padding: 12px 24px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 20px;
          "
        >
          Refresh Page
        </button>
        
        <div style="
          margin-top: 40px;
          font-size: 12px;
          color: #aaaaaa;
          border-top: 1px solid #dddddd;
          padding-top: 20px;
        ">
          If this problem persists, maybe try not clicking that button so much next time.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Disable all interactions with the page
  document.body.style.overflow = 'hidden';
  document.body.style.pointerEvents = 'none';
  overlay.style.pointerEvents = 'all'; // Allow interactions only with the overlay
};

export { showCrashOverlay };