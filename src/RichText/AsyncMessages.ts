class AsyncMessages {
  subscriptions: { [key: string]: Function[] } = {};
  constructor() {
    this.subscriptions = {};
  }

  onMessage(id: string, value: string) {
    if (this.subscriptions[id]) {
      this.subscriptions[id]!.forEach((callback) => {
        callback(value);
      });
    }
  }

  addListener(key: string, callback: Function) {
    if (!this.subscriptions[key]) {
      this.subscriptions[key] = [];
    }
    this.subscriptions[key]!.push(callback);
  }

  sendAsyncMessage(message: any, postMessage: any) {
    const messageId = Math.random().toString(36).substring(7);
    message.payload = message.payload || {};
    message.payload.messageId = messageId;
    return new Promise((resolve) => {
      this.addListener(messageId, resolve);
      postMessage(message);
    });
  }
}

export const asyncMessages = new AsyncMessages();
