hookWebsocket = function () {
    window.mysocket = undefined;
    const nativeWebSocket = window.WebSocket;
    window.WebSocket = function (...args) {
        const socket = new nativeWebSocket(...args);
        window.mysocket = socket;
        window.mysocket.addEventListener('message', function (event) {
            let payload = event.data;
            window.postMessage({ message: "Douyin", data: payload }, '*');
        });
        return socket;
    };
}

hookWebsocket();