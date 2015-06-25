var PromiseEmitter = require('promise-emitter');

function Pipe() {
    var upEmitters = {};
    var downEmitters = {};
    this.top = {
        on : function(event) {
            if (!upEmitters[event]) upEmitters[event] = new PromiseEmitter();
            return upEmitters[event];
        },
        send : function(event, data) {
            if (downEmitters[event]) return downEmitters[event].emit(data);
            else return Promise.resolve();
        }
    };
    this.bottom = {
        on : function(event) {
            if (!downEmitters[event]) downEmitters[event] = new PromiseEmitter();
            return downEmitters[event];
        },
        send : function(event, data) {
            if (upEmitters[event]) return upEmitters[event].emit(data);
            else return Promise.resolve();
        }
    }
}

module.exports = Pipe;