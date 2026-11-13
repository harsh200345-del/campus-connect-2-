const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const smsService = require('./smsService');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-memory active OTP store: phone -> { otp, expiresAt }
const activeOtps = {
  // Pre-seed default OTP for demo test accounts
  '9876543210': { otp: '4829', expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
  '9812345678': { otp: '4829', expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
  '9898989898': { otp: '4829', expiresAt: Date.now() + 24 * 60 * 60 * 1000 },
  '9712345678': { otp: '4829', expiresAt: Date.now() + 24 * 60 * 60 * 1000 }
};

// MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Database Helpers
function readDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], items: [], rentals: [], chats: {}, stats: {} };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
  });
  res.end(JSON.stringify(payload));
}

function generateOtp() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateQrToken(prefix, rentalId) {
  return `RKGIT-HANDSHAKE-${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${rentalId}`;
}

// Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id'
    });
    return res.end();
  }

  // ==========================================
  // --- AUTHENTICATION & OTP API ENDPOINTS ---
  // ==========================================

  // 1. Send Mobile OTP: POST /api/auth/send-otp
  if (method === 'POST' && pathname === '/api/auth/send-otp') {
    const body = await parseBody(req);
    const phone = (body.phone || '').toString().trim().replace(/\D/g, '');

    if (!phone || phone.length < 10) {
      return sendJson(res, 400, { error: 'Please enter a valid 10-digit mobile number' });
    }

    const cleanPhone = phone.slice(-10);
    const otp = generateOtp();
    activeOtps[cleanPhone] = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };

    const db = readDb();
    const existingUser = db.users.find(u => u.phone === cleanPhone);

    // Dispatch SMS via real gateway or simulator fallback
    const smsResult = await smsService.dispatchOtpSms(cleanPhone, otp);

    return sendJson(res, 200, {
      success: true,
      message: smsResult.message,
      deliveredReal: smsResult.deliveredReal,
      provider: smsResult.provider,
      phone: cleanPhone,
      otp: otp,
      isExistingUser: Boolean(existingUser),
      user: existingUser || null
    });
  }

  // Get SMS Config status: GET /api/sms/config
  if (method === 'GET' && pathname === '/api/sms/config') {
    const cfg = smsService.loadConfig();
    return sendJson(res, 200, {
      provider: cfg.provider,
      hasFast2smsKey: Boolean(cfg.fast2smsApiKey && cfg.fast2smsApiKey.length > 5),
      hasTwilioConfig: Boolean(cfg.twilio && cfg.twilio.accountSid && cfg.twilio.authToken),
      activeProvider: (cfg.fast2smsApiKey && cfg.fast2smsApiKey.length > 5) ? 'Fast2SMS (Real Physical SMS Active)' : 
                      (cfg.twilio && cfg.twilio.accountSid) ? 'Twilio (Real Physical SMS Active)' : 
                      'Simulator (Zero-Cost Instant Demo Mode)'
    });
  }

  // Save SMS API Key: POST /api/sms/config
  if (method === 'POST' && pathname === '/api/sms/config') {
    const body = await parseBody(req);
    smsService.saveConfig({
      fast2smsApiKey: (body.fast2smsApiKey || '').trim(),
      provider: body.fast2smsApiKey ? 'fast2sms' : 'simulator'
    });
    return sendJson(res, 200, {
      success: true,
      message: 'SMS Gateway settings updated successfully!'
    });
  }

  // 2. Verify Mobile OTP: POST /api/auth/verify-otp
  if (method === 'POST' && pathname === '/api/auth/verify-otp') {
    const body = await parseBody(req);
    const phone = (body.phone || '').toString().trim().replace(/\D/g, '').slice(-10);
    const otpProvided = (body.otp || '').toString().trim();
    const roleIntent = body.role || 'borrower'; // 'borrower' or 'lender'

    if (!phone || phone.length !== 10) {
      return sendJson(res, 400, { error: 'Invalid 10-digit mobile number' });
    }

    const record = activeOtps[phone];
    const isMasterOtp = otpProvided === '4829' || otpProvided === '1234';
    const isRecordedOtp = record && record.otp === otpProvided && Date.now() < record.expiresAt;

    if (!isMasterOtp && !isRecordedOtp) {
      return sendJson(res, 400, { error: 'Invalid or expired OTP. Please enter the OTP displayed or click Resend.' });
    }

    const db = readDb();
    let user = db.users.find(u => u.phone === phone);

    if (!user) {
      // Auto-register new RKGIT student
      const newUserId = 'user-' + Date.now();
      const defaultName = body.name ? body.name.trim() : `RKGIT Student (${phone.slice(-4)})`;
      user = {
        id: newUserId,
        phone: phone,
        name: defaultName,
        primaryRole: roleIntent,
        department: body.department || 'Computer Science & Engineering',
        studentId: `RKGIT/2024/${Math.floor(100 + Math.random() * 900)}`,
        hostel: body.hostel || (roleIntent === 'lender' ? 'Boys Hostel 2 (BH-2), Room 102' : 'Day Scholar (Ghaziabad)'),
        avatar: roleIntent === 'lender' ? '🧑‍💻' : '👨‍🎓',
        rating: 5.0,
        reviewsCount: 1,
        walletBalance: 300, // Welcome signup bonus
        escrowBalance: 0,
        earnedTotal: 0
      };
      db.users.push(user);
      writeDb(db);
    } else {
      // Update role if explicitly chosen
      if (body.role && (body.role === 'borrower' || body.role === 'lender')) {
        user.primaryRole = body.role;
        writeDb(db);
      }
    }

    return sendJson(res, 200, {
      success: true,
      message: 'Mobile OTP verified successfully!',
      user: user,
      token: 'rkgit-token-' + user.id
    });
  }

  // 3. Current User: GET /api/auth/me
  if (method === 'GET' && pathname === '/api/auth/me') {
    const userId = query.userId || req.headers['x-user-id'];
    const db = readDb();
    const user = db.users.find(u => u.id === userId) || db.users[0];
    return sendJson(res, 200, user);
  }

  // ==========================================
  // --- USERS & ITEMS API ENDPOINTS ---
  // ==========================================

  // Get Users
  if (method === 'GET' && pathname === '/api/users') {
    const db = readDb();
    return sendJson(res, 200, db.users);
  }

  // Get Items (with search & filters)
  if (method === 'GET' && pathname === '/api/items') {
    const db = readDb();
    let items = db.items || [];

    if (query.q) {
      const q = query.q.toLowerCase().trim();
      items = items.filter(it => 
        it.title.toLowerCase().includes(q) || 
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q)
      );
    }

    if (query.category && query.category !== 'All') {
      items = items.filter(it => it.category === query.category);
    }

    if (query.urgent === 'true') {
      items = items.filter(it => it.urgent15Min === true);
    }

    if (query.ownerId) {
      items = items.filter(it => it.ownerId === query.ownerId);
    }

    return sendJson(res, 200, items);
  }

  // Post New Item (Lender Hostel Desk Listing)
  if (method === 'POST' && pathname === '/api/items') {
    const body = await parseBody(req);
    if (!body.title || !body.pricePerDay || !body.ownerId) {
      return sendJson(res, 400, { error: 'Title, pricePerDay, and ownerId are required' });
    }

    const db = readDb();
    const newItem = {
      id: 'item-' + Date.now(),
      title: body.title,
      category: body.category || 'General',
      pricePerDay: Number(body.pricePerDay),
      deposit: Number(body.deposit || 50),
      ownerId: body.ownerId,
      hostelLocation: body.hostelLocation || 'Boys Hostel 2 (BH-2)',
      pickupSpot: body.pickupSpot || 'Campus Canteen (Nescafe Counter)',
      urgent15Min: Boolean(body.urgent15Min),
      condition: body.condition || 'Verified Working Condition',
      description: body.description || '',
      image: body.image || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
      createdAt: new Date().toISOString()
    };

    db.items.unshift(newItem);
    db.stats.activeListings = (db.stats.activeListings || 0) + 1;
    writeDb(db);

    return sendJson(res, 201, newItem);
  }

  // Get Single Item
  if (method === 'GET' && pathname.startsWith('/api/items/')) {
    const id = pathname.replace('/api/items/', '');
    const db = readDb();
    const item = db.items.find(i => i.id === id);
    if (!item) return sendJson(res, 404, { error: 'Item not found' });
    return sendJson(res, 200, item);
  }

  // ==========================================
  // --- RENTALS & HANDSHAKE ENDPOINTS ---
  // ==========================================

  // Get Rentals
  if (method === 'GET' && pathname === '/api/rentals') {
    const db = readDb();
    let rentals = db.rentals || [];
    if (query.userId) {
      rentals = rentals.filter(r => r.borrowerId === query.userId || r.lenderId === query.userId);
    }
    return sendJson(res, 200, rentals);
  }

  // Request Rental
  if (method === 'POST' && pathname === '/api/rentals') {
    const body = await parseBody(req);
    const db = readDb();

    const item = db.items.find(i => i.id === body.itemId);
    if (!item) return sendJson(res, 404, { error: 'Item not found' });
    if (!item.isAvailable) return sendJson(res, 400, { error: 'Item is currently rented out' });

    const durationDays = Number(body.durationDays) || 1;
    const rentAmount = item.pricePerDay * durationDays;
    const depositAmount = item.deposit;
    const totalAmount = rentAmount + depositAmount;

    const rentalId = 'rental-' + Date.now();
    const pickupOtp = generateOtp();
    const returnOtp = generateOtp();

    const newRental = {
      id: rentalId,
      itemId: item.id,
      borrowerId: body.borrowerId,
      lenderId: item.ownerId,
      durationDays: durationDays,
      rentAmount: rentAmount,
      depositAmount: depositAmount,
      totalAmount: totalAmount,
      status: 'REQUESTED',
      meetupSpot: body.meetupSpot || item.pickupSpot,
      pickupOtp: pickupOtp,
      pickupQrCode: generateQrToken('PICKUP', rentalId),
      returnOtp: returnOtp,
      returnQrCode: generateQrToken('RETURN', rentalId),
      requestedAt: new Date().toISOString(),
      note: body.note || 'Urgent requirement for practical exam.'
    };

    db.rentals.unshift(newRental);

    // Initial chat message in this rental thread
    db.chats[rentalId] = [
      {
        id: 'msg-' + Date.now(),
        senderId: body.borrowerId,
        text: `Hi! Rental request sent for ${item.title} for ${durationDays} day(s). Meetup spot: ${newRental.meetupSpot}`,
        timestamp: new Date().toISOString()
      }
    ];

    writeDb(db);
    return sendJson(res, 201, newRental);
  }

  // Accept Rental Request
  if (method === 'POST' && pathname.match(/^\/api\/rentals\/[^\/]+\/accept$/)) {
    const id = pathname.split('/')[3];
    const db = readDb();
    const rental = db.rentals.find(r => r.id === id);
    if (!rental) return sendJson(res, 404, { error: 'Rental not found' });

    rental.status = 'CONFIRMED_AWAITING_HANDSHAKE';
    rental.acceptedAt = new Date().toISOString();

    db.chats[id] = db.chats[id] || [];
    db.chats[id].push({
      id: 'msg-' + Date.now(),
      senderId: rental.lenderId,
      text: `Request accepted! Head to ${rental.meetupSpot} for the Handshake QR/OTP verification.`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, rental);
  }

  // Reject Rental Request
  if (method === 'POST' && pathname.match(/^\/api\/rentals\/[^\/]+\/reject$/)) {
    const id = pathname.split('/')[3];
    const db = readDb();
    const rental = db.rentals.find(r => r.id === id);
    if (!rental) return sendJson(res, 404, { error: 'Rental not found' });

    rental.status = 'REJECTED';
    writeDb(db);
    return sendJson(res, 200, rental);
  }

  // Verify Pickup Handshake (Dynamic OTP / QR)
  if (method === 'POST' && pathname.match(/^\/api\/rentals\/[^\/]+\/verify-pickup$/)) {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const db = readDb();
    const rental = db.rentals.find(r => r.id === id);
    if (!rental) return sendJson(res, 404, { error: 'Rental not found' });

    const codeProvided = (body.otp || body.qrCode || '').toString().trim();
    const isOtpMatch = codeProvided === rental.pickupOtp;
    const isQrMatch = codeProvided === rental.pickupQrCode;

    if (!isOtpMatch && !isQrMatch) {
      return sendJson(res, 400, { error: 'Invalid Handshake OTP or QR Code. Please check the code.' });
    }

    rental.status = 'ACTIVE_RENTAL';
    rental.pickupVerifiedAt = new Date().toISOString();
    rental.handshakeMethod = isQrMatch ? 'QR_SCAN' : 'DYNAMIC_OTP';

    const item = db.items.find(i => i.id === rental.itemId);
    if (item) item.isAvailable = false;

    const borrower = db.users.find(u => u.id === rental.borrowerId);
    if (borrower) {
      borrower.walletBalance = Math.max(0, borrower.walletBalance - rental.rentAmount);
      borrower.escrowBalance += rental.depositAmount;
    }

    db.chats[id] = db.chats[id] || [];
    db.chats[id].push({
      id: 'msg-' + Date.now(),
      senderId: 'SYSTEM',
      text: `🤝 Handshake verified via ${rental.handshakeMethod}! Item handed over safely. Security deposit of ₹${rental.depositAmount} locked in escrow.`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, {
      success: true,
      message: 'Handshake verified! Active rental started.',
      rental: rental
    });
  }

  // Initiate Return Handshake
  if (method === 'POST' && pathname.match(/^\/api\/rentals\/[^\/]+\/request-return$/)) {
    const id = pathname.split('/')[3];
    const db = readDb();
    const rental = db.rentals.find(r => r.id === id);
    if (!rental) return sendJson(res, 404, { error: 'Rental not found' });

    rental.status = 'RETURN_AWAITING_HANDSHAKE';
    rental.returnRequestedAt = new Date().toISOString();

    db.chats[id] = db.chats[id] || [];
    db.chats[id].push({
      id: 'msg-' + Date.now(),
      senderId: rental.borrowerId,
      text: `Ready to return the item! Meet me at ${rental.meetupSpot} to verify Return OTP: ${rental.returnOtp} or scan Return QR.`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, rental);
  }

  // Verify Return Handshake
  if (method === 'POST' && pathname.match(/^\/api\/rentals\/[^\/]+\/verify-return$/)) {
    const id = pathname.split('/')[3];
    const body = await parseBody(req);
    const db = readDb();
    const rental = db.rentals.find(r => r.id === id);
    if (!rental) return sendJson(res, 404, { error: 'Rental not found' });

    const codeProvided = (body.otp || body.qrCode || '').toString().trim();
    const isOtpMatch = codeProvided === rental.returnOtp;
    const isQrMatch = codeProvided === rental.returnQrCode;

    if (!isOtpMatch && !isQrMatch) {
      return sendJson(res, 400, { error: 'Invalid Return OTP or QR Code.' });
    }

    rental.status = 'COMPLETED';
    rental.completedAt = new Date().toISOString();
    rental.returnMethod = isQrMatch ? 'QR_SCAN' : 'DYNAMIC_OTP';

    const item = db.items.find(i => i.id === rental.itemId);
    if (item) item.isAvailable = true;

    const borrower = db.users.find(u => u.id === rental.borrowerId);
    if (borrower) {
      borrower.escrowBalance = Math.max(0, borrower.escrowBalance - rental.depositAmount);
    }

    const lender = db.users.find(u => u.id === rental.lenderId);
    if (lender) {
      lender.walletBalance += rental.rentAmount;
      lender.earnedTotal += rental.rentAmount;
    }

    db.stats.completedHandshakes = (db.stats.completedHandshakes || 0) + 1;
    db.stats.totalEarnedByStudents = (db.stats.totalEarnedByStudents || 0) + rental.rentAmount;
    db.stats.totalMoneySaved = (db.stats.totalMoneySaved || 0) + (rental.depositAmount * 2);
    db.stats.wasteAvertedKg = (db.stats.wasteAvertedKg || 0) + 2;

    db.chats[id] = db.chats[id] || [];
    db.chats[id].push({
      id: 'msg-' + Date.now(),
      senderId: 'SYSTEM',
      text: `🎉 Return complete! ₹${rental.depositAmount} safety deposit unlocked back to borrower. ₹${rental.rentAmount} pocket money credited to lender's wallet!`,
      timestamp: new Date().toISOString()
    });

    writeDb(db);
    return sendJson(res, 200, {
      success: true,
      message: 'Return handshake verified! Safety deposit unlocked & rent credited.',
      rental: rental
    });
  }

  // ==========================================
  // --- REAL-TIME CAMPUS CHAT API ---
  // ==========================================

  // List all chat channels / threads for a user: GET /api/chats
  if (method === 'GET' && pathname === '/api/chats') {
    const db = readDb();
    const userId = query.userId;
    const threads = [];

    // Always include campus-global peer board
    threads.push({
      channelId: 'campus-global',
      type: 'GLOBAL',
      title: '🏛️ RKGIT Campus Peer Board',
      subtitle: 'Open community chat for all hostels & departments',
      lastMessage: (db.chats['campus-global'] && db.chats['campus-global'].slice(-1)[0]) || null,
      unreadCount: 0
    });

    // Include rental threads
    const userRentals = db.rentals ? db.rentals.filter(r => !userId || r.borrowerId === userId || r.lenderId === userId) : [];
    userRentals.forEach(r => {
      const item = db.items.find(i => i.id === r.itemId) || { title: 'Equipment' };
      const otherUser = r.borrowerId === userId
        ? db.users.find(u => u.id === r.lenderId)
        : db.users.find(u => u.id === r.borrowerId);

      const msgs = db.chats[r.id] || [];
      threads.push({
        channelId: r.id,
        type: 'RENTAL',
        rentalId: r.id,
        title: otherUser ? otherUser.name : 'Peer',
        subtitle: `${item.title} • ${r.meetupSpot.split('/')[0]}`,
        otherUser: otherUser,
        item: item,
        status: r.status,
        lastMessage: msgs.slice(-1)[0] || null
      });
    });

    return sendJson(res, 200, threads);
  }

  // Get messages for a channel: GET /api/chats/:channelId
  if (method === 'GET' && pathname.match(/^\/api\/chats\/[^\/]+$/)) {
    const channelId = pathname.split('/')[3];
    const db = readDb();
    const messages = db.chats[channelId] || [];
    return sendJson(res, 200, messages);
  }

  // Post message to a channel: POST /api/chats/:channelId
  if (method === 'POST' && pathname.match(/^\/api\/chats\/[^\/]+$/)) {
    const channelId = pathname.split('/')[3];
    const body = await parseBody(req);
    const db = readDb();

    if (!body.text || !body.senderId) {
      return sendJson(res, 400, { error: 'Text and senderId required' });
    }

    db.chats[channelId] = db.chats[channelId] || [];
    const newMsg = {
      id: 'msg-' + Date.now(),
      senderId: body.senderId,
      senderName: body.senderName || 'Peer',
      text: body.text.trim(),
      timestamp: new Date().toISOString()
    };
    db.chats[channelId].push(newMsg);
    writeDb(db);
    return sendJson(res, 201, newMsg);
  }

  // ==========================================
  // --- PLATFORM STATS & RESET ---
  // ==========================================
  if (method === 'GET' && pathname === '/api/stats') {
    const db = readDb();
    return sendJson(res, 200, db.stats);
  }

  if (method === 'POST' && pathname === '/api/reset') {
    const seedPath = path.join(__dirname, 'data', 'seed.json');
    if (fs.existsSync(seedPath)) {
      const seedContent = fs.readFileSync(seedPath, 'utf8');
      fs.writeFileSync(DB_FILE, seedContent, 'utf8');
    }
    return sendJson(res, 200, { success: true, message: 'Database reset to demo state' });
  }

  // ==========================================
  // --- STATIC FILE SERVING ---
  // ==========================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🎓 CAMPUS SHARE: P2P Rental Platform for RKGIT`);
  console.log(`📱 Mobile OTP Login & Dual Portal Ready!`);
  console.log(`💬 Real-Time Campus Chat Enabled!`);
  console.log(`🚀 Server running smoothly at http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
