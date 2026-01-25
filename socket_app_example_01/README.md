# LiveBoard – Real-Time Collaboration App (React Native)

LiveBoard is a real-time collaboration mobile application built using **React Native**.  
The project demonstrates **real-time WebSocket communication**, **high-performance list rendering**, **app lifecycle handling**, and **selective Native Module integration**.

This project is designed to showcase **production-level React Native skills** and is suitable for **machine coding rounds and system design interviews**.

---

## 🚀 Key Features

### ✅ Real-Time Comments (WebSocket)
- Live comments update instantly across devices
- Typing indicator support
- Automatic reconnect on network failure
- Graceful socket cleanup on screen unmount

### ✅ Performance & Optimization
- Handles **5,000+ comments smoothly**
- Optimized rendering using:
  - `FlatList`
  - `React.memo`
  - `useCallback`
  - `getItemLayout`
- Prevents unnecessary re-renders
- Auto-scroll to latest message

### ✅ Native Modules (Lightweight Usage)
- Native module to detect:
  - Network connectivity
  - Device performance tier (LOW / MID / HIGH)
- JS layer adapts:
  - WebSocket reconnect delay
  - List rendering batch size

### ✅ App Lifecycle Handling
- WebSocket paused when app goes background
- Reconnects when app becomes active
- Battery & memory safe

---

## 🧠 Architecture Overview

**Approach:** JS-Driven Real-Time Architecture  
Native code is used only where JS is inefficient.


src/
├── screens/
│ └── MarketScreen.tsx
├── components/
│ └── StockRow.tsx
├── store/
│ └── marketStore.ts
├── native/
│ ├── MarketSocketModule.android.kt
│ └── MarketSocketModule.ios.swift



---

## 🔌 Native → JS Data Flow

1. Native WebSocket receives real-time updates
2. Native batches messages
3. Batched data emitted to JS
4. JS updates UI efficiently
5. Minimal JS thread usage

---

## ⚡ Performance Techniques Used

- Native message batching
- JS event throttling
- FlatList window tuning
- Stable row rendering
- Hermes engine optimization

---

## 🧪 Machine Coding & Interview Coverage

- Native Module creation
- WebSocket handling in Native
- Performance bottleneck analysis
- JS vs Native threading explanation
- New Architecture discussion (Fabric & TurboModules)

---

## 🛠 Tech Stack

- React Native
- TypeScript
- Kotlin (Android)
- Swift (iOS)
- Native Event Emitters
- Hermes Engine

---

## 🎬 Demo Scenarios

- Simulate high-frequency data stream
- Compare JS WebSocket vs Native WebSocket
- Observe UI lag difference
- Background execution test

---

## 📌 Interview Talking Points

- Why Native over JS WebSocket
- Event batching benefits
- JS thread limitations
- When to use TurboModules
- Scaling real-time apps

---

## 👨‍💻 Author

Pravesh Pal  
React Native Developer
