# Atividade 4 - WeatherApp

Aplicação web em TypeScript + Express para consulta de clima em tempo real utilizando a WeatherAPI.

## Requisitos

- Node.js 18+
- API Key gratuita da WeatherAPI

## Configuração

1. Copie o arquivo de ambiente:
   - `.env.example` para `.env`
2. Configure:
   - `WEATHER_API_KEY=sua_chave_api_weatherapi`
   - `PORT=3000`

## Execução

```bash
npm install
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Funcionalidades

- Busca do clima por cidade
- Exibição de cidade, país, temperatura, sensação térmica, umidade, condição e ícone
- Validação de busca vazia
- Tratamento para cidade não encontrada e falhas de requisição
