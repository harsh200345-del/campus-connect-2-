/**
 * Campus Share: P2P Rental Platform for RKGIT
 * Dual Portal Architecture (Borrower/Buyer vs Lender/Hosteler)
 * Mobile OTP Login & Real-Time Campus Chat
 */

// Application State
const state = {
  currentUser: null,
  currentPortal: 'borrower', // 'borrower' | 'lender'
  users: [],
  items: [],
  rentals: [],
  stats: {},
  activeTab: 'browse',
  selectedRentalId: null,
  activeChatChannel: 'campus-global', // Default to Global Peer Board so chat always works!
  filters: {
    q: '',
    category: 'All',
    urgent: false
  },
  modalItem: null,
  otpCountdownTimer: null,
  chatPollInterval: null
};

// DOM References
const el = {
  // Navigation & Top Bar
  btnOpenLoginModal: document.getElementById('btnOpenLoginModal'),
  btnResetDemo: document.getElementById('btnResetDemo'),
  btnPortalBorrower: document.getElementById('btnPortalBorrower'),
  btnPortalLender: document.getElementById('btnPortalLender'),
  currentUserAvatar: document.getElementById('currentUserAvatar'),
  currentUserName: document.getElementById('currentUserName'),
  currentUserRoleTag: document.getElementById('currentUserRoleTag'),
  currentUserPhone: document.getElementById('currentUserPhone'),
  userWalletAmount: document.getElementById('userWalletAmount'),
  userEscrowAmount: document.getElementById('userEscrowAmount'),
  btnChangeUser: document.getElementById('btnChangeUser'),

  // Portal Indicator
  portalIndicatorBadge: document.getElementById('portalIndicatorBadge'),
  portalIndicatorDesc: document.getElementById('portalIndicatorDesc'),
  tabsContainer: document.getElementById('tabsContainer'),
  tabSections: document.querySelectorAll('.tab-section'),

  // Browse Tab
  urgentToggle: document.getElementById('urgentToggle'),
  searchInput: document.getElementById('searchInput'),
  btnClearSearch: document.getElementById('btnClearSearch'),
  categoryPills: document.getElementById('categoryPills'),
  itemsGrid: document.getElementById('itemsGrid'),
  itemsCountTitle: document.getElementById('itemsCountTitle'),

  // List Item Form (Lender)
  formListItem: document.getElementById('formListItem'),
  itemTitle: document.getElementById('itemTitle'),
  itemCategory: document.getElementById('itemCategory'),
  itemPrice: document.getElementById('itemPrice'),
  itemDeposit: document.getElementById('itemDeposit'),
  itemHostel: document.getElementById('itemHostel'),
  itemPickupSpot: document.getElementById('itemPickupSpot'),
  itemImage: document.getElementById('itemImage'),
  itemCondition: document.getElementById('itemCondition'),
  itemUrgent15: document.getElementById('itemUrgent15'),
  itemDesc: document.getElementById('itemDesc'),
  previewImg: document.getElementById('previewImg'),
  previewTitle: document.getElementById('previewTitle'),
  previewCatBadge: document.getElementById('previewCatBadge'),
  previewUrgentBadge: document.getElementById('previewUrgentBadge'),
  previewAvatar: document.getElementById('previewAvatar'),
  previewOwnerName: document.getElementById('previewOwnerName'),
  previewLoc: document.getElementById('previewLoc'),
  previewPrice: document.getElementById('previewPrice'),
  previewDeposit: document.getElementById('previewDeposit'),

  // My Inventory (Lender)
  myInventoryGrid: document.getElementById('myInventoryGrid'),
  btnGoToListTab: document.getElementById('btnGoToListTab'),

  // Rentals / Handshake
  rentalsList: document.getElementById('rentalsList'),
  userRentalsCount: document.getElementById('userRentalsCount'),
  roleFilterIndicator: document.getElementById('roleFilterIndicator'),
  handshakeCard: document.getElementById('handshakeCard'),
  handshakeEmptyState: document.getElementById('handshakeEmptyState'),
  handshakeActivePane: document.getElementById('handshakeActivePane'),

  // Real-Time Campus Chat
  chatConversationsList: document.getElementById('chatConversationsList'),
  activeChatAvatar: document.getElementById('activeChatAvatar'),
  activeChatName: document.getElementById('activeChatName'),
  activeChatStatus: document.getElementById('activeChatStatus'),
  chatMessagesScroll: document.getElementById('chatMessagesScroll'),
  formSendChat: document.getElementById('formSendChat'),
  chatInputText: document.getElementById('chatInputText'),
  btnGoToHandshake: document.getElementById('btnGoToHandshake'),
  chatQuickReplies: document.getElementById('chatQuickReplies'),

  // Impact Counters
  statSaved: document.getElementById('statSaved'),
  statEarned: document.getElementById('statEarned'),
  statHandshakes: document.getElementById('statHandshakes'),
  statWaste: document.getElementById('statWaste'),

  // Modals & Notifications
  modalAuth: document.getElementById('modalAuth'),
  btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
  formMobileLogin: document.getElementById('formMobileLogin'),
  loginPhone: document.getElementById('loginPhone'),
  btnSendOtp: document.getElementById('btnSendOtp'),
  groupPhoneInput: document.getElementById('groupPhoneInput'),
  groupOtpInput: document.getElementById('groupOtpInput'),
  otpSimulatorAlert: document.getElementById('otpSimulatorAlert'),
  displayedSimulatedOtp: document.getElementById('displayedSimulatedOtp'),
  loginOtp: document.getElementById('loginOtp'),
  btnVerifyOtp: document.getElementById('btnVerifyOtp'),
  otpCountdownTimer: document.getElementById('otpCountdownTimer'),
  btnResendOtp: document.getElementById('btnResendOtp'),
  btnToggleSmsConfig: document.getElementById('btnToggleSmsConfig'),
  smsStatusPill: document.getElementById('smsStatusPill'),
  smsCfgBody: document.getElementById('smsCfgBody'),
  inputFast2SmsKey: document.getElementById('inputFast2SmsKey'),
  btnSaveSmsKey: document.getElementById('btnSaveSmsKey'),

  modalRentItem: document.getElementById('modalRentItem'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelRental: document.getElementById('btnCancelRental'),
  formSubmitRental: document.getElementById('formSubmitRental'),
  modalItemTitle: document.getElementById('modalItemTitle'),
  modalItemImg: document.getElementById('modalItemImg'),
  modalOwnerName: document.getElementById('modalOwnerName'),
  modalOwnerHostel: document.getElementById('modalOwnerHostel'),
  modalItemCondition: document.getElementById('modalItemCondition'),
  modalDailyRate: document.getElementById('modalDailyRate'),
  modalDepositRate: document.getElementById('modalDepositRate'),
  modalItemId: document.getElementById('modalItemId'),
  rentDurationDays: document.getElementById('rentDurationDays'),
  rentMeetupSpot: document.getElementById('rentMeetupSpot'),
  rentNote: document.getElementById('rentNote'),
  calcDurationText: document.getElementById('calcDurationText'),
  calcDailyRate: document.getElementById('calcDailyRate'),
  calcRentTotal: document.getElementById('calcRentTotal'),
  calcDepositTotal: document.getElementById('calcDepositTotal'),
  calcGrandTotal: document.getElementById('calcGrandTotal'),
  calcDepositNote: document.getElementById('calcDepositNote'),
  toastContainer: document.getElementById('toastContainer')
};

// --- Toast System ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> <span>${message}</span>`;
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Standalone Client-Side Mock Database (Ensures 100% functionality even when opened directly as file://) ---
const clientMockDb = {
  users: [
    {
      id: "user-rohan",
      phone: "9876543210",
      name: "Rohan Sharma",
      primaryRole: "borrower",
      department: "Computer Science & Engineering (2nd Year)",
      studentId: "RKGIT/2023/CS-184",
      hostel: "Day Scholar (Near RKGIT Campus)",
      avatar: "👨‍🎓",
      rating: 4.9,
      reviewsCount: 16,
      walletBalance: 500,
      escrowBalance: 0,
      earnedTotal: 40
    },
    {
      id: "user-aman",
      phone: "9812345678",
      name: "Aman Verma",
      primaryRole: "lender",
      department: "Electronics & Communication (3rd Year)",
      studentId: "RKGIT/2022/EC-042",
      hostel: "Boys Hostel 2 (BH-2), Room 304",
      avatar: "🧑‍💻",
      rating: 5.0,
      reviewsCount: 29,
      walletBalance: 850,
      escrowBalance: 0,
      earnedTotal: 1420
    },
    {
      id: "user-priya",
      phone: "9898989898",
      name: "Priya Singh",
      primaryRole: "lender",
      department: "Information Technology (2nd Year)",
      studentId: "RKGIT/2023/IT-091",
      hostel: "Girls Hostel 1 (GH-1), Room 112",
      avatar: "👩‍🎓",
      rating: 4.8,
      reviewsCount: 19,
      walletBalance: 450,
      escrowBalance: 0,
      earnedTotal: 580
    },
    {
      id: "user-kartik",
      phone: "9712345678",
      name: "Kartik Dixit",
      primaryRole: "lender",
      department: "Mechanical Engineering (4th Year)",
      studentId: "RKGIT/2021/ME-015",
      hostel: "Boys Hostel 1 (BH-1), Room 218",
      avatar: "👷",
      rating: 4.95,
      reviewsCount: 38,
      walletBalance: 1200,
      escrowBalance: 0,
      earnedTotal: 2650
    }
  ],
  items: [
    {
      id: "item-1",
      title: "Casio fx-991ES Plus Scientific Calculator",
      category: "Calculators",
      pricePerDay: 25,
      deposit: 100,
      ownerId: "user-aman",
      hostelLocation: "Boys Hostel 2 (BH-2), Room 304",
      pickupSpot: "Campus Canteen (Nescafe Counter)",
      urgent15Min: true,
      condition: "Like New - 417 Functions, Solar + Battery",
      description: "Essential for engineering practicals and end-semester university exams. Approved for AKTU examinations. Available on-demand!",
      image: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-2",
      title: "Sterile White Lab Coat / Apron (Size L)",
      category: "Lab Coats & Uniforms",
      pricePerDay: 20,
      deposit: 50,
      ownerId: "user-aman",
      hostelLocation: "Boys Hostel 2 (BH-2), Room 304",
      pickupSpot: "Chemistry Lab / Admin Block",
      urgent15Min: true,
      condition: "Washed, Ironed & Stain-Free",
      description: "Mandatory 100% cotton lab coat required for Chemistry, Physics, and Biotech labs. Keep an extra in your bag or rent in 5 mins!",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-3",
      title: "Omega Mini Drafter + Set Squares (Engg. Drawing)",
      category: "Drafting & Tools",
      pricePerDay: 30,
      deposit: 150,
      ownerId: "user-kartik",
      hostelLocation: "Boys Hostel 1 (BH-1), Room 218",
      pickupSpot: "Mechanical Workshop / Drawing Hall 3",
      urgent15Min: true,
      condition: "Calibrated & Smooth Clamp Screw",
      description: "Standard steel bar mini drafter with 360-degree protractor head. Ideal for first/second year Engineering Graphics drawing sheets.",
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-4",
      title: "Digital Multimeter with Needle Probes",
      category: "Electronics & Kits",
      pricePerDay: 35,
      deposit: 150,
      ownerId: "user-aman",
      hostelLocation: "Boys Hostel 2 (BH-2), Room 304",
      pickupSpot: "ECE Hardware Lab / Nescafe Stall",
      urgent15Min: false,
      condition: "New 9V Battery & Continuity Buzzer Active",
      description: "Precision digital multimeter for breadboard circuit debugging, measuring DC/AC voltage, current, and resistor values.",
      image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-5",
      title: "Workshop Safety Khaki Apron + Protective Goggles",
      category: "Lab Coats & Uniforms",
      pricePerDay: 20,
      deposit: 60,
      ownerId: "user-kartik",
      hostelLocation: "Boys Hostel 1 (BH-1), Room 218",
      pickupSpot: "Central Workshop Gate",
      urgent15Min: true,
      condition: "Tear-resistant Heavy Denim/Khaki",
      description: "Mandatory protective gear for Mechanical Fitting, Carpentry, Foundry, and Welding workshops. Comes with transparent eye shield.",
      image: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-6",
      title: "Higher Engineering Mathematics - B.S. Grewal (44th Ed.)",
      category: "Books & Notes",
      pricePerDay: 15,
      deposit: 100,
      ownerId: "user-priya",
      hostelLocation: "Girls Hostel 1 (GH-1), Room 112",
      pickupSpot: "Central Library Entrance",
      urgent15Min: false,
      condition: "Hardcover, Highlighted Important AKTU Solved Questions",
      description: "The definitive engineering mathematics book for semester exams. Perfect for quick overnight revision before exam week.",
      image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    },
    {
      id: "item-7",
      title: "Arduino Uno R3 Starter Kit + Sensor Pack",
      category: "Electronics & Kits",
      pricePerDay: 40,
      deposit: 200,
      ownerId: "user-rohan",
      hostelLocation: "Day Scholar / Academic Block C",
      pickupSpot: "CS Lab 3 / Academic Block",
      urgent15Min: false,
      condition: "Complete with 65 Jumper Wires & Breadboard",
      description: "Microcontroller board, ultrasonic sensor, servo motor, and LCD display. Great for completing semester mini-projects.",
      image: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&auto=format&fit=crop&q=80",
      isAvailable: true
    }
  ],
  rentals: [
    {
      id: "rental-101",
      itemId: "item-1",
      borrowerId: "user-rohan",
      lenderId: "user-aman",
      durationDays: 1,
      rentAmount: 25,
      depositAmount: 100,
      totalAmount: 125,
      status: "REQUESTED",
      meetupSpot: "Campus Canteen (Nescafe Counter)",
      pickupOtp: "8492",
      pickupQrCode: "RKGIT-HANDSHAKE-PICKUP-8492-RENTAL101",
      returnOtp: "3170",
      returnQrCode: "RKGIT-HANDSHAKE-RETURN-3170-RENTAL101",
      requestedAt: "2026-11-13T09:15:00.000Z",
      note: "Practical exam in 15 mins! Urgent need for Casio fx-991ES."
    }
  ],
  chats: {
    "campus-global": [
      {
        id: "msg-g1",
        senderId: "user-rohan",
        senderName: "Rohan Sharma (Day Scholar)",
        text: "📢 Emergency! Practical exam in 15 mins at Lab 2. Anyone have a Casio fx-991ES calculator near Canteen?",
        timestamp: "2026-11-13T09:10:00.000Z"
      },
      {
        id: "msg-g2",
        senderId: "user-aman",
        senderName: "Aman Verma (BH-2)",
        text: "Hey Rohan, I have listed my Casio 991ES and Lab coat on Campus Share! Send a request, I'm at BH-2.",
        timestamp: "2026-11-13T09:11:30.000Z"
      }
    ],
    "rental-101": [
      {
        id: "msg-1",
        senderId: "user-rohan",
        senderName: "Rohan Sharma",
        text: "Hey Aman! I have my practical exam in 15 mins and forgot my Casio fx-991ES calculator at home. Can I rent yours?",
        timestamp: "2026-11-13T09:15:20.000Z"
      },
      {
        id: "msg-2",
        senderId: "user-aman",
        senderName: "Aman Verma",
        text: "Hey Rohan! Absolutely. I am at BH-2 hostel desk right now. Accept the request and let's meet at the Canteen!",
        timestamp: "2026-11-13T09:16:05.000Z"
      }
    ]
  },
  stats: {
    totalMoneySaved: 18450,
    totalEarnedByStudents: 8920,
    completedHandshakes: 142,
    activeListings: 27,
    wasteAvertedKg: 58
  }
};

function getLocalDb() {
  try {
    const raw = localStorage.getItem('rkgit_local_db');
    if (!raw) {
      localStorage.setItem('rkgit_local_db', JSON.stringify(clientMockDb));
      return JSON.parse(JSON.stringify(clientMockDb));
    }
    return JSON.parse(raw);
  } catch (e) {
    return JSON.parse(JSON.stringify(clientMockDb));
  }
}

function saveLocalDb(db) {
  try {
    localStorage.setItem('rkgit_local_db', JSON.stringify(db));
  } catch (e) {}
}

// Client-Side Offline Fallback Handlers
function handleClientGet(path) {
  const db = getLocalDb();
  const [pathname, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');

  if (pathname === '/api/users') return db.users;

  if (pathname === '/api/items') {
    let items = db.items || [];
    const q = params.get('q');
    if (q) {
      const qLow = q.toLowerCase();
      items = items.filter(it => it.title.toLowerCase().includes(qLow) || it.category.toLowerCase().includes(qLow));
    }
    const cat = params.get('category');
    if (cat && cat !== 'All') items = items.filter(it => it.category === cat);
    if (params.get('urgent') === 'true') items = items.filter(it => it.urgent15Min);
    return items;
  }

  if (pathname.startsWith('/api/items/')) {
    const id = pathname.replace('/api/items/', '');
    return db.items.find(i => i.id === id) || null;
  }

  if (pathname === '/api/rentals') {
    let rentals = db.rentals || [];
    const userId = params.get('userId');
    if (userId) rentals = rentals.filter(r => r.borrowerId === userId || r.lenderId === userId);
    return rentals;
  }

  if (pathname === '/api/chats') {
    const userId = params.get('userId');
    const threads = [
      {
        channelId: 'campus-global',
        type: 'GLOBAL',
        title: '🏛️ RKGIT Campus Peer Board',
        subtitle: 'Open community chat for all hostels & departments',
        lastMessage: (db.chats['campus-global'] && db.chats['campus-global'].slice(-1)[0]) || null
      }
    ];
    (db.rentals || []).forEach(r => {
      const item = db.items.find(i => i.id === r.itemId) || { title: 'Equipment' };
      const otherUser = r.borrowerId === userId ? db.users.find(u => u.id === r.lenderId) : db.users.find(u => u.id === r.borrowerId);
      threads.push({
        channelId: r.id,
        type: 'RENTAL',
        rentalId: r.id,
        title: otherUser ? otherUser.name : 'Peer',
        subtitle: `${item.title} • ${r.meetupSpot.split('/')[0]}`,
        otherUser: otherUser,
        item: item,
        status: r.status,
        lastMessage: (db.chats[r.id] && db.chats[r.id].slice(-1)[0]) || null
      });
    });
    return threads;
  }

  if (pathname.startsWith('/api/chats/')) {
    const id = pathname.replace('/api/chats/', '');
    return db.chats[id] || [];
  }

  if (pathname === '/api/stats') return db.stats;
  if (pathname === '/api/sms/config') {
    return {
      provider: 'simulator',
      hasFast2smsKey: false,
      hasTwilioConfig: false,
      activeProvider: 'Simulator (Zero-Cost Instant Demo Mode)'
    };
  }

  return null;
}

function handleClientPost(path, data = {}) {
  const db = getLocalDb();

  // Send OTP
  if (path === '/api/auth/send-otp') {
    const cleanPhone = (data.phone || '9876543210').toString().replace(/\D/g, '').slice(-10);
    const otp = cleanPhone === '9876543210' || cleanPhone === '9812345678' ? '4829' : Math.floor(1000 + Math.random() * 9000).toString();
    sessionStorage.setItem('rkgit_active_otp_' + cleanPhone, otp);

    const existingUser = db.users.find(u => u.phone === cleanPhone);
    return {
      success: true,
      message: `OTP sent successfully to +91 ${cleanPhone}`,
      phone: cleanPhone,
      otp: otp,
      deliveredReal: false,
      provider: 'simulator',
      isExistingUser: Boolean(existingUser),
      user: existingUser || null
    };
  }

  // Verify OTP
  if (path === '/api/auth/verify-otp') {
    const cleanPhone = (data.phone || '').toString().replace(/\D/g, '').slice(-10);
    const otp = (data.otp || '').toString().trim();
    const storedOtp = sessionStorage.getItem('rkgit_active_otp_' + cleanPhone) || '4829';

    if (otp !== storedOtp && otp !== '4829' && otp !== '1234') {
      return { success: false, error: 'Invalid OTP code. Please enter the OTP displayed.' };
    }

    let user = db.users.find(u => u.phone === cleanPhone);
    if (!user) {
      user = {
        id: 'user-' + Date.now(),
        phone: cleanPhone,
        name: `RKGIT Student (${cleanPhone.slice(-4)})`,
        primaryRole: data.role || 'borrower',
        department: 'B.Tech Engineering',
        studentId: `RKGIT/2024/${Math.floor(100 + Math.random() * 900)}`,
        hostel: data.role === 'lender' ? 'Boys Hostel 2 (BH-2)' : 'Day Scholar',
        avatar: data.role === 'lender' ? '🧑‍💻' : '👨‍🎓',
        walletBalance: 300,
        escrowBalance: 0,
        earnedTotal: 0
      };
      db.users.push(user);
    } else if (data.role) {
      user.primaryRole = data.role;
    }
    saveLocalDb(db);
    return { success: true, user: user, token: 'local-token-' + user.id };
  }

  // Create Item
  if (path === '/api/items') {
    const newItem = {
      id: 'item-' + Date.now(),
      title: data.title,
      category: data.category || 'General',
      pricePerDay: Number(data.pricePerDay || 25),
      deposit: Number(data.deposit || 50),
      ownerId: data.ownerId,
      hostelLocation: data.hostelLocation || 'Hostel',
      pickupSpot: data.pickupSpot || 'Campus Canteen',
      urgent15Min: Boolean(data.urgent15Min),
      condition: data.condition || 'Verified Working',
      description: data.description || '',
      image: data.image || 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
      isAvailable: true
    };
    db.items.unshift(newItem);
    saveLocalDb(db);
    return newItem;
  }

  // Create Rental
  if (path === '/api/rentals') {
    const item = db.items.find(i => i.id === data.itemId);
    const durationDays = Number(data.durationDays || 1);
    const newRental = {
      id: 'rental-' + Date.now(),
      itemId: data.itemId,
      borrowerId: data.borrowerId,
      lenderId: item ? item.ownerId : 'user-aman',
      durationDays: durationDays,
      rentAmount: (item ? item.pricePerDay : 25) * durationDays,
      depositAmount: item ? item.deposit : 100,
      status: 'REQUESTED',
      meetupSpot: data.meetupSpot || 'Campus Canteen (Nescafe Counter)',
      pickupOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      pickupQrCode: 'RKGIT-PICKUP-' + Date.now(),
      returnOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      returnQrCode: 'RKGIT-RETURN-' + Date.now(),
      note: data.note || 'Urgent requirement'
    };
    db.rentals.unshift(newRental);
    db.chats[newRental.id] = [
      {
        id: 'msg-' + Date.now(),
        senderId: data.borrowerId,
        text: `Rental request sent for ${item?.title || 'Equipment'}! Meetup: ${newRental.meetupSpot}`,
        timestamp: new Date().toISOString()
      }
    ];
    saveLocalDb(db);
    return newRental;
  }

  // Accept Rental
  if (path.match(/^\/api\/rentals\/[^\/]+\/accept$/)) {
    const id = path.split('/')[3];
    const rental = db.rentals.find(r => r.id === id);
    if (rental) {
      rental.status = 'CONFIRMED_AWAITING_HANDSHAKE';
      db.chats[id] = db.chats[id] || [];
      db.chats[id].push({
        id: 'msg-' + Date.now(),
        senderId: rental.lenderId,
        text: `Request accepted! Head to ${rental.meetupSpot} with the Handshake QR/OTP.`,
        timestamp: new Date().toISOString()
      });
      saveLocalDb(db);
      return rental;
    }
  }

  // Verify Pickup Handshake
  if (path.match(/^\/api\/rentals\/[^\/]+\/verify-pickup$/)) {
    const id = path.split('/')[3];
    const rental = db.rentals.find(r => r.id === id);
    if (rental) {
      rental.status = 'ACTIVE_RENTAL';
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
        text: `🤝 Handshake verified! Item handed over safely. Security deposit of ₹${rental.depositAmount} locked in escrow.`,
        timestamp: new Date().toISOString()
      });
      saveLocalDb(db);
      return { success: true, rental };
    }
  }

  // Request Return
  if (path.match(/^\/api\/rentals\/[^\/]+\/request-return$/)) {
    const id = path.split('/')[3];
    const rental = db.rentals.find(r => r.id === id);
    if (rental) {
      rental.status = 'RETURN_AWAITING_HANDSHAKE';
      saveLocalDb(db);
      return rental;
    }
  }

  // Verify Return Handshake
  if (path.match(/^\/api\/rentals\/[^\/]+\/verify-return$/)) {
    const id = path.split('/')[3];
    const rental = db.rentals.find(r => r.id === id);
    if (rental) {
      rental.status = 'COMPLETED';
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
      saveLocalDb(db);
      return { success: true, rental };
    }
  }

  // Post Chat
  if (path.startsWith('/api/chats/')) {
    const id = path.replace('/api/chats/', '');
    db.chats[id] = db.chats[id] || [];
    const newMsg = {
      id: 'msg-' + Date.now(),
      senderId: data.senderId,
      senderName: data.senderName || 'Peer',
      text: data.text,
      timestamp: new Date().toISOString()
    };
    db.chats[id].push(newMsg);
    saveLocalDb(db);
    return newMsg;
  }

  if (path === '/api/reset') {
    localStorage.setItem('rkgit_local_db', JSON.stringify(clientMockDb));
    return { success: true };
  }

  return { success: true };
}

// --- API Helpers (Direct HTTP + Offline Fallback) ---
const API_BASE = (window.location.protocol === 'file:') ? 'http://localhost:3000' : '';

async function apiGet(path) {
  try {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    return handleClientGet(path);
  }
}

async function apiPost(path, data = {}) {
  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    return handleClientPost(path, data);
  }
}

// ==========================================
// --- INITIALIZATION ---
// ==========================================
async function init() {
  if (window.location.protocol === 'file:') {
    const notice = document.getElementById('fileProtocolNotice');
    if (notice) notice.style.display = 'block';
  }

  // Load users
  state.users = await apiGet('/api/users') || [];
  
  // Try restore saved user or default to Rohan (Borrower)
  const savedUserId = localStorage.getItem('rkgit_user_id');
  if (savedUserId && state.users.some(u => u.id === savedUserId)) {
    state.currentUser = state.users.find(u => u.id === savedUserId);
  } else {
    state.currentUser = state.users[0] || null;
  }

  // Restore saved portal or match user's role
  const savedPortal = localStorage.getItem('rkgit_portal');
  if (savedPortal) {
    state.currentPortal = savedPortal;
  } else if (state.currentUser && state.currentUser.primaryRole) {
    state.currentPortal = state.currentUser.primaryRole;
  }

  updatePortalUI();
  updateUserDisplay();

  // Load items, rentals, stats, sms status
  await Promise.all([
    fetchItems(),
    fetchRentals(),
    fetchStats(),
    checkSmsGatewayStatus()
  ]);

  setupEventListeners();

  // Pre-select initial rental if exists
  if (state.rentals.length > 0) {
    state.selectedRentalId = state.rentals[0].id;
  }

  // Background polling for real-time chat & rentals every 1.5s
  state.chatPollInterval = setInterval(async () => {
    if (state.activeTab === 'chat') {
      await renderChatMessagesOnly();
    } else if (state.activeTab === 'rentals') {
      await fetchRentals(false);
    }
  }, 1500);
}

// ==========================================
// --- DUAL PORTAL SWITCHER & NAVIGATION ---
// ==========================================
function setPortal(portalName) {
  state.currentPortal = portalName;
  localStorage.setItem('rkgit_portal', portalName);
  updatePortalUI();

  // Auto-switch default user to match portal context if needed
  if (portalName === 'lender' && state.currentUser.primaryRole !== 'lender') {
    const lenderUser = state.users.find(u => u.primaryRole === 'lender');
    if (lenderUser) switchUser(lenderUser.id);
  } else if (portalName === 'borrower' && state.currentUser.primaryRole !== 'borrower') {
    const borrowerUser = state.users.find(u => u.primaryRole === 'borrower');
    if (borrowerUser) switchUser(borrowerUser.id);
  }

  // Default tab for each portal
  if (portalName === 'borrower') {
    switchTab('browse');
  } else {
    switchTab('list');
    renderMyInventory();
  }

  showToast(`Switched to ${portalName === 'borrower' ? 'Borrower / Buyer Portal' : 'Lender / Hosteler Portal'}`, 'info');
}

function updatePortalUI() {
  const isBorrower = state.currentPortal === 'borrower';
  el.btnPortalBorrower.classList.toggle('active', isBorrower);
  el.btnPortalLender.classList.toggle('active', !isBorrower);

  if (isBorrower) {
    el.portalIndicatorBadge.textContent = '🎓 BORROWER / BUYER PORTAL ACTIVE';
    el.portalIndicatorDesc.textContent = 'Browse & rent Casio fx-991ES, lab coats, and engineering equipment for urgent practical exams.';
    renderBorrowerTabs();
  } else {
    el.portalIndicatorBadge.textContent = '💼 LENDER / HOSTELER PORTAL ACTIVE';
    el.portalIndicatorDesc.textContent = 'List idle items from your hostel desk, accept rental requests, and earn pocket money!';
    renderLenderTabs();
  }
}

function renderBorrowerTabs() {
  el.tabsContainer.innerHTML = `
    <button class="nav-tab ${state.activeTab === 'browse' ? 'active' : ''}" data-tab="browse">
      <span class="tab-icon">🛍️</span>
      <span class="tab-text">Search & Rent Gear</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'rentals' ? 'active' : ''}" data-tab="rentals">
      <span class="tab-icon">🤝</span>
      <span class="tab-text">My Borrowed Items & Handshake</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
      <span class="tab-icon">💬</span>
      <span class="tab-text">Campus Chat</span>
      <span class="badge-dot"></span>
    </button>
    <button class="nav-tab ${state.activeTab === 'impact' ? 'active' : ''}" data-tab="impact">
      <span class="tab-icon">📊</span>
      <span class="tab-text">Sharing Economy & Savings</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'comic' ? 'active' : ''}" data-tab="comic">
      <span class="tab-icon">📖</span>
      <span class="tab-text">How It Works (Comic)</span>
    </button>
  `;
  attachTabClickListeners();
}

function renderLenderTabs() {
  el.tabsContainer.innerHTML = `
    <button class="nav-tab ${state.activeTab === 'list' ? 'active' : ''}" data-tab="list">
      <span class="tab-icon">➕</span>
      <span class="tab-text">List Item (Hostel Desk)</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'rentals' ? 'active' : ''}" data-tab="rentals">
      <span class="tab-icon">📥</span>
      <span class="tab-text">Booking Requests & Handshake</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'inventory' ? 'active' : ''}" data-tab="inventory">
      <span class="tab-icon">📦</span>
      <span class="tab-text">My Listed Equipment</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">
      <span class="tab-icon">💬</span>
      <span class="tab-text">Campus Chat</span>
      <span class="badge-dot"></span>
    </button>
    <button class="nav-tab ${state.activeTab === 'impact' ? 'active' : ''}" data-tab="impact">
      <span class="tab-icon">💰</span>
      <span class="tab-text">Hostel Earnings & Stats</span>
    </button>
    <button class="nav-tab ${state.activeTab === 'comic' ? 'active' : ''}" data-tab="comic">
      <span class="tab-icon">📖</span>
      <span class="tab-text">How It Works (Comic)</span>
    </button>
  `;
  attachTabClickListeners();
}

function attachTabClickListeners() {
  el.tabsContainer.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Toggle active class on nav tabs
  el.tabsContainer.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });

  // Toggle active class on section
  document.querySelectorAll('.tab-section').forEach(s => {
    s.classList.toggle('active', s.id === `tab-${tabId}`);
  });

  if (tabId === 'rentals') {
    renderRentals();
    renderHandshakePane();
  } else if (tabId === 'chat') {
    renderChat();
  } else if (tabId === 'inventory') {
    renderMyInventory();
  } else if (tabId === 'impact') {
    fetchStats();
  }
}

// ==========================================
// --- USER STATE & AUTHENTICATION ---
// ==========================================
function updateUserDisplay() {
  if (!state.currentUser) return;
  localStorage.setItem('rkgit_user_id', state.currentUser.id);

  el.currentUserAvatar.textContent = state.currentUser.avatar || '🧑‍🎓';
  el.currentUserName.textContent = state.currentUser.name;
  el.currentUserRoleTag.textContent = state.currentUser.primaryRole === 'lender' ? 'Lender' : 'Borrower';
  el.currentUserPhone.textContent = `📱 +91 ${state.currentUser.phone || '9876543210'}`;
  el.userWalletAmount.textContent = `₹${state.currentUser.walletBalance || 0}`;
  el.userEscrowAmount.textContent = `₹${state.currentUser.escrowBalance || 0}`;
  
  if (el.roleFilterIndicator) {
    el.roleFilterIndicator.textContent = `Viewing as ${state.currentUser.name} (${state.currentUser.primaryRole.toUpperCase()})`;
  }

  // Update preview card in listing form
  if (el.previewAvatar) el.previewAvatar.textContent = state.currentUser.avatar;
  if (el.previewOwnerName) el.previewOwnerName.textContent = state.currentUser.name;
}

function switchUser(userId) {
  const target = state.users.find(u => u.id === userId);
  if (!target) return;
  state.currentUser = target;
  updateUserDisplay();
  renderItems();
  renderRentals();
  renderHandshakePane();
  renderChat();
  renderMyInventory();
}

// --- Mobile OTP Authentication Modal Logic ---
function openAuthModal() {
  el.modalAuth.classList.remove('hidden');
  el.groupOtpInput.classList.add('hidden');
  el.groupPhoneInput.classList.remove('hidden');
}

function closeAuthModal() {
  el.modalAuth.classList.add('hidden');
  clearInterval(state.otpCountdownTimer);
}

async function checkSmsGatewayStatus() {
  const cfg = await apiGet('/api/sms/config');
  if (cfg && el.smsStatusPill) {
    if (cfg.hasFast2smsKey || cfg.hasTwilioConfig) {
      el.smsStatusPill.textContent = '🟢 Real SMS Active';
      el.smsStatusPill.style.background = '#dcfce7';
      el.smsStatusPill.style.color = '#166534';
    } else {
      el.smsStatusPill.textContent = '⚪ Simulator Active';
      el.smsStatusPill.style.background = '#e2e8f0';
      el.smsStatusPill.style.color = '#64748b';
    }
  }
}

async function requestMobileOtp(phone) {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    showToast('Please enter a valid 10-digit mobile number', 'info');
    return;
  }

  const res = await apiPost('/api/auth/send-otp', { phone: cleanPhone });
  if (res && res.success) {
    if (window.playAudioTone) window.playAudioTone('message');
    el.groupOtpInput.classList.remove('hidden');
    el.loginOtp.value = res.otp; // Pre-fill for seamless testing
    el.loginOtp.focus();
    el.groupOtpInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (res.deliveredReal) {
      el.otpSimulatorAlert.innerHTML = `📲 <strong>Real SMS Dispatched!</strong> Sent directly to your physical mobile (+91 ${res.phone}). Check your SMS messages!`;
      el.otpSimulatorAlert.style.background = '#ecfdf5';
      el.otpSimulatorAlert.style.borderColor = '#6ee7b7';
      el.otpSimulatorAlert.style.color = '#065f46';
      showToast(`Real SMS dispatched to +91 ${res.phone}!`, 'success');
    } else {
      el.otpSimulatorAlert.innerHTML = `🔔 <strong>SMS Simulator:</strong> Your RKGIT Verification OTP is: <span id="displayedSimulatedOtp" class="bold-otp">${res.otp}</span>`;
      el.otpSimulatorAlert.style.background = '#eff6ff';
      el.otpSimulatorAlert.style.borderColor = '#bfdbfe';
      el.otpSimulatorAlert.style.color = '#1e40af';
      showToast(`SMS Sent! Verification OTP is: ${res.otp}`, 'success');
    }

    startOtpCountdown(30);
  } else {
    showToast(res?.error || 'Failed to send OTP', 'info');
  }
}

function startOtpCountdown(seconds) {
  let left = seconds;
  el.otpCountdownTimer.textContent = `Resend OTP in ${left}s`;
  el.btnResendOtp.style.display = 'none';
  clearInterval(state.otpCountdownTimer);

  state.otpCountdownTimer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(state.otpCountdownTimer);
      el.otpCountdownTimer.textContent = 'Did not receive OTP?';
      el.btnResendOtp.style.display = 'inline-block';
    } else {
      el.otpCountdownTimer.textContent = `Resend OTP in ${left}s`;
    }
  }, 1000);
}

async function submitOtpLogin(phone, otp, roleIntent) {
  const res = await apiPost('/api/auth/verify-otp', {
    phone: phone,
    otp: otp,
    role: roleIntent
  });

  if (res && res.success) {
    if (window.playAudioTone) window.playAudioTone('success');
    showToast(`Welcome ${res.user.name}! Logged in successfully.`, 'success');

    // Refresh users
    state.users = await apiGet('/api/users') || state.users;
    state.currentUser = res.user;
    updateUserDisplay();

    // Set portal according to user choice
    setPortal(roleIntent || res.user.primaryRole || 'borrower');
    closeAuthModal();
    await Promise.all([fetchItems(), fetchRentals()]);
  } else {
    showToast(res?.error || 'Invalid OTP code', 'info');
  }
}

// ==========================================
// --- ITEMS (Browse & Search) ---
// ==========================================
async function fetchItems() {
  const params = new URLSearchParams();
  if (state.filters.q) params.set('q', state.filters.q);
  if (state.filters.category && state.filters.category !== 'All') params.set('category', state.filters.category);
  if (state.filters.urgent) params.set('urgent', 'true');

  state.items = await apiGet(`/api/items?${params.toString()}`) || [];
  renderItems();
}

function renderItems() {
  el.itemsGrid.innerHTML = '';
  el.itemsCountTitle.textContent = `Available On-Campus Items (${state.items.length})`;

  if (state.items.length === 0) {
    el.itemsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 16px; border: 1px dashed var(--border);">
        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</p>
        <h4>No equipment matching your search</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem;">Try clearing search or filters to see all campus equipment.</p>
      </div>
    `;
    return;
  }

  state.items.forEach(item => {
    const owner = state.users.find(u => u.id === item.ownerId) || {
      name: 'RKGIT Peer', avatar: '🧑‍🎓', hostel: item.hostelLocation
    };
    const isOwner = state.currentUser && state.currentUser.id === item.ownerId;

    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-img-wrap">
        <img src="${item.image}" alt="${item.title}" onerror="this.src='https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80'">
        ${item.urgent15Min ? '<span class="item-urgent-badge">⚡ 15-Min Flash</span>' : ''}
        <span class="item-cat-badge">${item.category}</span>
      </div>
      <div class="item-body">
        <h4>${item.title}</h4>
        <div class="item-owner-row">
          <span class="owner-avatar">${owner.avatar}</span>
          <div class="owner-text">
            <span class="owner-name">${owner.name}</span>
            <span class="owner-loc">${item.hostelLocation} • 📍 ${item.pickupSpot.split('/')[0]}</span>
          </div>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.4;">
          ${item.description.length > 80 ? item.description.substring(0, 80) + '...' : item.description}
        </p>
        <div class="item-pricing">
          <div class="price-daily">
            <span class="price-val">₹${item.pricePerDay}</span>
            <span class="price-unit">/ day</span>
          </div>
          <div class="price-deposit">
            <span class="deposit-lbl">Deposit:</span>
            <span class="deposit-val">₹${item.deposit}</span>
          </div>
        </div>
        ${
          !item.isAvailable 
            ? `<button class="btn-rent-disabled" disabled>Currently Rented Out</button>`
            : isOwner
              ? `<button class="btn-rent-disabled" disabled>Listed by you (${owner.name.split(' ')[0]})</button>`
              : `<button class="btn-rent-action" data-item-id="${item.id}">⚡ Rent for Practical / Exam ➔</button>`
        }
      </div>
    `;

    const btnRent = card.querySelector('.btn-rent-action');
    if (btnRent) {
      btnRent.addEventListener('click', () => openRentModal(item));
    }

    el.itemsGrid.appendChild(card);
  });
}

function renderMyInventory() {
  if (!el.myInventoryGrid || !state.currentUser) return;
  el.myInventoryGrid.innerHTML = '';

  const myItems = state.items.filter(i => i.ownerId === state.currentUser.id);
  if (myItems.length === 0) {
    el.myInventoryGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff; border-radius: 16px; border: 1px dashed var(--border);">
        <p style="font-size: 2rem;">📦</p>
        <h4>No equipment listed yet</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">List your Casio calculator, lab coat, or mini drafter to start earning pocket money!</p>
        <button class="btn-comic-action" onclick="switchTab('list')">➕ List an Item Now</button>
      </div>
    `;
    return;
  }

  myItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-img-wrap">
        <img src="${item.image}" alt="${item.title}">
        <span class="item-cat-badge">${item.category}</span>
      </div>
      <div class="item-body">
        <h4>${item.title}</h4>
        <div class="item-pricing">
          <div class="price-daily">
            <span class="price-val">₹${item.pricePerDay}</span>
            <span class="price-unit">/ day</span>
          </div>
          <div class="price-deposit">
            <span class="deposit-lbl">Deposit:</span>
            <span class="deposit-val">₹${item.deposit}</span>
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--success); font-weight: 700; margin-bottom: 0.5rem;">
          ${item.isAvailable ? '✅ Ready for Campus Rent' : '🔒 Currently Rented Out'}
        </div>
      </div>
    `;
    el.myInventoryGrid.appendChild(card);
  });
}

// ==========================================
// --- RENT MODAL LOGIC ---
// ==========================================
function openRentModal(item) {
  state.modalItem = item;
  const owner = state.users.find(u => u.id === item.ownerId) || { name: 'Campus Peer', hostel: 'Hostel' };

  el.modalItemTitle.textContent = `Rent ${item.title}`;
  el.modalItemImg.src = item.image;
  el.modalOwnerName.textContent = owner.name;
  el.modalOwnerHostel.textContent = item.hostelLocation;
  el.modalItemCondition.textContent = item.condition || 'Verified Working';
  el.modalDailyRate.textContent = item.pricePerDay;
  el.modalDepositRate.textContent = item.deposit;
  el.modalItemId.value = item.id;
  el.rentDurationDays.value = 1;
  el.calcDailyRate.textContent = item.pricePerDay;
  el.calcDepositTotal.textContent = item.deposit;
  el.calcDepositNote.textContent = item.deposit;

  document.querySelectorAll('.btn-duration').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.days === '1');
  });

  updateModalCalculations(1);
  el.modalRentItem.classList.remove('hidden');
}

function updateModalCalculations(days) {
  if (!state.modalItem) return;
  const rentTotal = state.modalItem.pricePerDay * days;
  const deposit = state.modalItem.deposit;
  const grandTotal = rentTotal + deposit;

  el.calcDurationText.textContent = `${days} day${days > 1 ? 's' : ''}`;
  el.calcRentTotal.textContent = `₹${rentTotal}`;
  el.calcGrandTotal.textContent = `₹${grandTotal}`;
}

function closeModal() {
  el.modalRentItem.classList.add('hidden');
  state.modalItem = null;
}

// ==========================================
// --- THE HANDSHAKE & RENTALS ---
// ==========================================
async function fetchRentals(reRender = true) {
  state.rentals = await apiGet('/api/rentals') || [];
  if (reRender) {
    renderRentals();
    renderHandshakePane();
  }
}

function renderRentals() {
  el.rentalsList.innerHTML = '';
  if (!state.currentUser) return;

  const userRentals = state.rentals.filter(r => 
    r.borrowerId === state.currentUser.id || r.lenderId === state.currentUser.id
  );

  el.userRentalsCount.textContent = userRentals.length;

  if (userRentals.length === 0) {
    el.rentalsList.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; background: #fff; border-radius: 12px; border: 1.5px dashed var(--border);">
        <p style="font-size: 2rem;">🤝</p>
        <h4 style="margin: 0.5rem 0;">No Active Campus Rentals</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          ${state.currentPortal === 'borrower' 
            ? 'Browse available equipment and send a 1-day rental request.' 
            : 'Unused gear listed from your hostel room will appear here once requested.'}
        </p>
      </div>
    `;
    return;
  }

  userRentals.forEach(rental => {
    const item = state.items.find(i => i.id === rental.itemId) || { title: 'Exam Equipment', image: '' };
    const borrower = state.users.find(u => u.id === rental.borrowerId) || { name: 'Borrower', avatar: '👨‍🎓' };
    const lender = state.users.find(u => u.id === rental.lenderId) || { name: 'Lender', avatar: '🧑‍💻' };
    const isLender = state.currentUser.id === rental.lenderId;
    const isSelected = rental.id === state.selectedRentalId;

    const card = document.createElement('div');
    card.className = `rental-item-card ${isSelected ? 'active-card' : ''}`;
    card.innerHTML = `
      <div class="rental-top-row">
        <span class="status-badge status-${rental.status}">
          ${rental.status.replace(/_/g, ' ')}
        </span>
        <span style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">₹${rental.rentAmount} (${rental.durationDays}d)</span>
      </div>

      <div class="rental-item-title">${item.title}</div>

      <div class="rental-peers-line">
        <strong>${borrower.avatar} ${borrower.name}</strong> 
        <span>(Borrower)</span> ⇄ 
        <strong>${lender.avatar} ${lender.name}</strong> 
        <span>(Lender)</span>
      </div>

      <div class="rental-details-grid">
        <div>📍 Spot: <strong>${rental.meetupSpot.split('/')[0]}</strong></div>
        <div>🔒 Escrow Deposit: <strong>₹${rental.depositAmount}</strong></div>
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
        ${
          rental.status === 'REQUESTED' && isLender
            ? `<button class="btn-verify-handshake btn-accept-card" style="flex: 1; padding: 0.45rem;" data-rental-id="${rental.id}">ACCEPT ✓</button>
               <button class="btn-ghost btn-reject-card" style="padding: 0.45rem;" data-rental-id="${rental.id}">Decline</button>`
            : `<button class="btn-comic-action btn-view-handshake" style="flex: 1;" data-rental-id="${rental.id}">
                ${rental.status === 'ACTIVE_RENTAL' ? '⏱️ View Active Rental & Return' : '🤝 Open Handshake QR/OTP'}
               </button>`
        }
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-accept-card') || e.target.closest('.btn-reject-card')) return;
      state.selectedRentalId = rental.id;
      renderRentals();
      renderHandshakePane();
    });

    const btnAccept = card.querySelector('.btn-accept-card');
    if (btnAccept) {
      btnAccept.addEventListener('click', (e) => {
        e.stopPropagation();
        acceptRentalRequest(rental.id);
      });
    }

    const btnReject = card.querySelector('.btn-reject-card');
    if (btnReject) {
      btnReject.addEventListener('click', (e) => {
        e.stopPropagation();
        rejectRentalRequest(rental.id);
      });
    }

    el.rentalsList.appendChild(card);
  });
}

function renderHandshakePane() {
  if (!state.selectedRentalId) {
    el.handshakeEmptyState.classList.remove('hidden');
    el.handshakeActivePane.classList.add('hidden');
    return;
  }

  const rental = state.rentals.find(r => r.id === state.selectedRentalId);
  if (!rental) {
    el.handshakeEmptyState.classList.remove('hidden');
    el.handshakeActivePane.classList.add('hidden');
    return;
  }

  el.handshakeEmptyState.classList.add('hidden');
  el.handshakeActivePane.classList.remove('hidden');

  const item = state.items.find(i => i.id === rental.itemId) || { title: 'Item' };
  const borrower = state.users.find(u => u.id === rental.borrowerId) || { name: 'Borrower', avatar: '👨‍🎓' };
  const lender = state.users.find(u => u.id === rental.lenderId) || { name: 'Lender', avatar: '🧑‍💻' };
  const isLender = state.currentUser && state.currentUser.id === rental.lenderId;

  let paneHtml = `
    <div class="handshake-header-box">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="status-badge status-${rental.status}">${rental.status.replace(/_/g, ' ')}</span>
          <h3 style="margin-top: 0.35rem;">${item.title}</h3>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Rent: <strong>₹${rental.rentAmount}</strong></span><br>
          <span style="font-size: 0.75rem; color: var(--success); font-weight: 700;">Deposit: ₹${rental.depositAmount} (Escrow)</span>
        </div>
      </div>
      <div class="handshake-spot-pill">📍 Handshake Spot: ${rental.meetupSpot}</div>
    </div>
  `;

  if (rental.status === 'REQUESTED') {
    if (isLender) {
      paneHtml += `
        <div style="text-align: center; padding: 1.5rem; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px;">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔔</div>
          <h4 style="color: #92400e; font-size: 1.1rem; margin-bottom: 0.35rem;">Incoming Rental Request from ${borrower.name}!</h4>
          <p style="font-size: 0.82rem; color: #b45309; margin-bottom: 1.25rem;">
            <em>"${rental.note}"</em><br>
            Duration: <strong>${rental.durationDays} day(s)</strong> • Rent: <strong>₹${rental.rentAmount}</strong>
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button class="btn-verify-handshake" id="btnAcceptRequestBig" style="padding: 0.75rem 2rem; font-size: 1rem;">ACCEPT ✓</button>
            <button class="btn-ghost" id="btnRejectRequestBig" style="padding: 0.75rem 1.5rem;">Decline</button>
          </div>
        </div>
      `;
    } else {
      paneHtml += `
        <div style="text-align: center; padding: 2rem; background: #f8fafc; border: 1.5px dashed var(--border); border-radius: 16px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⏳</div>
          <h4 style="font-size: 1.1rem; margin-bottom: 0.35rem;">Request Sent to ${lender.name}!</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
            Awaiting ${lender.name.split(' ')[0]}'s confirmation. Switch to <strong>Lender Portal</strong> on top to simulate accepting!
          </p>
          <button class="btn-comic-action" id="btnSwitchToLender">Switch to ${lender.name.split(' ')[0]} (Lender View) ➔</button>
        </div>
      `;
    }
  } else if (rental.status === 'CONFIRMED_AWAITING_HANDSHAKE') {
    paneHtml += `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.82rem; color: #166534;">
        ✅ <strong>Request Confirmed!</strong> Meet at <strong>${rental.meetupSpot}</strong>. Present this QR or 4-digit OTP for instant physical verification.
      </div>

      <div class="qr-otp-container">
        <div class="qr-box">
          <div class="qr-frame">
            <div id="handshakeQrCanvas"></div>
            <div class="qr-radar-line"></div>
          </div>
          <span class="qr-caption">Dynamic Campus QR</span>
        </div>

        <div class="otp-box">
          <span class="otp-label">Dynamic 4-Digit OTP</span>
          <div class="otp-digits">${rental.pickupOtp}</div>
          <span class="otp-countdown">⏱️ Refreshes in 45s</span>
          <small style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.4rem;">Present to peer upon physical meet</small>
        </div>
      </div>

      <div class="verification-action-box">
        <div class="verif-title">
          🛡️ Perform Handshake Verification:
        </div>
        <div class="verif-input-row">
          <input type="text" id="inputHandshakeOtp" placeholder="Enter 4-Digit OTP" maxlength="4" value="${rental.pickupOtp}">
          <button class="btn-verify-handshake" id="btnSubmitHandshakeOtp">Verify & Handover ✓</button>
        </div>
        <button class="btn-simulate-scan" id="btnSimulateQrScan">
          ⚡ 1-Tap QR Code Scan Simulation (${rental.pickupQrCode})
        </button>
      </div>
    `;
  } else if (rental.status === 'ACTIVE_RENTAL') {
    paneHtml += `
      <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; padding: 1.25rem; border-radius: 16px; text-align: center;">
        <span style="font-size: 2.5rem;">🎉</span>
        <h4 style="font-size: 1.15rem; color: #065f46; margin: 0.35rem 0;">Active Campus Rental</h4>
        <p style="font-size: 0.82rem; color: #047857; margin-bottom: 0.85rem;">
          Item handed over safely at ${rental.meetupSpot}! Escrow safety deposit of <strong>₹${rental.depositAmount}</strong> is locked safely.
        </p>
        <div style="display: inline-block; background: #ffffff; padding: 0.5rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.85rem; color: #065f46; border: 1px solid #6ee7b7;">
          ⏱️ Active Exam / Lab Session • In Progress
        </div>
      </div>

      <div style="border-top: 1px dashed var(--border); padding-top: 1rem;">
        <h4>Finished with the Practical Exam?</h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">
          Meet at <strong>${rental.meetupSpot}</strong> to return the item and instantly unlock the <strong>₹${rental.depositAmount}</strong> safety deposit!
        </p>
        <button class="btn-primary-lg" id="btnInitiateReturn" style="background: linear-gradient(135deg, #059669, #10b981);">
          🔄 Initiate Return Handshake ➔
        </button>
      </div>
    `;
  } else if (rental.status === 'RETURN_AWAITING_HANDSHAKE') {
    paneHtml += `
      <div style="background: #fdf2f8; border: 1.5px solid #fbcfe8; padding: 1rem; border-radius: 16px;">
        <h4 style="color: #9d174d; font-size: 1.05rem; margin-bottom: 0.25rem;">🔄 Return Handshake in Progress</h4>
        <p style="font-size: 0.82rem; color: #be123c;">
          Meet at ${rental.meetupSpot}. Lender will verify the return OTP / QR to release safety deposit back to borrower and credit rent earnings!
        </p>
      </div>

      <div class="qr-otp-container">
        <div class="qr-box">
          <div class="qr-frame">
            <div id="handshakeReturnQrCanvas"></div>
            <div class="qr-radar-line"></div>
          </div>
          <span class="qr-caption">Return Verification QR</span>
        </div>

        <div class="otp-box">
          <span class="otp-label">Return OTP</span>
          <div class="otp-digits" style="color: #059669;">${rental.returnOtp}</div>
          <span class="otp-countdown" style="color: #059669;">Ready for check-in</span>
        </div>
      </div>

      <div class="verification-action-box" style="background: #f0fdf4; border-color: #bbf7d0;">
        <div class="verif-title" style="color: #166534;">
          🛡️ Lender: Confirm Item Return & Release Deposit
        </div>
        <div class="verif-input-row">
          <input type="text" id="inputReturnOtp" placeholder="Enter Return OTP" maxlength="4" value="${rental.returnOtp}" style="border-color: #34d399;">
          <button class="btn-verify-handshake" id="btnSubmitReturnOtp">Complete Return ✓</button>
        </div>
        <button class="btn-simulate-scan" id="btnSimulateReturnScan" style="border-color: #34d399; color: #065f46;">
          ⚡ 1-Tap QR Scan Return Simulation
        </button>
      </div>
    `;
  } else if (rental.status === 'COMPLETED') {
    paneHtml += `
      <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; padding: 2rem; border-radius: 16px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
        <h3 style="color: #0f172a; margin-bottom: 0.4rem;">Rental Completed Successfully!</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.25rem;">
          ✓ ₹${rental.depositAmount} safety deposit unlocked & refunded to ${borrower.name}.<br>
          ✓ ₹${rental.rentAmount} pocket money credited to ${lender.name}'s wallet!
        </p>
        <div style="display: flex; gap: 0.5rem; justify-content: center;">
          <span class="campus-trust-pill">⭐ Trust Rating: 5.0 / 5.0</span>
          <span class="campus-trust-pill" style="background: #e0e7ff; color: #3730a3;">♻️ Circular Campus Share</span>
        </div>
      </div>
    `;
  }

  el.handshakeActivePane.innerHTML = paneHtml;

  // Render QR Codes
  if (document.getElementById('handshakeQrCanvas')) {
    new QRCode(document.getElementById('handshakeQrCanvas'), {
      text: rental.pickupQrCode,
      width: 140,
      height: 140,
      colorDark: '#881337',
      colorLight: '#ffffff'
    });
  }

  if (document.getElementById('handshakeReturnQrCanvas')) {
    new QRCode(document.getElementById('handshakeReturnQrCanvas'), {
      text: rental.returnQrCode,
      width: 140,
      height: 140,
      colorDark: '#059669',
      colorLight: '#ffffff'
    });
  }

  // Bind Buttons
  const btnAcceptBig = document.getElementById('btnAcceptRequestBig');
  if (btnAcceptBig) btnAcceptBig.addEventListener('click', () => acceptRentalRequest(rental.id));

  const btnRejectBig = document.getElementById('btnRejectRequestBig');
  if (btnRejectBig) btnRejectBig.addEventListener('click', () => rejectRentalRequest(rental.id));

  const btnSwitchLender = document.getElementById('btnSwitchToLender');
  if (btnSwitchLender) btnSwitchLender.addEventListener('click', () => {
    switchUser(rental.lenderId);
    setPortal('lender');
  });

  const btnSubmitOtp = document.getElementById('btnSubmitHandshakeOtp');
  if (btnSubmitOtp) {
    btnSubmitOtp.addEventListener('click', () => {
      const code = document.getElementById('inputHandshakeOtp').value.trim();
      verifyPickupHandshake(rental.id, code);
    });
  }

  const btnSimQr = document.getElementById('btnSimulateQrScan');
  if (btnSimQr) {
    btnSimQr.addEventListener('click', () => {
      verifyPickupHandshake(rental.id, rental.pickupQrCode);
    });
  }

  const btnInitReturn = document.getElementById('btnInitiateReturn');
  if (btnInitReturn) {
    btnInitReturn.addEventListener('click', () => initiateReturnRequest(rental.id));
  }

  const btnSubmitReturnOtp = document.getElementById('btnSubmitReturnOtp');
  if (btnSubmitReturnOtp) {
    btnSubmitReturnOtp.addEventListener('click', () => {
      const code = document.getElementById('inputReturnOtp').value.trim();
      verifyReturnHandshake(rental.id, code);
    });
  }

  const btnSimReturnQr = document.getElementById('btnSimulateReturnScan');
  if (btnSimReturnQr) {
    btnSimReturnQr.addEventListener('click', () => {
      verifyReturnHandshake(rental.id, rental.returnQrCode);
    });
  }
}

async function acceptRentalRequest(rentalId) {
  const res = await apiPost(`/api/rentals/${rentalId}/accept`);
  if (res && res.status) {
    if (window.playAudioTone) window.playAudioTone('success');
    showToast('Rental request accepted! Handshake QR/OTP generated.', 'success');
    await fetchRentals();
  }
}

async function rejectRentalRequest(rentalId) {
  const res = await apiPost(`/api/rentals/${rentalId}/reject`);
  if (res) {
    showToast('Rental request declined.', 'info');
    await fetchRentals();
  }
}

async function verifyPickupHandshake(rentalId, code) {
  if (!code) {
    showToast('Please enter the 4-digit OTP or scan QR code', 'info');
    return;
  }

  const isQr = code.startsWith('RKGIT-HANDSHAKE');
  const payload = isQr ? { qrCode: code } : { otp: code };

  const res = await apiPost(`/api/rentals/${rentalId}/verify-pickup`, payload);
  if (res && res.success) {
    if (window.playAudioTone) window.playAudioTone('success');
    showToast('🤝 Handshake verified! Safety deposit locked in escrow.', 'success');
    state.users = await apiGet('/api/users') || state.users;
    state.currentUser = state.users.find(u => u.id === state.currentUser.id);
    updateUserDisplay();
    await fetchRentals();
  } else {
    showToast(res?.error || 'Invalid OTP / QR Code', 'info');
  }
}

async function initiateReturnRequest(rentalId) {
  const res = await apiPost(`/api/rentals/${rentalId}/request-return`);
  if (res && res.status) {
    if (window.playAudioTone) window.playAudioTone('message');
    showToast('Return handshake initiated! Present Return OTP/QR to lender.', 'info');
    await fetchRentals();
  }
}

async function verifyReturnHandshake(rentalId, code) {
  if (!code) {
    showToast('Please enter the Return OTP or scan QR code', 'info');
    return;
  }

  const isQr = code.startsWith('RKGIT-HANDSHAKE');
  const payload = isQr ? { qrCode: code } : { otp: code };

  const res = await apiPost(`/api/rentals/${rentalId}/verify-return`, payload);
  if (res && res.success) {
    if (window.playAudioTone) window.playAudioTone('success');
    showToast('🎉 Return complete! Deposit unlocked and rent credited!', 'success');
    state.users = await apiGet('/api/users') || state.users;
    state.currentUser = state.users.find(u => u.id === state.currentUser.id);
    updateUserDisplay();
    await Promise.all([fetchRentals(), fetchStats(), fetchItems()]);
  } else {
    showToast(res?.error || 'Invalid Return Code', 'info');
  }
}

// ==========================================
// --- 100% FUNCTIONAL CAMPUS CHAT SYSTEM ---
// ==========================================
async function renderChat() {
  const threads = await apiGet(`/api/chats?userId=${state.currentUser?.id || ''}`) || [];
  el.chatConversationsList.innerHTML = '';

  threads.forEach(th => {
    const isActive = th.channelId === state.activeChatChannel;
    const div = document.createElement('div');
    div.className = `chat-convo-item ${isActive ? 'active' : ''}`;

    const avatar = th.type === 'GLOBAL' ? '🏛️' : (th.otherUser?.avatar || '🧑‍🎓');
    const previewText = th.lastMessage ? th.lastMessage.text : th.subtitle;

    div.innerHTML = `
      <span class="chat-convo-avatar">${avatar}</span>
      <div class="chat-convo-info">
        <div class="chat-convo-top">
          <span class="chat-convo-name">${th.title}</span>
          <span class="chat-convo-time">Live</span>
        </div>
        <div class="chat-convo-preview">${previewText}</div>
      </div>
    `;

    div.addEventListener('click', () => {
      state.activeChatChannel = th.channelId;
      renderChat();
    });

    el.chatConversationsList.appendChild(div);
  });

  // Update header for active channel
  const activeThread = threads.find(t => t.channelId === state.activeChatChannel) || threads[0];
  if (activeThread) {
    state.activeChatChannel = activeThread.channelId;
    el.activeChatAvatar.textContent = activeThread.type === 'GLOBAL' ? '🏛️' : (activeThread.otherUser?.avatar || '🧑‍🎓');
    el.activeChatName.textContent = activeThread.title;
    el.activeChatStatus.textContent = activeThread.subtitle;

    if (activeThread.type === 'RENTAL') {
      el.btnGoToHandshake.style.display = 'block';
      el.btnGoToHandshake.onclick = () => {
        state.selectedRentalId = activeThread.rentalId;
        switchTab('rentals');
      };
    } else {
      el.btnGoToHandshake.style.display = 'none';
    }
  }

  await renderChatMessagesOnly();
}

async function renderChatMessagesOnly() {
  if (!state.activeChatChannel) return;
  const messages = await apiGet(`/api/chats/${state.activeChatChannel}`) || [];

  el.chatMessagesScroll.innerHTML = '';
  if (messages.length === 0) {
    el.chatMessagesScroll.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem;">
        No messages yet in this channel. Say hello to your campus peers!
      </div>
    `;
    return;
  }

  messages.forEach(msg => {
    const div = document.createElement('div');
    if (msg.senderId === 'SYSTEM') {
      div.className = 'chat-msg msg-system';
      div.textContent = msg.text;
    } else {
      const isMe = state.currentUser && state.currentUser.id === msg.senderId;
      div.className = `chat-msg ${isMe ? 'msg-me' : 'msg-other'}`;

      const senderName = msg.senderName || (isMe ? 'You' : 'Peer');
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      div.innerHTML = `
        ${!isMe ? `<span class="msg-sender-name">${senderName}</span>` : ''}
        <div>${msg.text}</div>
        <span class="msg-time">${timeStr}</span>
      `;
    }
    el.chatMessagesScroll.appendChild(div);
  });

  el.chatMessagesScroll.scrollTop = el.chatMessagesScroll.scrollHeight;
}

async function sendChatMessage(text) {
  if (!text || !state.activeChatChannel || !state.currentUser) return;

  const payload = {
    senderId: state.currentUser.id,
    senderName: `${state.currentUser.name} (${state.currentUser.hostel.split(',')[0]})`,
    text: text
  };

  const res = await apiPost(`/api/chats/${state.activeChatChannel}`, payload);
  if (res && res.id) {
    if (window.playAudioTone) window.playAudioTone('message');
    await renderChatMessagesOnly();
  }
}

// ==========================================
// --- IMPACT STATS ---
// ==========================================
async function fetchStats() {
  state.stats = await apiGet('/api/stats') || {};
  if (el.statSaved) el.statSaved.textContent = `₹${(state.stats.totalMoneySaved || 18450).toLocaleString()}`;
  if (el.statEarned) el.statEarned.textContent = `₹${(state.stats.totalEarnedByStudents || 8920).toLocaleString()}`;
  if (el.statHandshakes) el.statHandshakes.textContent = state.stats.completedHandshakes || 142;
  if (el.statWaste) el.statWaste.textContent = `${state.stats.wasteAvertedKg || 58} kg`;
}

// ==========================================
// --- EVENT LISTENERS SETUP ---
// ==========================================
function setupEventListeners() {
  // Dual Portal Buttons
  el.btnPortalBorrower.addEventListener('click', () => setPortal('borrower'));
  el.btnPortalLender.addEventListener('click', () => setPortal('lender'));

  // Auth Modal Buttons
  el.btnOpenLoginModal.addEventListener('click', openAuthModal);
  el.btnChangeUser.addEventListener('click', openAuthModal);
  el.btnCloseAuthModal.addEventListener('click', closeAuthModal);

  // Quick Demo User Buttons
  document.querySelectorAll('.btn-quick-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.dataset.phone;
      const role = btn.dataset.role;
      el.loginPhone.value = phone;
      // Select role radio
      const radio = document.querySelector(`input[name="loginRoleIntent"][value="${role}"]`);
      if (radio) radio.checked = true;
      requestMobileOtp(phone);
    });
  });

  // Send OTP Button
  el.btnSendOtp.addEventListener('click', () => {
    requestMobileOtp(el.loginPhone.value);
  });

  // Resend OTP Link
  el.btnResendOtp.addEventListener('click', () => {
    requestMobileOtp(el.loginPhone.value);
  });

  // Verify OTP & Login Form
  el.formMobileLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = el.loginPhone.value;
    const otp = el.loginOtp.value;
    const roleIntent = document.querySelector('input[name="loginRoleIntent"]:checked')?.value || 'borrower';
    submitOtpLogin(phone, otp, roleIntent);
  });

  // SMS Gateway Config
  if (el.btnToggleSmsConfig && el.smsCfgBody) {
    el.btnToggleSmsConfig.addEventListener('click', () => {
      el.smsCfgBody.classList.toggle('hidden');
    });
  }

  if (el.btnSaveSmsKey && el.inputFast2SmsKey) {
    el.btnSaveSmsKey.addEventListener('click', async () => {
      const key = el.inputFast2SmsKey.value.trim();
      const res = await apiPost('/api/sms/config', { fast2smsApiKey: key });
      if (res && res.success) {
        showToast('Real SMS gateway updated!', 'success');
        await checkSmsGatewayStatus();
        el.smsCfgBody.classList.add('hidden');
      }
    });
  }

  // Comic Jump Actions
  document.querySelectorAll('.btn-comic-action[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.jump));
  });

  // Urgent Toggle
  el.urgentToggle.addEventListener('change', (e) => {
    state.filters.urgent = e.target.checked;
    fetchItems();
  });

  // Search Input with debounce
  let debounceTimer;
  el.searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    el.btnClearSearch.classList.toggle('hidden', !e.target.value);
    debounceTimer = setTimeout(() => {
      state.filters.q = e.target.value;
      fetchItems();
    }, 250);
  });

  el.btnClearSearch.addEventListener('click', () => {
    el.searchInput.value = '';
    el.btnClearSearch.classList.add('hidden');
    state.filters.q = '';
    fetchItems();
  });

  // Category Pills
  el.categoryPills.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      el.categoryPills.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.filters.category = pill.dataset.cat;
      fetchItems();
    });
  });

  // List Form Live Preview
  function updatePreview() {
    el.previewTitle.textContent = el.itemTitle.value || 'Item Title';
    el.previewCatBadge.textContent = el.itemCategory.value;
    el.previewPrice.textContent = `₹${el.itemPrice.value || 25}`;
    el.previewDeposit.textContent = `₹${el.itemDeposit.value || 100}`;
    el.previewLoc.textContent = el.itemHostel.value.split(',')[0];
    el.previewImg.src = el.itemImage.value;
    el.previewUrgentBadge.style.display = el.itemUrgent15.checked ? 'block' : 'none';
  }

  [el.itemTitle, el.itemCategory, el.itemPrice, el.itemDeposit, el.itemHostel, el.itemImage, el.itemUrgent15].forEach(input => {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });

  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      el.itemImage.value = btn.dataset.img;
      updatePreview();
    });
  });

  // List Form Submit (Lender)
  el.formListItem.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser) return;

    const payload = {
      title: el.itemTitle.value,
      category: el.itemCategory.value,
      pricePerDay: Number(el.itemPrice.value),
      deposit: Number(el.itemDeposit.value),
      ownerId: state.currentUser.id,
      hostelLocation: el.itemHostel.value,
      pickupSpot: el.itemPickupSpot.value,
      urgent15Min: el.itemUrgent15.checked,
      condition: el.itemCondition.value,
      description: el.itemDesc.value,
      image: el.itemImage.value
    };

    const res = await apiPost('/api/items', payload);
    if (res && res.id) {
      if (window.playAudioTone) window.playAudioTone('success');
      showToast(`🎉 Listed "${payload.title}" for ₹${payload.pricePerDay}/day from your hostel desk!`, 'success');
      el.formListItem.reset();
      await fetchItems();
      renderMyInventory();
      switchTab('inventory');
    }
  });

  if (el.btnGoToListTab) {
    el.btnGoToListTab.addEventListener('click', () => switchTab('list'));
  }

  // Modal Actions
  el.btnCloseModal.addEventListener('click', closeModal);
  el.btnCancelRental.addEventListener('click', closeModal);

  document.querySelectorAll('.btn-duration').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-duration').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = Number(btn.dataset.days);
      el.rentDurationDays.value = days;
      updateModalCalculations(days);
    });
  });

  el.formSubmitRental.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.modalItem || !state.currentUser) return;

    const payload = {
      itemId: state.modalItem.id,
      borrowerId: state.currentUser.id,
      durationDays: Number(el.rentDurationDays.value),
      meetupSpot: el.rentMeetupSpot.value,
      note: el.rentNote.value
    };

    const res = await apiPost('/api/rentals', payload);
    if (res && res.id) {
      if (window.playAudioTone) window.playAudioTone('message');
      showToast(`Rental request sent to lender! Meetup: ${payload.meetupSpot}`, 'success');
      closeModal();
      state.selectedRentalId = res.id;
      state.activeChatChannel = res.id;
      await fetchRentals();
      switchTab('rentals');
    }
  });

  // Chat Quick Replies
  el.chatQuickReplies.querySelectorAll('.chip-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      sendChatMessage(btn.textContent.trim());
    });
  });

  // Chat Send Form
  el.formSendChat.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = el.chatInputText.value.trim();
    if (!text) return;
    el.chatInputText.value = '';
    await sendChatMessage(text);
  });

  // Reset Demo Data
  el.btnResetDemo.addEventListener('click', async () => {
    if (confirm('Reset demo data back to the original comic scenario (Casio fx-991ES request ready)?')) {
      await apiPost('/api/reset');
      showToast('Database reset to initial comic state!', 'success');
      window.location.reload();
    }
  });
}

// Start application on DOM Ready
document.addEventListener('DOMContentLoaded', init);
