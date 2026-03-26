import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { BASE_URL } from '../config/config.js';
import { getToken } from '../config/auth.js';

const dadosJson = new SharedArray('clientes', function () {
    return [JSON.parse(open('../../data/get/dados.json'))];
})[0];

export const options = {
    scenarios: {
        visualizacoes_diarias: {
            executor: 'ramping-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 10,
            maxVUs: 50,
            stages: [
                { target: 10, duration: '1m' },
                { target: 10, duration: '5m' },
                { target: 0, duration: '1m' },
            ],
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% das requisições devem ser < 500ms
        http_req_failed: ['rate<0.01'],   // Menos de 1% de erro
    },
};

export function setup() {
    const token = getToken();
    if (!token) throw new Error("Falha ao obter token no setup");
    return { token };
}

export default function (data) {
    const listaClientes = dadosJson.clientes;
    const cliente = listaClientes[Math.floor(Math.random() * listaClientes.length)];
    const url = `${BASE_URL}${dadosJson.clientesPath}`;

    const payload = JSON.stringify({
        cpfCnpj: cliente.cpfCnpj
    });

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.request('GET', url, payload, params);

    check(res, {
        'status é 200': (r) => r.status === 200,
        'corpo contém dados': (r) => r.body.includes('numCli'),
    });
}