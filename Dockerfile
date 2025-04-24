# Use a base image with Node.js and Debian for Python support
FROM node:18

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory to /app
WORKDIR /app

# Copy only backend dependencies first (for caching)
COPY backend/package*.json ./backend/

# Install Node.js dependencies
RUN cd backend && npm install

# Copy the entire backend folder
COPY backend ./backend

# Install Python dependencies
RUN pip3 install --break-system-packages -r backend/requirements.txt

# Expose the port your Node app uses
EXPOSE 5001

# Start both: Python ML service + Node server
CMD ["sh", "-c", "python3 backend/app.py & node backend/server.js"]
