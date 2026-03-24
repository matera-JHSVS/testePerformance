import http from 'k6/http';
import { b64encode } from 'k6/encoding';
import { BASE_URL } from './config.js'; // Importa do seu config.js

// Definição do Path de Autenticação
const AUTH_PATH = '/oauth/token?grant_type=client_credentials';

// Credenciais (Tenta ler do ambiente, se não existir, usa o padrão do Postman)
const AUTH_USER = __ENV.AUTH_USER || 'sdopen';
const AUTH_PASS = __ENV.AUTH_PASS || '123';

export function getToken() {
    // 1. Criar a credencial Basic Auth (Base64 do usuário:senha)
    // No k6 usamos b64encode do módulo 'k6/encoding'
    const credentials = b64encode(`${AUTH_USER}:${AUTH_PASS}`);

    // 2. Montar a URL completa
    const url = `${BASE_URL}${AUTH_PATH}`;

    console.log(`[AUTH] Tentando login em: ${url}`);
    console.log(`[AUTH] Usuário utilizado: ${AUTH_USER}`);

    const params = {
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    // 3. Realizar o POST (Corpo vazio/null conforme seu Postman 'none')
    const res = http.post(url, null, params);

    // 4. Validação da Resposta
    if (res.status !== 200) {
        console.error(`[AUTH] ERRO NO LOGIN! Status: ${res.status}`);
        console.error(`[AUTH] CORPO DA RESPOSTA: ${res.body}`);
        return null;
    }

    const body = res.json();

    // 5. Extração do Token (Campo 'access_token' conforme sua imagem)
    if (!body.access_token) {
        console.error("[AUTH] ERRO: O campo 'access_token' não foi encontrado no JSON!");
        return null;
    }

    console.log(`[AUTH] Login realizado com sucesso! Token gerado.`);

    return body.access_token;
}