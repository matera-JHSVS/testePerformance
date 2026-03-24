import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import {getToken} from "../config/auth";
import {BASE_URL} from "../config/config";

const dados = JSON.parse(open('../../data/dados.json'));
const endpoint = `${BASE_URL}${dados.clientesPath}`;

export const options = {
    vus: 1,
    iterations: 5
    // duration: '10s',
};

export function setup() {
    const token = getToken();
    return { token };
}

export default function () {

    const cliente = clientesExistentes[__ITER % clientesExistentes.length];

    const payload = JSON.stringify({
        "numCompany": 1,
        "taxId": cliente.taxId
    });

    const params = {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
    };

    const res = http.request("POST",endpoint, payload, params);

    console.log(`Status: ${res.status}, Body: ${res.status}`);
    console.log(`Status: ${res.status}, Body: ${res.body}`);


    check(res, {
        'Status 200': (r) => r.status === 200,
        'Não é erro de duplicidade': (r) => r.status !== 400 && r.status !== 409,
    });

    sleep(1);
}