const moment = require('moment');
const centra = require('centra');
const ensure = require('jvar/utility/ensure');
const { format: _format } = require('jvar/fn');

const { camelCase, snakeCase } = require('change-case');
const { forOwn: _forOwn, isObject: _isObject } = require('lodash');

const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
const url = 'https://log.zytekaron.com/';

const _req = Symbol('_req');
const _make = Symbol('_make');
const _print = Symbol('_print');

module.exports = class Logger {
    constructor(service, auth) {
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
        });
    }

    // prototypes
    fatal(message, ...args) {
    }

    error(message, ...args) {
    }

    warn(message, ...args) {
    }

    info(message, ...args) {
    }

    debug(message, ...args) {
    }

    trace(message, ...args) {
    }

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

    count() {
        return this[_req]('GET', url + 'count');
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

    async [_req](method, url, body = null) {
        const res = await centra(url, method)
            .header('Authorization', this.auth)
            .body(convertCase(body, snakeCase), 'json')
            .send();
        const text = await res.text();
        if (text.startsWith('Forbidden')) {
            throw new Error('Forbidden: No API token');
        }
        if (text.startsWith('Unauthorized')) {
            throw new Error('Unauthorized: Bad API token');
        }
        return convertCase(JSON.parse(text), camelCase);
    }

    [_print](level, { id = '???', message, createdAt = Date.now() } = {}) {
        if (levels.indexOf(level) <= levels.indexOf(this.level)) {
            const time = moment(createdAt).format('MM/DD/YY hh:mm:ss');

            console.log(`[${time} ${id}] ${level}:`, message);
        }
    }

    [_make](level) {
        return async (format, ...data) => {
            ensure.type(format, 'string');
            const message = _format(format, ...data);

            const { service } = this;
            try {
                const res = await this[_req]('POST', url, { level, service, message });
                if (!res.success) {
                    this[_print](level, { message });
                    return { message, service, error: res.error };
                }

                this[_print](level, res.data);

                return res.data;
            } catch (err) {
                this[_print](level, { message });
                return { message, service, level, error: err.toString() };
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
