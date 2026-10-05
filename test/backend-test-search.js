import http from 'k6/http';
import { check, sleep } from 'k6';

const VUS = Number(__ENV.VUS || 10);

export const options = {
    vus: VUS,
    duration: '1m',

    thresholds: {
        checks: ['rate>0.99'],
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<2000'],
    },
};

export default function () {
    const res = http.get('http://localhost:2000/search');

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response < 1 sec': (r) => r.timings.duration < 1000,
    });

    sleep(1);
}