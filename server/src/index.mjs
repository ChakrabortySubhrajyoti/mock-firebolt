/*
* Copyright 2021 Comcast Cable Communications Management, LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* SPDX-License-Identifier: Apache-2.0
*/

// Mock Firebolt - main entry point

'use strict';

import { config } from './config.mjs';
import { getUserIdFromReq } from './util.mjs';
import * as userManagement from './userManagement.mjs';
import * as stateManagement from './stateManagement.mjs';

// -------------------------------------------------- Web Socket --------------------------------------------------

import { createServer } from 'http';
import { parse } from 'url';
import WebSocket, { WebSocketServer } from 'ws';

console.log(`Welcome to Mock Firebolt`);

const server = createServer();

server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);
  let userId = pathname.substring(1);
  if ( ! userId ) {
    console.log('Using default user');
    userId = config.app.defaultUserId;
  } else if ( ! userManagement.isKnownUser(userId) ) {
    console.log(`WARNING: Unknown userId: ${userId}; Using default user`);
    userId = config.app.defaultUserId;
  }
  const wss = userManagement.getWssForUser(userId);
  if ( wss ) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log(`ERROR: Unknown userId: ${userId}`);
    socket.destroy();
  }
});

// Starter user(s)
console.log('Adding user 123...'); stateManagement.addUser('123'); userManagement.addUser('123');
console.log('Adding user 456...'); stateManagement.addUser('456'); userManagement.addUser('456');
console.log('Adding user 789...'); stateManagement.addUser('789'); userManagement.addUser('789');

server.listen(config.app.socketPort);
console.log(`Listening on socket port ${config.app.socketPort}...`);

// ----------------------------------------------------- HTTP -----------------------------------------------------

import path from 'path';
const __dirname = path.resolve();
import express from 'express';
import bodyParser from 'body-parser';
import { engine } from 'express-handlebars';

import * as configureAPI from './configureAPI.mjs';
import * as configureUI from './configureUI.mjs';

const app = express();

app.use(bodyParser.json({ limit: '1mb' })); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({             // to support URL-encoded bodies
  extended: true
}));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static(path.join(__dirname, 'public')));

// Make the correct ws connection available to routes
app.use(function(req, res, next) {
  const userId = getUserIdFromReq(req);
  res.locals.ws = userManagement.getWsForUser(userId);
  next();
});

configureAPI.configureAPI(app);
configureUI.configureUI(app);

app.get('*', function(req, res) {
  res.status(200).send('You seem lost');
});

app.listen(config.app.httpPort);
console.log(`Listening on HTTP port ${config.app.httpPort}...`);