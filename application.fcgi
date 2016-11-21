#!/app/supportpanel/.virtualenv/bin/python
from flup.server.fcgi import WSGIServer
from application import app

if __name__ == '__main__':
    WSGIServer(app, bindAddress='/tmp/supportpanel-fcgi.sock').run()