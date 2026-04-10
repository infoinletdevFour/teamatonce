# WebSocket Module Deployment Checklist

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Development
- [ ] `.env` file has Redis configuration
  ```bash
  REDIS_HOST=localhost
  REDIS_PORT=6379
  # REDIS_PASSWORD=optional-for-dev
  ```
- [ ] JWT configuration is present
  ```bash
  JWT_SECRET=your-jwt-secret
  JWT_EXPIRES_IN=7d
  ```

#### Production
- [ ] Production `.env` configured with secure values
- [ ] Redis host points to production Redis instance
- [ ] Redis password is set and secure
- [ ] JWT secret is strong and unique
- [ ] CORS origins updated to production domains

### 2. Dependencies

- [x] `@socket.io/redis-adapter@^8.3.0` installed
- [x] `redis@^5.8.3` installed
- [x] `socket.io@^4.8.1` present
- [x] `@nestjs/websockets@^11.1.6` present
- [x] `@nestjs/platform-socket.io@^11.1.6` present

### 3. Module Integration

- [x] `TeamAtOnceWebSocketModule` imported in `app.module.ts`
- [ ] No circular dependencies
- [ ] Module compiles without errors

### 4. Redis Infrastructure

#### Development
- [ ] Redis running locally or in Docker
  ```bash
  docker run -d -p 6379:6379 redis:latest
  ```
- [ ] Can connect to Redis: `redis-cli ping`

#### Production
- [ ] Redis cluster/instance provisioned
- [ ] Redis has persistence enabled
- [ ] Redis has backup strategy
- [ ] Redis monitoring configured
- [ ] Connection pooling configured
- [ ] Firewall rules allow backend → Redis

### 5. Security Configuration

- [ ] JWT authentication enabled in production
- [ ] CORS origins whitelist updated in `teamatonce.gateway.ts`
  ```typescript
  cors: {
    origin: [
      'https://your-production-domain.com',
      'https://www.your-production-domain.com',
    ],
    credentials: true,
  }
  ```
- [ ] Rate limiting implemented (recommended)
- [ ] SSL/TLS enabled (WSS protocol)
- [ ] Authentication guard configured

### 6. Load Balancer / Reverse Proxy

#### Nginx Configuration
```nginx
# WebSocket upgrade headers
location /socket.io/ {
  proxy_pass http://backend_upstream;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;

  # Timeouts
  proxy_connect_timeout 7d;
  proxy_send_timeout 7d;
  proxy_read_timeout 7d;
}
```

- [ ] WebSocket upgrade headers configured
- [ ] Timeout settings appropriate for long-lived connections
- [ ] Sticky sessions configured (if not using Redis)
- [ ] SSL termination configured

### 7. Testing

#### Local Testing
- [ ] Backend starts without errors
- [ ] Redis connection successful
- [ ] WebSocket endpoint accessible
- [ ] Test client runs successfully
  ```bash
  node src/websocket/test-client.js
  ```

#### Integration Testing
- [ ] Frontend can connect to WebSocket
- [ ] Messages are received in real-time
- [ ] Room isolation works (multi-tenant)
- [ ] Authentication validates JWT tokens
- [ ] Disconnection handling works

#### Load Testing
- [ ] Multiple concurrent connections tested
- [ ] Message broadcast performance verified
- [ ] Redis pub/sub working across instances
- [ ] Memory usage monitored
- [ ] CPU usage acceptable

### 8. Monitoring Setup

- [ ] WebSocket connection metrics
- [ ] Redis connection health
- [ ] Message throughput tracking
- [ ] Error rate monitoring
- [ ] Performance dashboards
- [ ] Alerting configured for:
  - High error rates
  - Redis connection failures
  - Memory/CPU spikes
  - Connection limit approaching

### 9. Logging

- [ ] Structured logging enabled
- [ ] Log levels appropriate (not too verbose in production)
- [ ] Logs aggregated (e.g., ELK, CloudWatch)
- [ ] Error tracking integrated (e.g., Sentry)

### 10. Documentation

- [x] README.md complete
- [x] QUICKSTART.md available
- [x] API documentation updated
- [x] Usage examples provided
- [ ] Team trained on WebSocket features

---

## Deployment Steps

### Step 1: Infrastructure Preparation

1. **Provision Redis**
   ```bash
   # Docker Compose example
   redis:
     image: redis:7-alpine
     ports:
       - "6379:6379"
     volumes:
       - redis-data:/data
     command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
   ```

2. **Configure Environment**
   ```bash
   # Production .env
   REDIS_HOST=redis.production.com
   REDIS_PORT=6379
   REDIS_PASSWORD=super-secure-password
   JWT_SECRET=production-jwt-secret-change-this
   JWT_EXPIRES_IN=7d
   ```

### Step 2: Code Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Run Database Migrations** (if applicable)
   ```bash
   npm run migrate
   ```

3. **Deploy Backend**
   ```bash
   # Using PM2
   pm2 start dist/main.js --name teamatonce-api

   # Or Docker
   docker-compose up -d backend
   ```

### Step 3: Verification

1. **Check Backend Health**
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

2. **Test WebSocket Connection**
   ```bash
   # Using test client
   node src/websocket/test-client.js

   # Or using wscat
   npm install -g wscat
   wscat -c ws://localhost:3001/teamatonce
   ```

3. **Verify Redis Connection**
   ```bash
   # Check backend logs for:
   # "Redis Pub Client connected successfully"
   # "Redis Sub Client connected successfully"
   # "Socket.IO Redis adapter initialized successfully"
   ```

### Step 4: Load Balancing (Multi-Instance)

1. **Start Multiple Instances**
   ```bash
   # Instance 1
   PORT=3001 pm2 start dist/main.js --name api-1

   # Instance 2
   PORT=3002 pm2 start dist/main.js --name api-2

   # Instance 3
   PORT=3003 pm2 start dist/main.js --name api-3
   ```

2. **Configure Load Balancer**
   - Use Nginx, HAProxy, or cloud load balancer
   - Enable sticky sessions OR use Redis adapter
   - Health check endpoint configured

3. **Test Multi-Instance**
   - Connect clients to different instances
   - Verify messages are synchronized via Redis
   - Test failover scenarios

### Step 5: Frontend Integration

1. **Update Frontend Configuration**
   ```typescript
   const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.teamatonce.com/teamatonce';
   ```

2. **Deploy Frontend**
   ```bash
   npm run build
   npm run start
   ```

3. **Test End-to-End**
   - User login → WebSocket connection
   - Join project → Receive messages
   - Send message → Other users receive
   - Status updates → Real-time reflection

### Step 6: Monitoring & Alerts

1. **Setup Monitoring**
   - Prometheus metrics export
   - Grafana dashboards
   - CloudWatch/DataDog integration

2. **Configure Alerts**
   - High error rate (>5%)
   - Redis connection down
   - Memory usage >80%
   - CPU usage >70%
   - WebSocket connection spike

3. **Log Aggregation**
   - ELK stack or cloud solution
   - Error tracking (Sentry, Rollbar)
   - Performance monitoring (New Relic, AppDynamics)

---

## Post-Deployment Verification

### Functional Tests

- [ ] Users can connect to WebSocket
- [ ] Users can join project rooms
- [ ] Messages are delivered in real-time
- [ ] Whiteboard collaboration works
- [ ] Member status updates correctly
- [ ] Disconnection is handled gracefully
- [ ] Reconnection works properly

### Performance Tests

- [ ] Latency <100ms for messages
- [ ] Can handle 1000+ concurrent connections
- [ ] Memory usage stable over time
- [ ] CPU usage reasonable (<50% average)
- [ ] Redis pub/sub has low latency

### Security Tests

- [ ] Unauthenticated connections rejected (if auth enabled)
- [ ] JWT validation works
- [ ] Cross-tenant isolation verified
- [ ] CORS policy enforced
- [ ] Rate limiting working (if implemented)

---

## Rollback Plan

### If Deployment Fails

1. **Revert to Previous Version**
   ```bash
   pm2 stop teamatonce-api
   git checkout previous-stable-tag
   npm install
   npm run build
   pm2 start dist/main.js
   ```

2. **Check Logs**
   ```bash
   pm2 logs teamatonce-api --lines 100
   ```

3. **Verify Redis**
   ```bash
   redis-cli -h redis.production.com -a password ping
   ```

### If Performance Issues

1. **Scale Redis**
   - Upgrade instance type
   - Enable Redis cluster mode
   - Add read replicas

2. **Add More Backend Instances**
   ```bash
   pm2 scale teamatonce-api +2
   ```

3. **Enable Caching**
   - Add HTTP caching layer
   - Implement message throttling
   - Optimize database queries

---

## Production URLs

Replace with your actual URLs:

- **WebSocket**: `wss://api.teamatonce.com/teamatonce`
- **API**: `https://api.teamatonce.com/api/v1`
- **Frontend**: `https://teamatonce.com`
- **Redis**: `redis://redis.internal:6379`

---

## Support Contacts

- **DevOps Team**: devops@teamatonce.com
- **Backend Team**: backend@teamatonce.com
- **On-Call**: +1-XXX-XXX-XXXX

---

## Reference Documentation

- [README.md](./README.md) - Complete API reference
- [QUICKSTART.md](./QUICKSTART.md) - Development setup
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical overview
- [examples/websocket-usage.example.ts](./examples/websocket-usage.example.ts) - Code examples

---

## Success Criteria

✅ All checklist items completed
✅ All tests passing
✅ Monitoring active
✅ Documentation complete
✅ Team trained
✅ Rollback plan ready
✅ Performance acceptable
✅ Security validated

**Deployment Status**: [ ] Ready | [ ] In Progress | [ ] Complete

**Deployed By**: _____________
**Date**: _____________
**Version**: _____________
