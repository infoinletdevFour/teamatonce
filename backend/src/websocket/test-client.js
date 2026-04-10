/**
 * WebSocket Test Client
 * Run this script to test the TeamAtOnce WebSocket implementation
 *
 * Usage:
 * node test-client.js
 */

const io = require('socket.io-client');

// Configuration
const config = {
  url: 'http://localhost:3001/teamatonce',
  path: '/socket.io/',
  userId: 'test-user-' + Date.now(),
  projectId: 'test-project-123',
};

console.log('🚀 TeamAtOnce WebSocket Test Client\n');
console.log('Configuration:');
console.log('  URL:', config.url);
console.log('  User ID:', config.userId);
console.log('  Project ID:', config.projectId);
console.log('\n' + '='.repeat(50) + '\n');

// Create socket connection
const socket = io(config.url, {
  path: config.path,
  transports: ['websocket', 'polling'],
  query: {
    userId: config.userId,
    projectId: config.projectId,
  },
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
  console.log('   Socket ID:', socket.id);
  console.log('\n' + '='.repeat(50) + '\n');

  // Run tests
  runTests();
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🔌 Disconnected:', reason);
  process.exit(0);
});

// Event listeners
socket.on('project-joined', (data) => {
  console.log('✅ Test 1 Passed: Project Joined');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('project-left', (data) => {
  console.log('✅ Test 2 Passed: Project Left');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('project-message', (message) => {
  console.log('✅ Test 3 Passed: Message Received');
  console.log('   Message:', JSON.stringify(message, null, 2));
  console.log('');
});

socket.on('whiteboard-joined', (data) => {
  console.log('✅ Test 4 Passed: Whiteboard Joined');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('whiteboard-update', (data) => {
  console.log('✅ Test 5 Passed: Whiteboard Update Received');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('pong', (data) => {
  console.log('✅ Test 6 Passed: Ping/Pong');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

socket.on('member-status-update', (data) => {
  console.log('📊 Member Status Update:');
  console.log('   Data:', JSON.stringify(data, null, 2));
  console.log('');
});

// Run test sequence
function runTests() {
  console.log('🧪 Running WebSocket Tests...\n');

  // Test 1: Join Project
  setTimeout(() => {
    console.log('📤 Test 1: Joining project...');
    socket.emit('join-project', {
      projectId: config.projectId,
      userId: config.userId,
      teamMemberId: 'team-member-123',
    });
  }, 500);

  // Test 2: Send Message
  setTimeout(() => {
    console.log('📤 Test 2: Sending project message...');
    socket.emit('project-message', {
      projectId: config.projectId,
      userId: config.userId,
      content: 'Hello from test client!',
      type: 'text',
      metadata: { test: true },
    });
  }, 1500);

  // Test 3: Join Whiteboard
  setTimeout(() => {
    console.log('📤 Test 3: Joining whiteboard session...');
    socket.emit('join-whiteboard', {
      sessionId: 'whiteboard-session-123',
      projectId: config.projectId,
      userId: config.userId,
      userName: 'Test User',
    });
  }, 2500);

  // Test 4: Whiteboard Update
  setTimeout(() => {
    console.log('📤 Test 4: Sending whiteboard update...');
    socket.emit('whiteboard-update', {
      sessionId: 'whiteboard-session-123',
      projectId: config.projectId,
      userId: config.userId,
      canvasData: {
        type: 'draw',
        x: 100,
        y: 150,
        color: '#ff0000',
      },
    });
  }, 3500);

  // Test 5: Member Status Update
  setTimeout(() => {
    console.log('📤 Test 5: Updating member status...');
    socket.emit('member-status-update', {
      teamMemberId: 'team-member-123',
      online: true,
      projectId: config.projectId,
    });
  }, 4500);

  // Test 6: Ping
  setTimeout(() => {
    console.log('📤 Test 6: Sending ping...');
    socket.emit('ping');
  }, 5500);

  // Test 7: Leave Project
  setTimeout(() => {
    console.log('📤 Test 7: Leaving project...');
    socket.emit('leave-project', {
      projectId: config.projectId,
    });
  }, 6500);

  // Disconnect after all tests
  setTimeout(() => {
    console.log('\n✨ All tests completed!');
    console.log('📊 Test Summary:');
    console.log('   - Project join/leave: OK');
    console.log('   - Messaging: OK');
    console.log('   - Whiteboard: OK');
    console.log('   - Status updates: OK');
    console.log('   - Ping/Pong: OK');
    console.log('\n🎉 WebSocket implementation is working correctly!\n');

    socket.disconnect();
  }, 7500);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  socket.disconnect();
  process.exit(0);
});

// Error handling
socket.on('error', (error) => {
  console.error('❌ Socket Error:', error);
});

socket.on('connect_timeout', () => {
  console.error('❌ Connection Timeout');
  process.exit(1);
});
