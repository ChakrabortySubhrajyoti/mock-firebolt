"use strict";

import { jest } from "@jest/globals";
import * as proxyManagement from "../../src/proxyManagement.mjs";
import WebSocket from 'ws';

jest.setTimeout(80 * 1000)
describe('sequentially run tests', () => {
    beforeAll(() => {
        clearEnvs()
    })

    afterAll(() => {
        clearEnvs()
    })

    test(`proxyManagement.getProxyWSConnection works properly`, async () => {
        const client = await proxyManagement.getProxyWSConnection()
        expect(client).toBe(null);
    });

    test(`proxyManagement.getToken works properly and get token from request param or from env`, async () => {
        let token = proxyManagement.getToken({"url": "http://abcd.com?token=test"})
        expect(token.stdout).toBe("test");

        process.env.TOKEN = "abcd"
        token = proxyManagement.getToken(null)
        expect(token.stdout).toBe(process.env.TOKEN);
    });

    test(`proxyManagement.getToken works properly and when token nor present in request param and env`, async () => {
        delete process.env.TOKEN
        const token = proxyManagement.getToken({"url": "http://abcd.com"})
        expect(token.stderr).toBe("Unable to get token from connection param or not present in env");
    });

    test(`proxyManagement.sendRequest works properly`, async () => {
        try {
            await proxyManagement.sendRequest(null)
        } catch (e) {
            expect(e.message).toBe("websocketConnection not established");
        }
    });

    test(`proxyManagement.sendRequest works properly with mock`, async () => {
        try {
            let ws = new WebSocket('ws://localhost:40003');
            proxyManagement.setProxyWSConnection(ws)
            ws.addEventListener('error', function(event) {
                proxyManagement.close()
            })
            await proxyManagement.sendRequest(null)
        } catch (e) {
            expect(e).toBe("Connection to proxy server timedout");
            proxyManagement.close()
        }
    });

    test(`proxyManagement.initialize works properly`, async () => {
        try {
            process.env.proxyServerIP = "localhost:40002"
            await proxyManagement.initialize()
            //TODO validation not performed yet. Need to mock websocket.
        } catch (e) {
            console.log("ERROR:: ", e)
            proxyManagement.close()
        }
    });
})

function clearEnvs() {
    delete process.env.TOKEN
    delete process.env.proxyServerIP
    delete process.env.proxy
}
