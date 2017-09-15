const querystring = require('querystring');
const fs = require('fs');
const url = require('url');

let data = [];

const headers = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-max-age': 10, // Seconds.
  'Content-Type': 'JSON'
};

var requestHandler = function(request, response) {
  const { method, url } = request;

  console.log('Serving request type ' + request.method + ' for url ' + request.url);

  let handleGetMessages = function() {
    let statusCode = 200;
    response.writeHead(statusCode, headers);
    if (data.length < 1) {
      response.end(JSON.stringify({results: [{username: 'Admin', text: 'Server is currently empty'}]}));
    } else {
      response.end(JSON.stringify({results: data}));
    }
  };

  let handlePost = function () {
    let statusCode = 201;
    let body = [];
    response.writeHead(statusCode, headers);
    request.on('error', (err) => {
      console.error(err);
    });

    request.on('data', (chunk) => {
      body.push(chunk);
    });

    request.on('end', () => {
      if (typeof body[0] !== 'string') {
        body = Buffer.concat(body).toString();
      } else {
        body = body[0];
      }

      if (body[0] === '{') {
        body = JSON.parse(body);
      } else {
        body = querystring.parse(body);
      }

      if (body) {
        body.objectId = data.length;
        data.push(body);
        response.end(JSON.stringify({results: body}));
      } else {
        response.end(JSON.stringify({results: 'No message sent'}));
      }
    });

  };

  let handleOptions = function() {
    response.writeHead(200, headers);
    response.end();
  };

  let dir = './chatterbox/hrr26-chatterbox-client/client';

  let handleGetFiles = function(response, fileName, contentType) {
    fs.readFile(`${dir + fileName}`, function(err, data) {
      if (err) {
        response.writeHead(404);
        response.write('Not Found!');
      } else {
        response.writeHead(200, {'Content-Type': contentType});
        response.write(data);
      }
      response.end();
    });
  };

  let allowedEndpoints = {
    '/classes/messages': true,
    '/': true,
    '/styles/styles.css': true,
    '/bower_components/jquery/dist/jquery.js': true,
    '/env/config.js': true,
    '/scripts/app.js': true,
    '/images/spiffygif_46x46.gif': true
  };

  let mimes = {
    'js': 'text/javascript',
    'html': 'text/html',
    'css': 'text/css',
    'json': 'application/json',
    'gif': 'image/gif'
  };

  if (request.method === 'GET' && allowedEndpoints[request.url] || request.url.slice(0, 11) === '/?username=') {
    if (request.url === '/classes/messages') {
      handleGetMessages();
    } else if (request.url === '/' || request.url.slice(0, 11) === '/?username=') {
      handleGetFiles(response, '/index.html', mimes['html']);
    } else {
      var ext = request.url.split('.').pop();
      handleGetFiles(response, request.url, mimes[ext]);
    }
  } else if (request.method === 'POST' && request.url === '/classes/messages') {
    handlePost();
  } else if (request.method === 'OPTIONS') {
    handleOptions();
  } else {
    response.writeHead(404, headers);
    response.end('404 error', request.url);
  }
};

exports.requestHandler = requestHandler;