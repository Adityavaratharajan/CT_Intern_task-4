// Function to send logs to backend
function sendLogsToBackend() {
  chrome.storage.local.get(["timeLogs"], (result) => {
    const logs = result.timeLogs || {};
    const logsArray = Object.entries(logs).map(([url, timeSpent]) => ({
      url,
      timeSpent,
      date: new Date(),
    }));
    if (logsArray.length === 0) return;
    fetch("http://localhost:3000/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "123", logs: logsArray }),
    })
      .then((res) => res.json())
      .then(() => {
        // Optionally clear logs after sending
        // chrome.storage.local.set({ timeLogs: {} });
      })
      .catch((err) => console.error("Failed to sync logs:", err));
  });
}

// Send logs every 10 seconds (for testing)
setInterval(sendLogsToBackend, 10 * 1000);

// Also send logs when the extension is unloaded (browser close, etc.)
chrome.runtime.onSuspend.addListener(sendLogsToBackend);
let activeTabId = null;
let startTime = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const now = Date.now();
  if (activeTabId && startTime) {
    const duration = now - startTime;
    try {
      const tab = await chrome.tabs.get(activeTabId);
      if (tab && tab.url) {
        chrome.storage.local.get(["timeLogs"], (result) => {
          const logs = result.timeLogs || {};
          const url = tab.url;
          logs[url] = (logs[url] || 0) + duration / 1000;
          chrome.storage.local.set({ timeLogs: logs });
        });
      }
    } catch (e) {
      // Tab may not exist anymore; ignore this error
    }
  }
  activeTabId = activeInfo.tabId;
  startTime = now;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTimeLogs") {
    chrome.storage.local.get(["timeLogs"], (result) => {
      sendResponse(result.timeLogs || {});
    });
    return true; // Indicates async response
  }
});
