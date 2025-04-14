#!/bin/bash

# Setup and Run Script for MCP Structured UI

# Print colored output
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_blue() {
  echo -e "\033[0;34m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Please install Node.js before running this script."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install npm before running this script."
  exit 1
fi

# Install dependencies
print_blue "Installing dependencies..."
npm install

# Build the project
print_blue "Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  print_green "Build successful!"
else
  print_yellow "Build failed. Please check the error messages above."
  exit 1
fi

# Run the web example
print_blue "Starting the web example..."
print_blue "The example will be available at http://localhost:1234"
print_blue "Press Ctrl+C to stop the server when you're done."
npx parcel examples/web-example.html