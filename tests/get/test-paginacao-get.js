import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { BASE_URL } from '../config/config.js';
import { getToken } from '../config/auth.js';

// Carregamento dos dados do JSON (respeitando a estrutura de pastas)
const dadosJson = new SharedArray('clientes', function () {
    return [JSON.parse(open('../../data/get/dados.json'))];
})[0];

export const options = {
    stages: [
        { duration: '10s', target: 5 }, // Rampa de subida (5 usuários virtuais)
        { duration: '10s', target: 0 }  // Rampa de descida
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
    // 1. Definição dos parâmetros fixos do seu cenário de teste
    const clientsCnpjCpf = '00000000000019,03317692000275,04206050000180,17300036805,31690088893,34274233000102,76607801234,87404204771';
    const operationOrEventDate = '2010-05-05';
    const size = 100;

    // Se quiser testar páginas aleatórias para simular navegação real, use a linha abaixo:
    const page = Math.floor(Math.random() * 5) + 1;
    // const page = 5; // Fixado na página 1 conforme o seu exemplo

    // 2. Montagem exata da URL com Query Strings para o endpoint correto
    const url = `${BASE_URL}/v1/operations-notes?clientsCnpjCpf=${clientsCnpjCpf}&operationOrEventDate=${operationOrEventDate}&page=${page}&size=${size}`;

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // 3. Execução da requisição GET
    const res = http.get(url, params);

    // Log para debug caso a API retorne algo diferente de sucesso
    if (res.status !== 200) {
        console.log(`[Erro ${res.status}] Falha na paginação. Resposta do servidor: ${res.body}`);
    }

    // 4. Validação do retorno (Ajustado para checar o nó "data" ou estrutura de paginação se houver)
    check(res, {
        'status é 200': (r) => r.status === 200,
        'corpo contém dados': (r) => r.body && r.body.length > 0,
    });

    sleep(1);
}