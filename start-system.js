const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Pet Welfare System...\n');

// Function to start MongoDB
function startMongoDB() {
  return new Promise((resolve, reject) => {
    console.log('📊 Starting MongoDB...');
    const mongod = spawn('mongod', ['--dbpath', './backend/data', '--port', '27017'], {
      stdio: 'pipe',
      shell: true
    });

    mongod.stdout.on('data', (data) => {
      console.log(`MongoDB: ${data}`);
    });

    mongod.stderr.on('data', (data) => {
      const message = data.toString();
      if (message.includes('waiting for connections')) {
        console.log('✅ MongoDB started successfully');
        resolve(mongod);
      } else if (message.includes('Address already in use')) {
        console.log('✅ MongoDB already running');
        resolve(mongod);
      } else if (message.includes('not recognized')) {
        console.log('❌ MongoDB not installed');
        console.log('Please install MongoDB from: https://www.mongodb.com/try/download/community');
        reject(new Error('MongoDB not found'));
      }
    });

    mongod.on('error', (err) => {
      console.log('❌ MongoDB error:', err.message);
      reject(err);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('✅ MongoDB startup timeout (assuming it started)');
      resolve(mongod);
    }, 10000);
  });
}

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

// Function to kill process on port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0') {
              console.log(`🔄 Killing existing process on port ${port} (PID: ${pid})`);
              exec(`taskkill /PID ${pid} /F`, () => {
                setTimeout(resolve, 1000); // Wait 1 second after killing
              });
              return;
            }
          }
        }
      }
      resolve();
    });
  });
}

// Function to start backend server
function startBackend() {
  return new Promise(async (resolve, reject) => {
    console.log('🔧 Starting Backend Server...');
    
    // Check if port 5000 is available
    const portAvailable = await checkPort(5000);
    if (!portAvailable) {
      console.log('⚠️  Port 5000 is in use, attempting to free it...');
      await killProcessOnPort(5000);
      
      // Wait a bit and check again
      await new Promise(resolve => setTimeout(resolve, 2000));
      const portAvailableAfterKill = await checkPort(5000);
      if (!portAvailableAfterKill) {
        console.log('❌ Could not free port 5000. Please manually stop the process using this port.');
        reject(new Error('Port 5000 is still in use'));
        return;
      }
    }
    
    const backend = spawn('node', ['server.js'], {
      cwd: './backend',
      stdio: 'pipe',
      shell: true
    });

    let backendStarted = false;

    backend.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`Backend: ${message}`);
      if (message.includes('Server running on port 5000') || message.includes('listening on port 5000')) {
        if (!backendStarted) {
          console.log('✅ Backend server started successfully');
          backendStarted = true;
          resolve(backend);
        }
      }
    });

    backend.stderr.on('data', (data) => {
      const message = data.toString();
      console.log(`Backend Error: ${message}`);
      
      // Handle specific errors
      if (message.includes('EADDRINUSE')) {
        console.log('❌ Port 5000 is still in use. Trying to kill existing process...');
        killProcessOnPort(5000).then(() => {
          console.log('🔄 Retrying backend startup...');
          setTimeout(() => {
            startBackend().then(resolve).catch(reject);
          }, 2000);
        });
      } else if (message.includes('Cannot find module')) {
        console.log('❌ Missing dependencies. Please run: cd backend && npm install');
        reject(new Error('Missing dependencies'));
      }
    });

    backend.on('error', (err) => {
      console.log('❌ Backend error:', err.message);
      reject(err);
    });

    backend.on('exit', (code) => {
      if (code !== 0 && !backendStarted) {
        console.log(`❌ Backend process exited with code ${code}`);
        reject(new Error(`Backend process exited with code ${code}`));
      }
    });

    // Timeout after 20 seconds
    setTimeout(() => {
      if (!backendStarted) {
        console.log('⏰ Backend startup timeout - checking if it started...');
        checkPort(5000).then(available => {
          if (!available) {
            console.log('✅ Backend appears to be running (port 5000 is in use)');
            backendStarted = true;
            resolve(backend);
          } else {
            console.log('❌ Backend failed to start within timeout');
            reject(new Error('Backend startup timeout'));
          }
        });
      }
    }, 20000);
  });
}

// Function to start frontend (optional)
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Starting Frontend...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: './frontend',
      stdio: 'pipe',
      shell: true
    });

    frontend.stdout.on('data', (data) => {
      const message = data.toString();
      console.log(`Frontend: ${message}`);
      if (message.includes('Local:') || message.includes('localhost:5173')) {
        console.log('✅ Frontend started successfully');
        resolve(frontend);
      }
    });

    frontend.stderr.on('data', (data) => {
      console.log(`Frontend Error: ${data}`);
    });

    frontend.on('error', (err) => {
      console.log('❌ Frontend error:', err.message);
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('✅ Frontend startup timeout (assuming it started)');
      resolve(frontend);
    }, 30000);
  });
}

// Main startup function
async function startSystem() {
  try {
    console.log('🚀 Starting Pet Welfare System...\n');
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const startFrontendFlag = args.includes('--frontend') || args.includes('-f');
    const backendOnly = args.includes('--backend-only') || args.includes('-b');
    
    let mongod, backend, frontend;
    
    if (!backendOnly) {
      // Start MongoDB
      mongod = await startMongoDB();
      
      // Wait a bit for MongoDB to fully start
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Start Backend
    backend = await startBackend();
    
    // Start Frontend if requested
    if (startFrontendFlag) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for backend to be ready
      frontend = await startFrontend();
    }
    
    console.log('\n🎉 System started successfully!');
    if (mongod) console.log('📊 MongoDB: http://localhost:27017');
    console.log('🔧 Backend API: http://localhost:5000');
    if (frontend) console.log('🌐 Frontend: http://localhost:5173');
    console.log('\nPress Ctrl+C to stop all services');

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down system...');
      if (mongod) mongod.kill();
      if (backend) backend.kill();
      if (frontend) frontend.kill();
      process.exit(0);
    });

  } catch (error) {
    console.log('\n❌ Failed to start system:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is installed and in PATH');
    console.log('2. Check if ports 27017 and 5000 are available');
    console.log('3. Run: npm install in both frontend and backend directories');
    console.log('\nUsage:');
    console.log('  node start-system.js              # Start MongoDB + Backend');
    console.log('  node start-system.js --frontend   # Start MongoDB + Backend + Frontend');
    console.log('  node start-system.js --backend-only # Start only Backend');
    process.exit(1);
  }
}

startSystem();
