const serverUrl = document.getElementById("server_url");
const confirm = document.getElementById("confirm");
const debug = document.getElementById("debug");
const send = document.getElementById("send");

chrome.storage.local.get(["douyin_server", "douyin_debug", "douyin_send"]).then((result) => {
    if (result.douyin_server)
        serverUrl.value = result.douyin_server;
    if (result.douyin_debug)
        debug.checked = result.douyin_debug;
    if (result.douyin_send)
        send.checked = result.douyin_send;
});

confirm.addEventListener("click", () => {
    chrome.storage.local.set({
        douyin_server: serverUrl.value,
        douyin_debug: debug.checked,
        douyin_send: send.checked
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.reload(tabs[0].id);
    });
    window.close();
});