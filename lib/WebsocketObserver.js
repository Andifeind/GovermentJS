const WebSocketServer = require('websocket').server
const http = require('http')
const instances = require('./instances')
const logtopus = require('logtopus')

const log = logtopus.getLogger('govermentjs')

class WebsocketObserver {
  constructor (conf) {
    this.listen = conf.listen
    this.target = conf.target
    console.log('CONF:', conf)
  }

  connect () {
    if (!instances[this.listen.port]) {
      const server = http.createServer()
      return new Promise((resolve, reject) => {
        server.listen(this.listen.port, (err) => {
          if (err) return reject(err)
          resolve(server)
        })
      })

      const socket = new WebSocketServer({
        httpServer: server
      });

      socket.on('request', (req) => {
        const connection = request.accept('echo-protocol', request.origin)
        console.log('SOCKET CONNECTION:', (new Date()), ' Connection accepted.');
        connection.on('message', (msg) => {
          if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
          }
          else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
          }
        })

        connection.on('close', () => {
          console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        })
      })
    }
  }

  start () {
    log.sys('Start websocket observer at port', this.listen.port)
    return this.connect()
  }
}

module.exports.WebsocketObserver = WebsocketObserver
