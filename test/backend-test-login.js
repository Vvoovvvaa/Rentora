import http from 'k6/http';
import { check, sleep } from 'k6';

const VUS = Number(__ENV.VUS || 1);

const BASE_URL = 'http://localhost:2000';

// Тестовый аккаунт
const EMAIL = __ENV.EMAIL;
const PASSWORD = __ENV.PASSWORD;

export const options = {
    vus: VUS,
    duration: '1m',

    thresholds: {
        http_req_failed: ['rate<0.01'],

        // Для login разрешим чуть больше времени,
        // потому что bcrypt специально тяжелый.
        http_req_duration: [
            'p(90)<500',
            'p(95)<1000',
        ],

        checks: ['rate>0.99'],
    },
};

export default function () {
    const payload = JSON.stringify({
        gmail: EMAIL,
        password: PASSWORD,
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },

        tags: {
            endpoint: 'auth-login',
        },

        timeout: '10s',
    };

    const res = http.post(
        `${BASE_URL}/auth/login`,
        payload,
        params
    );

    check(res, {
        'login status success': (r) =>
            r.status === 200 || r.status === 201,

        'login < 500ms': (r) =>
            r.timings.duration < 500,

        'login has body': (r) =>
            r.body && r.body.length > 0,
    });

    sleep(1);
}