# LiveBoard Backend

Real-time backend for the LiveBoard application, built with Node.js, Express, Socket.io, MongoDB, and TypeScript.

This backend handles **user authentication**, **persistent data (users/messages)**, and **real-time bi-directional communication**.

## 🚀 Setup & Run

1.  **Prerequisites:**
    *   Node.js (v14+)
    *   MongoDB running locally on port `27017` (or set `MONGO_URI` in `.env`)

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run in Development Mode:**
    ```bash
    npm run dev
    ```
    Server runs on `http://localhost:4000`.

4.  **Build and Run Production:**
    ```bash
    npm run build
    npm start
    ```

---

## 🔐 REST API Endpoints

Base URL: `http://localhost:4000`

### 1. Authentication & Users

#### **Register New User**
*   **Endpoint:** `POST /api/auth/register`
*   **Description:** Creates a new user account.
*   **Body (JSON):**
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "securepassword123",
      "avatar": "data:image/png;base64,..." // Optional (Base64 string or URL)
    }
    ```
*   **Response (201):**
    ```json
    {
      "user": { "id": "...", "name": "John Doe", "email": "...", "avatar": "..." },
      "token": "eyJhbGcV..."
    }
    ```

#### **Login**
*   **Endpoint:** `POST /api/auth/login`
*   **Description:** Authenticates user and returns a token.
*   **Body (JSON):**
    ```json
    {
      "email": "john@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200):** Returns same structure as Register (User object + Token).

#### **Get All Users (Contact List)**
*   **Endpoint:** `GET /api/auth/users`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Returns a list of all users, including their last message with you and unread count.
*   **Response (200):**
    ```json
    [
      { 
        "id": "...", 
        "name": "Jane Doe", 
        "avatar": "...", 
        "lastMessage": "Hey there!",
        "time": "10:30 AM",
        "unreadCount": 2,
        "isRead": false,
        "isOnline": true 
      }
    ]
    ```

### 2. Messages (REST)

#### **Get Chat History**
*   **Endpoint:** `GET /api/auth/messages/:userId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Returns the full conversation history between you and `userId`.
*   **Response (200):**
    ```json
    [
      {
        "id": "...",
        "text": "Hello!",
        "isPrivate": true,
        "isRead": true,
        "user": { "id": "...", "name": "...", "avatar": "..." }, // Sender details
        "createdAt": "2023-10-25T10:00:00.000Z"
      }
    ]
    ```

#### **Send Message**
*   **Endpoint:** `POST /api/auth/messages`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body (JSON):**
    ```json
    {
      "recipientId": "target_user_id",
      "text": "Hello, how are you?"
    }
    ```
*   **Response (201):** Returns the created message object.

#### **Delete Message**
*   **Endpoint:** `DELETE /api/auth/messages/:messageId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Description:** Deletes a specific message (must be sent by you).
*   **Response (200):** `{ "message": "Message deleted successfully" }`

#### **Update Message**
*   **Endpoint:** `PUT /api/auth/messages/:messageId`
*   **Headers:** `Authorization: Bearer <token>`
*   **Body (JSON):** `{ "text": "Updated text content" }`
*   **Description:** Updates a specific message (must be sent by you).
*   **Response (200):** `{ "message": "Message updated successfully", "text": "..." }`

---

## 🔌 Real-Time Socket.io Events

The Socket.io server handles real-time updates (online status, typing indicators, instant message delivery).

### 📥 Client -> Server (Events you Emit)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `register_user` | `User` object | **CRITICAL:** Call on connect. identifies the socket connection with a user for Online status. |
| `send_private_message` | `{ text, toUserId, user }` | Sends a real-time DM (also saved to DB). |
| `typing` | `boolean` | Send `true` when user starts typing, `false` when stopped. |

### 📤 Server -> Client (Events you Listen for)

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `receive_private_message` | `Message` object | A new **Private** message has arrived in real-time. |
| `typing_indicator` | `userId`, `isTyping` | Indicates if a specific user is typing. |
| `user_list` | `User[]` | Broadcasted on connect/disconnect. Updates "Online Users" status. |

---

## 📦 Data Types

**User:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}
```

**Message:**
```typescript
interface Message {
  id: string;
  text: string;
  user: User; // Sender
  recipient?: User;
  createdAt: string; // ISO Date String
  isPrivate: boolean;
  isRead: boolean;
}
```
