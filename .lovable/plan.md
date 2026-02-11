
# Modulo "Importar por Fonte" (Scraping Assistido)

## Resumo

Criar um modulo no backoffice (aba Negocios) que permite ao admin importar negocios inativos a partir de fontes publicas pre-definidas (Guianet, UberEats, Bolt Food), usando scraping assistido via Firecrawl + IA para extrair dados estruturados.

## Pre-requisito: Firecrawl Connector

O projeto nao tem o conector Firecrawl configurado. Sera necessario conecta-lo primeiro para que a edge function tenha acesso a `FIRECRAWL_API_KEY`.

## Arquitetura

O fluxo sera:

1. **Frontend** (modal multi-step em BusinessesContent) -> chama edge function
2. **Edge Function** `scrape-businesses` -> usa Firecrawl para scraping + Lovable AI (Gemini) para extrair dados estruturados do markdown
3. **Frontend** -> mostra preview dos negocios extraidos -> ao confirmar, insere na tabela `businesses` via Supabase client

## Componentes a criar/alterar

### 1. Edge Function: `supabase/functions/scrape-businesses/index.ts`

- Recebe: `{ source, url, limit }` (max 50)
- Valida que o caller e admin (via `is_admin()` RPC)
- Valida que o dominio do URL corresponde a fonte escolhida:
  - `guianet` -> `guianet.pt`
  - `ubereats` -> `ubereats.com`
  - `bolt_food` -> `food.bolt.eu`
- Usa Firecrawl API para scraping do URL (formato markdown)
- Usa Lovable AI (Gemini Flash) para extrair dados estruturados do markdown:
  - nome, morada, cidade, telefone, whatsapp, email, website, nif
- Retorna array de negocios extraidos (ate ao limite)
- NAO insere na base de dados (apenas retorna para preview)

### 2. Componente: `src/components/admin/ImportBySourceDialog.tsx`

Modal com 4 passos:

**Passo 1 - Fonte:** Dropdown com Guianet, UberEats, Bolt Food

**Passo 2 - URL:** Campo de texto com validacao de dominio

**Passo 3 - Categoria:** Selecao de categoria (obrigatorio) e subcategoria (opcional) do Pede Direto

**Passo 4 - Preview:** Tabela com ate 50 negocios extraidos, com botoes Cancelar e Confirmar

Ao confirmar:
- Insere cada negocio na tabela `businesses` com:
  - `is_active = false`
  - `subscription_status = 'inactive'`
  - `commercial_status = 'nao_contactado'`
  - `registration_source = 'scraping_<fonte>'`
  - `subscription_plan = 'free'`
  - `is_featured = false`, `is_premium = false`
- Regista log de auditoria

### 3. Alteracao: `src/components/admin/BusinessesContent.tsx`

- Adicionar botao "Importar por Fonte" ao lado dos botoes existentes
- Importar e renderizar o `ImportBySourceDialog`

### 4. Config: `supabase/config.toml`

- Adicionar `[functions.scrape-businesses]` com `verify_jwt = false` (a funcao faz verificacao interna)

## Detalhes tecnicos

### Validacao de dominio (por fonte)

```text
guianet    -> URL deve conter "guianet.pt"
ubereats   -> URL deve conter "ubereats.com"
bolt_food  -> URL deve conter "food.bolt.eu"
```

### Edge Function - Fluxo interno

1. Validar admin (Authorization header -> `is_admin()` RPC)
2. Validar dominio vs fonte
3. Chamar Firecrawl scrape API (formato markdown)
4. Enviar markdown para Lovable AI (Gemini Flash) com prompt para extrair negocios em JSON
5. Retornar array de negocios extraidos

### Prompt IA (resumo)

Pedir ao modelo para extrair de um markdown uma lista de negocios com os campos: name, address, city, phone, whatsapp, email, website, nif. Retornar como JSON array. Campos nao encontrados como null.

### Seguranca

- Apenas admins (verificacao via RPC `is_admin()`)
- Limite de 50 negocios por operacao
- Fontes fechadas (whitelist de dominios)
- Nenhum utilizador criado, nenhum email enviado
- Registo de auditoria em `audit_logs`

### Extensibilidade

A configuracao de fontes sera um objeto/mapa simples no codigo:

```text
SOURCES = {
  guianet:   { label: "Guianet",    domain: "guianet.pt" },
  ubereats:  { label: "UberEats",   domain: "ubereats.com" },
  bolt_food: { label: "Bolt Food",  domain: "food.bolt.eu" },
}
```

Para adicionar uma nova fonte no futuro, basta adicionar uma entrada a este mapa.

## Ficheiros afetados

| Ficheiro | Acao |
|---|---|
| `supabase/functions/scrape-businesses/index.ts` | Criar |
| `src/components/admin/ImportBySourceDialog.tsx` | Criar |
| `src/components/admin/BusinessesContent.tsx` | Alterar (adicionar botao) |
| `supabase/config.toml` | Alterar (adicionar funcao) |
