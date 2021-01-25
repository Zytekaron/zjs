const moment = require('moment');
const centra = require('centra');
const ensure = require('jvar/utility/ensure');

const { camelCase, snakeCase } = require('change-case');
const {
    forOwn: _forOwn,
    isObject: _isObject
} = require('lodash');

const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
const url = 'https://log.zytekaron.com/';

const _req = Symbol('_req');
const _make = Symbol('_make');
const _print = Symbol('_print');

module.exports = class Logger {
    constructor(service = 'Unknown Service', auth = process.env.ZYTEKARON_AUTH) {
        this.setLevel();

        Object.assign(this, {
            service,
            auth,
            fatal: this[_make]('FATAL'),
            error: this[_make]('ERROR'),
            warn: this[_make]('WARN'),
            info: this[_make]('INFO'),
            debug: this[_make]('DEBUG'),
            trace: this[_make]('TRACE')
        })
    }

    // prototypes
    fatal(message, data) {}
    error(message, data) {}
    warn(message, data) {}
    info(message, data) {}
    debug(message, data) {}
    trace(message, data) {}

    setLevel(level = 'INFO') {
        level = level.toUpperCase();
        if (!levels.includes(level)) {
            throw new Error(`Invalid log level '${level}`);
        }
        this.level = level;
    }

    get(id) {
        ensure.type(id, 'string');
        return this[_req]('GET', url + id);
    }

    find(limit = 100, offset = 0) {
        ensure.integer(limit, offset);
        return this[_req]('GET', `${url}?limit=${limit}&offset=${offset}`);
    }

    delete(id) {
        ensure.type(id, 'string');
        return this[_req]('DELETE', url + id);
    }

    patch(id, body) {
        ensure.type(id, 'string');
        ensure.defined(body);
        return this[_req]('PATCH', url + id, body);
    }

    async _req(method, url, body = null) {
        const res = await centra(url, method)
            .header('Authorization', this.auth)
            .body(convertCase(body, snakeCase))
            .send();
        const json = await res.json();
        return convertCase(json, camelCase);
    }

    [_print](level, { id = '???', message, data, createdAt = Date.now() } = {}) {
        if (levels.indexOf(level) <= levels.indexOf(this.level)) {
            const time = moment(createdAt).format('MM/DD/YY hh:mm:ss');

            console.log(`[${time} ${id}] ${level}:`, message);
            console.log('->', data);
        }
    }

    [_make](level) {
        return async (message, data) => {
            ensure.type(message, 'string');

            const { service } = this;
            try {
                const res = await this._req('POST', url, { level, service, message, data });
                if (!res.success) {
                    this[_print](level, { message, data });
                    return { error: res.error };
                }

                const obj = Object.assign(res.data, {
                    message, data
                });
                this[_print](level, obj);

                return obj;
            } catch (err) {
                this[_print](level, { message, data });
                return { error: err.toString() };
            }
        };
    }
};

function convertCase(obj, converter) {
    _forOwn(obj, (value, key) => {
        const newKey = converter(key);
        obj[newKey] = value;
        if (key !== newKey) {
            delete obj[key];
        }

        if (_isObject(value)) {
            return convertCase(value, converter);
        }
    });

    return obj;
}
