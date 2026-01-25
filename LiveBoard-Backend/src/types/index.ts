export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

export interface Message {
    id: string;
    text: string;
    user: User;
    createdAt: string; // ISO string
}

export interface ServerToClientEvents {
    receive_message: (message: Message) => void;
    receive_private_message: (message: Message & { fromUserId: string; toUserId: string }) => void;
    typing_indicator: (userId: string, isTyping: boolean) => void;
    typing_indicator_private: (data: { fromUserId: string; isTyping: boolean }) => void;
    user_count: (count: number) => void;
    user_list: (users: User[]) => void;
    history: (messages: Message[]) => void;
    messages_read_update: (data: { readByUserId: string }) => void;
    message_delivered: (data: { messageId: string; toUserId: string }) => void;
    unread_count_update: (data: { fromUserId: string; count: number }) => void;
    unread_counts: (data: Array<{ userId: string; count: number }>) => void;
}

export interface ClientToServerEvents {
    register_user: (user: User) => void;
    send_message: (data: { text: string; user: User }) => void;
    send_private_message: (data: { text: string; toUserId: string; user: User }) => void;
    typing: (isTyping: boolean) => void;
    typing_private: (data: { toUserId: string; isTyping: boolean }) => void;
    mark_messages_read: (data: { otherUserId: string }) => void;
    request_user_list: () => void;
    get_unread_counts: () => void;
    join_chat: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    user: User;
}
