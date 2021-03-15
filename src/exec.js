const centra = require('centra');

const url = 'https://executr.zytekaron.com/';

module.exports = class Executor {
    constructor(service, auth) {
        Object.assign(this, {
            service,
            auth
        });
    }

    async create(name, code = '') {
        const res = await centra(url, 'POST')
            .header('Authorization', this.auth)
            .body({ name, code }, 'json')
            .send();
        const data = await res.json();
        return assert(data);
    }

    async get(id) {
        const res = await centra(url + id, 'GET')
            .header('Authorization', this.auth)
            .send();
        const data = await res.json();
        return assert(data);
    }

    async update(id, { name, code }) {
        const res = await centra(url + id, 'PATCH')
            .header('Authorization', this.auth)
            .body({ name, code }, 'json')
            .send();
        const data = await res.json();
        return assert(data);
    }

    async delete(id) {
        const res = await centra(url + id, 'DELETE')
            .header('Authorization', this.auth)
            .send();
        const data = await res.json();
        return assert(data);
    }

    async invoke(id, args = []) {
        const res = await centra(url + id, 'POST')
            .header('Authorization', this.auth)
            .body({ id, args })
            .send();
        const data = await res.json();
        return assert(data);
    }

    async run(code, args = []) {
        const res = await centra(url + 'run', 'POST')
            .header('Authorization', this.auth)
            .body({ code, args })
            .send();
        const data = await res.json();
        return assert(data);
    }
}

function assert({ success, error, data }) {
    if (!success) {
        throw new Error(error);
    }
    return data;
}
