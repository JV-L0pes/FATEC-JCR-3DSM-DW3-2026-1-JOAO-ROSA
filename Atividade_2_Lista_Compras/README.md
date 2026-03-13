# Lista de Compras - CRUD (TypeScript + MongoDB)

Atividade 2 - Desenvolvimento Web III: CRUD de lista de compras com backend em TypeScript, Express, Mongoose e frontend em HTML/CSS/JS.

## Estrutura do Projeto

```
Atividade_2_Lista_Compras/
├── public/           # Frontend estático
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── src/
│   ├── config/
│   │   └── database.ts    # Conexão MongoDB
│   ├── models/
│   │   └── ShoppingItem.ts # Modelo Mongoose (coleção shoppingitems)
│   ├── routes/
│   │   └── shoppingItemRoutes.ts # Rotas da API
│   └── server.ts          # Entrada da aplicação
├── package.json
├── tsconfig.json
└── README.md
```

## Banco de Dados (MongoDB)

- **Banco:** `shopping-list`
- **Coleção:** `shoppingitems`

Campos do documento:
- `name` (string, obrigatório)
- `quantity` (number, padrão 1)
- `unit` (string, padrão "un")
- `purchased` (boolean, padrão false)
- `createdAt` / `updatedAt` (timestamps)

## Pré-requisitos

- Node.js (v18+)
- MongoDB rodando localmente (ou URI em variável de ambiente)

## Instalação

```bash
cd Atividade_2_Lista_Compras
npm init -y
npm install express mongoose cors body-parser
npm install --save-dev typescript ts-node @types/cors @types/express @types/node @types/mongoose ts-node-dev
npx tsc --init
```

(O `tsconfig.json` já foi ajustado com as opções necessárias.)

## Como rodar

1. **Subir o MongoDB** (ex.: MongoDB Compass ou `mongod`).

2. **Desenvolvimento** (TypeScript direto, sem build):
   ```bash
   npm run dev
   ```
   Ou com reinício automático ao alterar arquivos:
   ```bash
   npm run dev:watch
   ```

3. **Produção** (compilar e executar):
   ```bash
   npm run build
   npm start
   ```

4. Acesse: **http://localhost:3000**

## API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/items` | Lista todos os itens |
| GET | `/api/items/:id` | Busca um item por ID |
| POST | `/api/items` | Cria novo item |
| PUT | `/api/items/:id` | Atualiza item |
| PATCH | `/api/items/:id/toggle` | Alterna status comprado/não comprado |
| DELETE | `/api/items/:id` | Remove item |

## Variáveis de ambiente (opcional)

- `PORT` – porta do servidor (padrão: 3000)
- `MONGODB_URI` – URI do MongoDB (padrão: `mongodb://localhost:27017/shopping-list`)

Exemplo com `.env`:
```
MONGODB_URI=mongodb://localhost:27017/shopping-list
PORT=3000
```
