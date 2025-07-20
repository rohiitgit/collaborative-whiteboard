# Collaborative Whiteboard Application

A real-time collaborative whiteboard application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.io for live collaboration.

## Features

- **Real-time Collaboration**: Multiple users can draw simultaneously with live synchronization
- **Room-based Sessions**: Join rooms with simple alphanumeric codes (6-8 characters)
- **Drawing Tools**: Pencil tool with adjustable stroke width and color selection
- **Live Cursor Tracking**: See other users' cursor positions in real-time
- **User Presence**: Display active user count in each room
- **Persistent Drawing**: Drawings are saved and restored when joining existing rooms
- **Responsive Design**: Works on desktop and tablet devices

## Technology Stack

- **Frontend**: React.js with Vite
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.io
- **Styling**: CSS

## Project Structure

```
project-root/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── RoomJoin.jsx
│   │   │   ├── Whiteboard.jsx
│   │   │   ├── DrawingCanvas.jsx
│   │   │   ├── Toolbar.jsx
│   │   │   └── UserCursors.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/
│   │   └── Room.js
│   ├── routes/
│   │   └── rooms.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── README.md
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository and install root dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB connection string if different from default
   ```

3. **Start MongoDB:**
   - For local MongoDB: `mongod`
   - For MongoDB Atlas: Ensure your connection string is in the `.env` file

4. **Start the application in development mode:**
   ```bash
   npm run dev
   ```

   This will start both the client (http://localhost:3000) and server (http://localhost:5000) concurrently.

### Alternative: Start services separately

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

## API Documentation

### REST Endpoints

#### POST `/api/rooms/join`
Join or create a room.

**Request Body:**
```json
{
  "roomId": "ABC123"
}
```

**Response:**
```json
{
  "roomId": "ABC123",
  "createdAt": "2025-01-20T10:30:00.000Z",
  "drawingCommandsCount": 5
}
```

#### GET `/api/rooms/:roomId`
Get room information and drawing data.

**Response:**
```json
{
  "roomId": "ABC123",
  "createdAt": "2025-01-20T10:30:00.000Z",
  "lastActivity": "2025-01-20T11:15:00.000Z",
  "drawingData": [...]
}
```

### Socket Events

#### Client to Server Events

| Event | Data | Description |
|-------|------|-------------|
| `join-room` | `roomId` | Join a whiteboard room |
| `leave-room` | `roomId` | Leave current room |
| `cursor-move` | `{x, y, roomId}` | Update cursor position |
| `draw-start` | `{roomId, x, y, color, strokeWidth}` | Start drawing stroke |
| `draw-move` | `{roomId, x, y}` | Continue drawing stroke |
| `draw-end` | `{roomId, strokeData}` | End drawing stroke and save |
| `clear-canvas` | `roomId` | Clear the entire canvas |

#### Server to Client Events

| Event | Data | Description |
|-------|------|-------------|
| `user-count` | `count` | Number of active users in room |
| `cursor-update` | `{userId, x, y}` | Other user's cursor position |
| `user-left` | `userId` | User disconnected from room |
| `draw-start` | `{x, y, color, strokeWidth}` | Another user started drawing |
| `draw-move` | `{x, y}` | Another user's drawing movement |
| `draw-end` | - | Another user finished drawing |
| `clear-canvas` | - | Canvas was cleared |
| `drawing-data` | `[drawingCommands]` | Existing drawing data for new users |

## Architecture Overview

### High-Level System Design

```
┌─────────────┐    HTTP/WS     ┌─────────────┐    MongoDB    ┌─────────────┐
│   React     │◄──────────────►│   Node.js   │◄─────────────►│   MongoDB   │
│   Client    │   Socket.io    │   Server    │    Mongoose   │   Database  │
└─────────────┘                └─────────────┘               └─────────────┘
```

### Component Architecture

- **RoomJoin**: Handles room code input and room creation/joining
- **Whiteboard**: Main container component managing drawing state and user interface
- **DrawingCanvas**: Handles all drawing logic and Canvas API interactions
- **Toolbar**: Provides drawing controls (color, stroke width, clear)
- **UserCursors**: Displays real-time cursor positions of other users

### Data Flow

1. **Room Management**: Users join rooms via REST API, rooms are created dynamically
2. **Real-time Sync**: Socket.io handles all real-time events (drawing, cursors, user presence)
3. **Drawing Persistence**: Drawing commands are stored in MongoDB for room persistence
4. **State Management**: React state manages local drawing settings and UI state

## Deployment Guide

### Production Environment Setup

1. **Environment Variables:**
   ```bash
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whiteboard
   NODE_ENV=production
   ```

2. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

3. **Deploy Options:**

   **Option 1: Single Server Deployment**
   - Serve React build files from Express server
   - Add static middleware to serve client build

   **Option 2: Separate Deployments**
   - Deploy client to Netlify/Vercel
   - Deploy server to Heroku/DigitalOcean
   - Update CORS settings and Socket.io origins

### Docker Deployment (Optional)

Create `Dockerfile` in root:
```dockerfile
# Multi-stage build
FROM node:16-alpine as client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:16-alpine as server
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
COPY --from=client-build /app/client/dist ./public

EXPOSE 5000
CMD ["npm", "start"]
```

### Performance Considerations

- **Cursor Updates**: Throttled to ~60fps to prevent server overload
- **Drawing Data**: Stored as incremental commands rather than full canvas data
- **Room Cleanup**: Automatic cleanup of inactive rooms (24+ hours)
- **Connection Management**: Proper cleanup of socket connections and room memberships

### Security Considerations

- Input validation for room codes
- Rate limiting for socket events (recommended for production)
- CORS configuration for production domains
- Environment variable protection

## Usage

1. **Create/Join Room**: Enter a 6-8 character room code or click "Create New Room"
2. **Drawing**: Use mouse or touch to draw on the canvas
3. **Customize**: Select colors and adjust stroke width using the toolbar
4. **Collaborate**: Share room code with others for real-time collaboration
5. **Clear**: Use "Clear All" button to reset the canvas for all users

## Troubleshooting

### Common Issues

#### Connection Issues
- **Problem**: Cannot connect to server or Socket.io errors
- **Solution**:
  - Verify MongoDB is running and accessible
  - Check network connectivity and firewall settings
  - Ensure server is running on correct port (default: 5000)
  - Verify CORS settings in production deployments

#### Drawing Not Syncing
- **Problem**: Drawing appears locally but not for other users
- **Solution**:
  - Check browser console for Socket.io errors
  - Verify room ID is correct and consistent across users
  - Restart the server to clear any socket connection issues
  - Check if drawing events are being properly emitted

#### Performance Issues
- **Problem**: Slow drawing response or laggy cursor movements
- **Solution**:
  - Reduce cursor update frequency in client code
  - Check network latency and server performance
  - Consider implementing drawing command batching
  - Optimize canvas rendering for large drawing datasets

#### Database Connection Errors
- **Problem**: MongoDB connection failures
- **Solution**:
  - Verify MongoDB connection string in `.env` file
  - Check MongoDB Atlas IP whitelist settings
  - Ensure database credentials are correct
  - Test connection using MongoDB Compass or CLI

### Debug Mode

Enable debug logging by setting environment variables:

```bash
# Server debug
DEBUG=socket.io:* node server.js

# Client debug (in browser console)
localStorage.debug = 'socket.io-client:*'
```

### Browser Compatibility

- **Supported Browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile Support**: iOS Safari 12+, Chrome Mobile 60+
- **Known Issues**:
  - Touch drawing may have slight offset on some mobile browsers
  - Canvas scaling issues on high-DPI displays (implement canvas scaling)

## Development Guidelines

### Code Style

- Use ESLint configuration for consistent code formatting
- Follow React Hooks patterns for state management
- Implement proper error boundaries for React components
- Use meaningful variable and function names

### Testing

```bash
# Run client tests
cd client
npm test

# Run server tests
cd server
npm test

# Run integration tests
npm run test:integration
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

### Adding New Features

#### Adding New Drawing Tools

1. Extend the `DrawingCanvas` component with new tool logic
2. Update the `Toolbar` component to include tool selection
3. Add corresponding Socket.io events for new tool actions
4. Update the database schema if tool requires additional data storage

#### Implementing User Authentication

1. Add user authentication middleware to Express routes
2. Modify Socket.io connection to include user authentication
3. Update room model to include user ownership and permissions
4. Implement user-specific drawing history and preferences

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the API documentation for integration questions

## Version History

- **v1.0.0**: Initial release with basic collaborative drawing
- **Current**: Enhanced performance and added comprehensive documentation

## Future Roadmap

- **Text Tool**: Add text annotations to drawings
- **Shape Tools**: Rectangle, circle, and line drawing tools
- **Layer Support**: Multiple drawing layers with show/hide functionality
- **Export Options**: Save drawings as PNG, SVG, or PDF
- **User Accounts**: Registration and login system
- **Drawing History**: Undo/redo functionality
- **Voice Chat**: Integrated voice communication for collaborators

# Deployment

## Deploy Frontend on Vercel:

Create a separate repository for your client or use the existing one
Update your client's environment variables to point to your hosted backend
Deploy the client folder to Vercel

## Deploy Backend on Railway/Render:
For your Express server with Socket.IO, consider using:

- Railway: Great for full-stack apps with WebSocket support
- Render: Good alternative with WebSocket support
- Heroku: Classic choice (paid)

## Deployment Steps for Vercel:

- Push your code to GitHub/GitLab/Bitbucket
- Connect to Vercel:

Go to vercel.com
Import your repository
Vercel will auto-detect it as a Node.js project


- Configure Environment Variables:

In your Vercel dashboard, go to Settings → Environment Variables
Add your MongoDB URI and other secrets


## Deploy:

Vercel will automatically build and deploy your app
Update the socket connection URL in your client code with your actual Vercel URL
