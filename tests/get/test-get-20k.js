import http from 'k6/http';
import { check } from 'k6';
import { getToken } from '../config/auth.js';
import { BASE_URL } from '../config/config.js';

// --- CONFIGURAÇÃO ---
const TOTAL_REQUISICOES = 20000;

export const options = {
    scenarios: {
        carga_rápida_20k: {
            executor: 'shared-iterations',
            vus: 50,              // 50 usuários disparando em paralelo
            iterations: TOTAL_REQUISICOES,
            maxDuration: '10m',   // Tempo limite para completar as 20k
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.05'], // O teste falha se mais de 5% das requisições derem erro
        http_req_duration: ['p(95)<1000'], // 95% das requisições devem responder em menos de 1s
    },
};

// --- GERADOR DE DADOS DINÂMICO ---
// Esta função cria o dado baseado no número da iteração atual
function gerarCpfPorIteracao(iter) {
    // 1. Simula CPF Incompleto/Vazio a cada 100 iterações
    if (iter % 100 === 0) return "";

    // 2. Simula Duplicidade (repete um CPF fixo) a cada 50 iterações
    if (iter % 50 === 0) return "87404204771";

    // 3. Gera um CPF "único" incremental para os demais
    return `771${String(iter).padStart(8, '0')}`;
}

export function setup() {
    const token = getToken();
    if (!token) throw new Error("Falha no Token");
    return { token };
}

export default function (data) {
    // Pegamos o CPF baseado na iteração global do k6
    const cpfSorteado = gerarCpfPorIteracao(__ITER);

    const url = `${BASE_URL}/v2/clientes`; // Seu endpoint de visualização/venda

    // Payload individual (conforme o formato que funcionou no seu Postman)
    const payload = JSON.stringify({
        cpfCnpj: cpfSorteado
    });

    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // Requisição individual rápida
    const res = http.request('GET', url, payload, params);

    // Validações do Cenário
    check(res, {
        'Sucesso ou Validação Esperada': (r) => [200, 400, 422].includes(r.status),
        'Detectou Incompleto (400)': (r) => (cpfSorteado === "" ? r.status === 400 : true),
        'Corpo retornado': (r) => r.body.length > 0,
    });

    // Removido o sleep para máxima velocidade
}