import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { BASE_URL } from '../config/config.js';
import { getToken } from '../config/auth.js';

// Carregamento dos dados do JSON
const dadosJson = new SharedArray('clientes', function () {
    return [JSON.parse(open('../../data/get/dados.json'))];
})[0];

export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '10s', target: 0 }
    ],
};

export function setup() {
    const token = getToken();
    if (!token) {
        throw new Error("Falha ao obter token no setup");
    }
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

    sleep(1);
}