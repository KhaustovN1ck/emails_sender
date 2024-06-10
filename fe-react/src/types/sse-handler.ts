export type SSEHandler<Message = any, Error = any> = {
    onMessage: (message: Message) => void;
    onError: (error: Error) => void;
}