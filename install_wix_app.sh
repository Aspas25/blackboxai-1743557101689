#!/bin/bash

# Make the script executable
chmod +x "$0"

# Function to show a notification
show_notification() {
    if command -v notify-send &> /dev/null; then
        notify-send "Pipeline Analytics Installer" "$1" --icon=system-software-install
    else
        echo "$1"
    fi
}

# Start installation
show_notification "Iniciando instalação do Pipeline Analytics..."

# Open the installation page in the default browser
python3 -m http.server 8000 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Open the download page
xdg-open "http://localhost:8000/download.html" &

# Function to cleanup on exit
cleanup() {
    kill $SERVER_PID 2>/dev/null
    show_notification "Instalação finalizada!"
}

# Register cleanup function
trap cleanup EXIT

# Keep script running until browser is closed
read -p "Pressione Enter para finalizar a instalação..."