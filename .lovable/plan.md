
# Plano: Tornar a Plataforma Pede Direto Totalmente Funcional

## Visão Geral

A plataforma tem a interface visual pronta, mas precisa de backend real para funcionar. Atualmente usa dados mock estáticos e não persiste nenhuma informação.

## Fase 1: Criar Base de Dados

Criar as tabelas necessárias na base de dados com segurança RLS:

```text
+------------------+       +-------------------+       +------------------+
|     zones        |       |    restaurants    |       |   suggestions    |
+------------------+       +-------------------+       +------------------+
| id (uuid)        |<----->| zone_id (uuid)    |       | id (uuid)        |
| name (text)      |       | name (text)       |       | city_name (text) |
| slug (text)      |       | slug (text)       |       | email (text)     |
| is_active (bool) |       | logo_url (text)   |       | message (text)   |
| created_at       |       | images (text[])   |       | created_at       |
| updated_at       |       | category (text)   |       +------------------+
+------------------+       | description       |
                           | schedule_weekdays |
+------------------+       | schedule_weekend  |       +------------------+
|    profiles      |       | delivery_zones    |       |   user_roles     |
+------------------+       | cta_website       |       +------------------+
| id (uuid)        |       | cta_whatsapp      |       | id (uuid)        |
| email (text)     |       | cta_phone         |       | user_id (uuid)   |
| created_at       |       | cta_app           |       | role (enum)      |
+------------------+       | is_featured       |       +------------------+
                           | is_active (bool)  |
                           | display_order     |
                           | created_at        |
                           | updated_at        |
                           +-------------------+
```

**Policies RLS:**
- Leitura pública para restaurantes e zonas ativas
- Escrita restrita a utilizadores com role "admin"

## Fase 2: Sistema de Autenticação Admin

Criar página de login em `/admin/login`:

- Campo de email e password
- Validação com zod
- Autenticação via Supabase Auth
- Redirecionamento automático após login
- Proteção da rota `/admin` para utilizadores autenticados com role "admin"

**Nota sobre "admin123":** Por segurança, não é possível usar senhas fixas no código. Em vez disso:
1. Criarei um utilizador admin inicial
2. A password poderá ser definida através do registo ou reset de password

## Fase 3: Funcionalidades do Backoffice

### 3.1 Gestão de Restaurantes
- Formulário funcional para adicionar/editar restaurantes
- Guardar na base de dados real
- Campo is_active para ativar/desativar
- Upload de imagens (opcional - pode usar URLs)
- Botões editar e remover funcionais

### 3.2 Gestão de Zonas
- Criar/editar/remover zonas
- Associar restaurantes a zonas
- Ativar/desativar zonas

### 3.3 Sistema de Destaques
- Toggle para marcar como destaque
- Campo de ordem/prioridade
- Guardar alterações na base de dados

## Fase 4: Melhorias no Frontend

### 4.1 Pesquisa por Cidade/Morada
- Adicionar campo de pesquisa de texto na homepage
- Sugestões de cidades mais pesquisadas
- Autocomplete com zonas disponíveis

### 4.2 Persistência de Sessão
- Guardar cidade selecionada em localStorage
- Restaurar ao recarregar a página

### 4.3 Formulário de Sugestão
- Quando não há restaurantes numa zona
- Campos: nome da cidade, email, mensagem
- Guardar na tabela `suggestions`

## Fase 5: Integração Frontend com Base de Dados

- Substituir imports de `mockData.ts` por queries Supabase
- Criar hooks React Query para:
  - `useZones()` - listar zonas ativas
  - `useRestaurants(zoneId)` - restaurantes por zona
  - `useFeaturedRestaurants(zoneId)` - restaurantes em destaque
  - `useRestaurant(slug)` - detalhes do restaurante

---

## Detalhes Técnicos

### Tabelas a Criar

**1. zones**
```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**2. restaurants**
```sql
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  description TEXT,
  schedule_weekdays TEXT,
  schedule_weekend TEXT,
  delivery_zones TEXT[] DEFAULT '{}',
  cta_website TEXT,
  cta_whatsapp TEXT,
  cta_phone TEXT,
  cta_app TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**3. suggestions**
```sql
CREATE TABLE suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**4. profiles + user_roles** (para autenticação)

### Ficheiros a Criar/Modificar

| Ficheiro | Ação |
|----------|------|
| `src/pages/AdminLogin.tsx` | Criar - página de login |
| `src/hooks/useAuth.tsx` | Criar - contexto de autenticação |
| `src/hooks/useZones.ts` | Criar - query para zonas |
| `src/hooks/useRestaurants.ts` | Criar - query para restaurantes |
| `src/components/CitySearch.tsx` | Criar - pesquisa por cidade |
| `src/components/SuggestionForm.tsx` | Criar - formulário de sugestão |
| `src/pages/AdminPage.tsx` | Modificar - integrar com BD |
| `src/pages/Index.tsx` | Modificar - usar hooks reais |
| `src/App.tsx` | Modificar - adicionar rotas e proteção |

### Estimativa de Trabalho

1. **Base de dados + RLS:** 1 migração
2. **Autenticação:** 2-3 ficheiros
3. **Backoffice funcional:** 4-5 ficheiros
4. **Frontend melhorado:** 3-4 ficheiros

---

## Resultado Final

Após implementação:
- Base de dados persistente com todas as tabelas
- Login admin funcional (não com "admin123" fixo, mas com autenticação real)
- CRUD completo de restaurantes e zonas
- Pesquisa por cidade com campo de texto
- Formulário de sugestão para zonas sem restaurantes
- Sessão de cidade persistente durante navegação
- Controle de restaurantes ativos/inativos
- Sistema de destaques com ordem de exibição
