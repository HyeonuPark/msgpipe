var PromiseEmitter = require('promise-emitter');
var uuid = require('uuid').v4;

function Pipe() {
    var upEmitterDefault, downEmitterDefault;
    var upEmitters = {};
    var downEmitters = {};
    var upFilters = {};
    var downFilters = {};
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
            if (downFilters[data._context]) {
                downFilters[data._context](data);
                delete downFilters[data._context];
            } else if (downEmitters[topic]) {
                downEmitters[topic].emit(data);
            } else {
                downEmitterDefault && downEmitterDefault.emit(data);
            }

            if (timeToLive && timeToLive < 0) return Promise.resolve();

            return new Promise(function(res, rej) {
                timeToLive = timeToLive || Pipe.defaultTimeToLive;
                upFilters[data._context] = res;
                setTimeout(function() {
                    if (upFilters[data._context]) {
                        delete upFilters[data._context];
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
            if (upFilters[data._context]) {
                upFilters[data._context](data);
                delete upFilters[data._context];
            } else if (upEmitters[topic]) {
                upEmitters[topic].emit(data);
            } else {
                upEmitterDefault && upEmitterDefault.emit(data);
            }

            if (timeToLive && timeToLive < 0) return Promise.resolve();

            return new Promise(function(res, rej) {
                timeToLive = timeToLive || Pipe.defaultTimeToLive;
                downFilters[data._context] = res;
                setTimeout(function() {
                    if (downFilters[data._context]) {
                        delete downFilters[data._context];
                        rej(new Error('Response time out'));
                    }
                }, timeToLive);
            });
        }
    };
}

Pipe.defaultTimeToLive = 10000;

module.exports = Pipe;