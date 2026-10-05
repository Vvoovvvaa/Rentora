import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

const searchDuration = new Trend('search_duration');
const meDuration = new Trend('me_duration');
const apiErrors = new Counter('api_errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '30s', target: 250 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 750 },
    { duration: '2m', target: 1000 },
    { duration: '30s', target: 0 },
  ],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: [
      'p(90)<500',
      'p(95)<1000',
    ],

    search_duration: ['p(95)<1000'],
    me_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:2000';

export function setup() {
  const email = __ENV.EMAIL;
  const password = __ENV.PASSWORD;

  if (!email || !password) {
    throw new Error(
      'EMAIL and PASSWORD environment variables are required',
    );
  }

  const response = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      gmail: email,
      password: password,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: '10s',
    },
  );

  const success =
    response.status === 200 ||
    response.status === 201;

  if (!success) {
    throw new Error(
      `Login failed: status=${response.status} body=${response.body}`,
    );
  }

  const body = response.json();

  if (!body.accessToken) {
    throw new Error('Login response does not contain accessToken');
  }

  return {
    token: body.accessToken,
  };
}

export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  const action = Math.random();

  // 70% пользователей смотрят/ищут недвижимость
  if (action < 0.7) {
    const response = http.get(
      `${BASE_URL}/search`,
      {
        headers,
        timeout: '10s',
      },
    );

    searchDuration.add(response.timings.duration);

    const ok = check(response, {
      'search status success': (r) =>
        r.status === 200,
    });

    if (!ok) {
      apiErrors.add(1);
    }
  }

  // 30% заходят в профиль
  else {
    const response = http.get(
      `${BASE_URL}/user/me`,
      {
        headers,
        timeout: '10s',
      },
    );

    meDuration.add(response.timings.duration);

    const ok = check(response, {
      'user me status success': (r) =>
        r.status === 200,
    });

    if (!ok) {
      apiErrors.add(1);
    }
  }

  // Реальный человек не отправляет API-запрос
  // каждую миллисекунду.
  sleep(3 + Math.random() * 7);
}