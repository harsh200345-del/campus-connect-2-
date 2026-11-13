# Campus Share: P2P Rental Platform for RKGIT 🎓

> **"Builds Trust | Saves Money | Reduces Waste — Empowering the RKGIT Campus Community!"**

A complete, full-stack peer-to-peer equipment sharing and rental web application specifically tailored for students and hostelers of **Raj Kumar Goel Institute of Technology (RKGIT)**, Ghaziabad.

---

## 🌟 What's New & Upgraded

### 1. 📱 Mobile Number + OTP Login Authentication API (Real SMS Connected)
* **Real SMS Gateway Module (`smsService.js`)**: Direct HTTPS integration with **Fast2SMS** (free for Indian +91 numbers) and **Twilio**.
* In the login modal, you can open **"⚙️ Physical Mobile SMS Gateway"** and paste your Fast2SMS API key to deliver real SMS directly to mobile phones!
* If no key is entered, it seamlessly falls back to the **Instant SMS Simulator Banner** with default demo OTP (`4829`), so testing never stops.
* Real API endpoint **`POST /api/auth/send-otp`** that generates and delivers an instantaneous 4-digit verification OTP to any 10-digit mobile number.
* Verification endpoint **`POST /api/auth/verify-otp`** that validates the OTP, creates or loads the verified student profile, and assigns the desired role.
* Built-in on-screen **SMS Simulator Banner** and quick 1-click test profiles:
  * 👨‍🎓 **Rohan Sharma** (Borrower): `9876543210` (Default OTP: `4829`)
  * 🧑‍💻 **Aman Verma** (Lender / Hosteler): `9812345678` (Default OTP: `4829`)
  * 👩‍🎓 **Priya Singh** (GH-1 Lender): `9898989898` (Default OTP: `4829`)

### 2. 🏛️ Dual Dedicated Campus Portals
* **🎓 Borrower / Buyer Portal**:
  * Emergency 15-Minute Flash search (Casio fx-991ES, Lab coats, Mini drafters, Multimeters).
  * Booking with refundable security deposit held in college escrow.
  * Live Handshake QR & OTP generator to show lender at pickup meetup spots.
  * Active exam session tracker and one-click return initiation.
* **💼 Lender / Hosteler Portal**:
  * List equipment fast & free from your hostel room desk.
  * Instant request alerts with **[ACCEPT ✓]** and **[Decline]** buttons.
  * Handshake Station: Verify borrower's OTP or scan QR to lock deposit.
  * Return Handshake: Verify return OTP when item is returned to instantly receive pocket money into your wallet!
  * Inventory management tab to monitor all listed items.

### 3. 💬 100% Real-Time Campus Chat System
* **🏛️ RKGIT Campus Peer Board (`campus-global`)**: Open community chat channel accessible to all students across all hostels and branches.
* **Handshake Coordination Threads**: Dedicated private channels between borrower and lender for every rental.
* **Quick Campus Replies**: One-tap quick response chips (*"I'm at Canteen Nescafe counter!"*, *"Practical starts in 10 mins"*, *"Handshake OTP ready!"*).
* Live auto-refresh polling every 1.5s with Web Audio chime alerts.

---

## 🚀 Quick Start (Instant Run)

### 1. Requirements
* **Node.js** (v16+ installed, zero external npm dependencies required)

### 2. Start the Server
Double-click [**`start.bat`**](file:///c:/Users/Harsh%20mani%20pandey/OneDrive/Desktop/campus-share-rkgit/start.bat) **or** run in terminal:

```bash
node server.js
```

### 3. Open in Browser
Visit:
```
http://localhost:3000
```

---

## 🏛️ Campus Handshake Spots (RKGIT Ghaziabad)
* Campus Canteen & Nescafe Counter
* Central Library Front Entrance
* Academic Block A / B / C Corridors
* Chemistry & Physics Lab Foyer
* Mechanical Engineering Workshop Gate
* Boys Hostel 1 & 2 / Girls Hostel 1 Gates
