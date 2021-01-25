const centra = require('centra');
const ensure = require('jvar/utility/ensure');
const {
    forOwn: _forOwn,
    isObject: _isObject
} = require('lodash');

const url = 'https://log.zytekaron.com/';

const _make = Symbol('_make');

module.exports = class Logger {
    constructor(auth = process.env.ZYTEKARON_AUTH) {
        this.auth = auth;

        const make = this[_make];
        Object.assign(this, {
            fatal: make('FATAL'),
            error: make('ERROR'),
            warn: make('WARN'),
            info: make('INFO'),
            debug: make('DEBUG'),
            trace: make('TRACE')
        });
    }

    get(id) {
        ensure.type(id, 'string');
        return this._req('GET', url + id);
    }

    find(limit = 100, offset = 0) {
        ensure.integer(limit, offset);
        return this._req('GET', `${url}?limit=${limit}&offset=${offset}`);
    }

    delete(id) {
        ensure.type(id, 'string');
        return this._req('DELETE', url + id);
    }

    patch(id, body) {
        ensure.type(id, 'string');
        ensure.defined(body);
        return this._req('PATCH', url + id, body);
    }

    async _req(method, url, body = null) {
        const res = await centra(url, method)
            .header('Authorization', this.auth)
            .body(toSnake(body))
            .send();
        const json = await res.json();
        return toCamel(json);
    }

    [_make](level) {
        return (service, message, data) => {
            ensure.type(service, 'string');
            ensure.type(message, 'string');

            return this._req('POST', url, { level, service, message, data });
        };
    }
};

function toCamel(obj) {
    _forOwn(obj, (value, key) => {
        if (key.includes('_')) {
            const cleanKey = key.replace(/_.?/g, ([, letter]) => letter?.toUpperCase());
            obj[cleanKey] = value;
            delete obj[key];
        }

        if (_isObject(value)) {
            return toCamel(value);
        }
    });

    return obj;
}

function toSnake(obj) {
    _forOwn(obj, (value, key) => {
        if (/[A-Z]/.test(key)) {
            const cleanKey = key.replace(/[A-Z]/g, letter => '_' + letter.toLowerCase());
            obj[cleanKey] = value;
            delete obj[key];
        }

        if (_isObject(value)) {
            return toSnake(value);
        }
    });

    return obj;
}
