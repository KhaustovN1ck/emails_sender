import {SSEHandler} from "./types/sse-handler.ts";

class SSEListener {

    private eventSource = new EventSource('http://localhost:3000/mailer/status');
    private subscriptions: SSEHandler[] = [];

    constructor() {
        this.eventSource.onmessage = (event) => {
            this.subscriptions.forEach(s => {
                s.onMessage(event);
            })
        };

        this.eventSource.onerror =  (event) => {
            this.subscriptions.forEach(s => {
                s.onError(event);
            })
        };
    }

    unsubscribe(handler: SSEHandler) {
        this.subscriptions = this.subscriptions.filter(s => s !== handler);
    }
    subscribe(handler: SSEHandler) {
        this.subscriptions.push(handler);
    }
}

export default new SSEListener();