var PromiseEmitter = require('promise-emitter');
var uuid = require('uuid').v4;

function Pipe() {
    var upEmitterDefault, downEmitterDefault;
    var upEmitters = {};
    var downEmitters = {};
    var upPromises = {};
    var downPromises = {};
    this.top = {
        on : function(topic) {
            if (!topic) {
                upEmitterDefault = new PromiseEmitter();
                return upEmitterDefault;
            }
            upEmitters[topic] = new PromiseEmitter();
            return upEmitters[topic];
        },
        send : function(topic, data, prevEvent, timeToLive) {
            data._topic = topic;
            data._context = (prevEvent && prevEvent._context) || uuid();
            if (downPromises[data._context]) {
                downPromises[data._context](data);
                delete downPromises[data._context];
            } else if (downEmitters[topic]) {
                downEmitters[topic].emit(data);
            } else {
                downEmitterDefault && downEmitterDefault.emit(data);
            }

            if (timeToLive && timeToLive < 0) return Promise.resolve();

            return new Promise(function(res, rej) {
                timeToLive = timeToLive || Pipe.defaultTimeToLive;
                upPromises[data._context] = res;
                setTimeout(function() {
                    if (upPromises[data._context]) {
                        delete upPromises[data._context];
                        rej(new Error('Response time out'));
                    }
                }, timeToLive);
            });
        }
    };
    this.bottom = {
        on : function(topic) {
            if (!topic) {
                downEmitterDefault = new PromiseEmitter();
                return downEmitterDefault;
            }
            downEmitters[topic] = new PromiseEmitter();
            return downEmitters[topic];
        },
        send : function(topic, data, prevEvent, timeToLive) {
            data._topic = topic;
            data._context = (prevEvent && prevEvent._context) || uuid();
            if (upPromises[data._context]) {
                upPromises[data._context](data);
                delete upPromises[data._context];
            } else if (upEmitters[topic]) {
                upEmitters[topic].emit(data);
            } else {
                upEmitterDefault && upEmitterDefault.emit(data);
            }

            if (timeToLive && timeToLive < 0) return Promise.resolve();

            return new Promise(function(res, rej) {
                timeToLive = timeToLive || Pipe.defaultTimeToLive;
                downPromises[data._context] = res;
                setTimeout(function() {
                    if (downPromises[data._context]) {
                        delete downPromises[data._context];
                        rej(new Error('Response time out'));
                    }
                }, timeToLive);
            });
        }
    };
}

Pipe.defaultTimeToLive = 10000;

module.exports = Pipe;