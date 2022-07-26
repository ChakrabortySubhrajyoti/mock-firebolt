Mock Firebolt: Proxing request and response
===========================================

- [Overview](#overview)
- [Usage](#Usage)

# Overview

Proxy mode in Mock Firebolt will bypass OPENRPC calls and hit proxy server endpoint directly which would return back response to caller.

When Mock Firebolt starts up, it will check for `--proxy` in command line argument. 
- If present, Validate ip4 or ipv6 address. If valid continue else terminate the connection.
- Get token from connection parameter `?token=` or from env `process.env.TOKEN`. If token present, this will be used while building websocket connection for proxy server else process the request as is.
- Handle incoming message which will by pass default OPENRPC calls in case of proxy enabled.
- Initialize websocket connection to proxy server and handle failure
- Send inbound messages to proxy endpoint. 
- Send outbound message from proxy endpoint to caller.

# Usage
If you need to use proxy connection for any reason:
```npm run dev -- --proxy 192.168.0.100```

Note: To use token while building websocket connection for proxy server, run before starting Mock Firebolt
```export TOKEN=<token>```