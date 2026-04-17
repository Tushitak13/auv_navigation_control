#!/usr/bin/env python3
"""
AUV Mission Control v11 — Development Server
=============================================
Serves the project locally so the browser can load JS modules correctly.

Usage:
    python main.py          # default port 8000
    python main.py 9000     # custom port

Then open:  http://localhost:8000
"""

import sys
import os
import http.server
import socketserver
import webbrowser
import threading

# ------------------------------------------------------------------
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.abspath(__file__))
# ------------------------------------------------------------------


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with quiet logging and correct MIME types."""

    # Ensure JS files are served with the right Content-Type
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js':   'application/javascript',
        '.mjs':  'application/javascript',
        '.css':  'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png':  'image/png',
        '.svg':  'image/svg+xml',
        '':      'application/octet-stream',
    }

    def log_message(self, format, *args):  # noqa: A002
        # Only log errors (status >= 400)
        status = args[1] if len(args) > 1 else '0'
        if str(status).startswith(('4', '5')):
            super().log_message(format, *args)


def open_browser(port: int, delay: float = 0.8) -> None:
    """Open the default browser after a short delay."""
    import time
    time.sleep(delay)
    webbrowser.open(f'http://localhost:{port}')


def main() -> None:
    os.chdir(ROOT)

    with socketserver.TCPServer(('', PORT), SilentHandler) as httpd:
        url = f'http://localhost:{PORT}'
        print(f'\n  ◈  AUV Mission Control v11')
        print(f'     Serving at  {url}')
        print(f'     Root dir    {ROOT}')
        print(f'     Press Ctrl+C to stop\n')

        # Open browser in background thread
        threading.Thread(target=open_browser, args=(PORT,), daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n  Server stopped.')


if __name__ == '__main__':
    main()
