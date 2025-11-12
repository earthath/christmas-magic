#!/usr/bin/env python3
"""
Simple HTTP server for testing the Christmas website
Accessible from other devices on the same network
"""
import http.server
import socketserver
import socket
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow access from other devices
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def main():
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    local_ip = get_local_ip()
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🎄 Christmas Website Test Server")
        print("=" * 60)
        print(f"\n📍 Local access:")
        print(f"   http://localhost:{PORT}")
        print(f"   http://127.0.0.1:{PORT}")
        print(f"\n🌐 Network access (from other devices):")
        print(f"   http://{local_ip}:{PORT}")
        print(f"\n📱 To access from your phone/tablet:")
        print(f"   1. Make sure your device is on the same WiFi network")
        print(f"   2. Open a browser and go to: http://{local_ip}:{PORT}")
        print(f"\n⚠️  Note: Some features (like geolocation) may require HTTPS")
        print(f"   For production, use GitHub Pages, Netlify, or Vercel")
        print("\n" + "=" * 60)
        print("Press Ctrl+C to stop the server")
        print("=" * 60 + "\n")
        
        # Open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped. Goodbye!")

if __name__ == "__main__":
    main()

