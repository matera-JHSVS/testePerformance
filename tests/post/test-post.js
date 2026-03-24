import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { getToken } from '../config/auth.js'; // Adicionado .js
import { BASE_URL } from '../config/config.js'; // Adicionado .js

// 1. Carregamento Seguro com SharedArray (melhor para memória)
const dadosJson = new SharedArray('massa de dados post', function () {
    // Ajustado para o caminho que vimos na sua estrutura de pastas
    return [JSON.parse(open('../../data/post/dados.json'))];
})[0];

export const options = {
    vus: 1,
    iterations: 5,
};

// 2. Setup centralizado (Gera o token uma vez e distribui)
export function setup() {
    const token = getToken();
    if (!token) throw new Error("Falha ao obter token para o POST");
    return { token };
}

export default function (data) {
    // 3. Lógica para pegar um cliente da lista
    // Usamos __ITER para percorrer a lista ou Math.random para sortear
    const lista = dadosJson.clientes;
    const cliente = lista[__ITER % lista.length];

    const url = `${BASE_URL}${dadosJson.clientesPath}`;

    // 4. Montagem do Payload
    const payload = JSON.stringify({
        numCompany: 1,
        taxId: cliente.taxId
    });

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`, // 'data.token' vem do setup
            'Content-Type': 'application/json',
        },
    };

    // 5. Execução do POST
    const res = http.post(url, payload, params);

    // Logs inteligentes
    if (res.status !== 200 && res.status !== 201) {
        console.warn(`[ERRO POST] Status: ${res.status} | Payload: ${payload}`);
        console.warn(`[RESPOSTA]: ${res.body}`);
    } else {
        console.log(`[SUCESSO] Cadastro realizado para TaxId: ${cliente.taxId || cliente.cpfCnpj}`);
    }

    // 6. Validações (Checks)
    check(res, {
        'Status Sucesso (200 ou 201)': (r) => r.status === 200 || r.status === 201,
        'Sem erro de duplicidade': (r) => r.status !== 400 && r.status !== 409,
    });

    sleep(1);
}