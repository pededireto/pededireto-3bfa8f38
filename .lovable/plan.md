Ficha de Negocio Modular - Arquitetura SaaS

Resumo
Criar um sistema de modulos dinamicos paralelo a estrutura existente, permitindo ao admin definir campos extras para negocios sem alterar codigo. A tabela businesses e todos os seus campos permanecem intactos. Implementacao hibrida e incremental, preparada para evolucao futura (gallery estruturada, select real, modulos por plano, etc).

1. Base de Dados (Migracao SQL)

Criar tabela business_modules (definicao dos campos dinamicos):

Campo | Tipo | Notas
id | uuid PK | gen_random_uuid()
name | TEXT UNIQUE NOT NULL | identificador interno (ex: "facebook", "video_apresentacao")
label | TEXT NOT NULL | nome visivel no formulario
type | TEXT NOT NULL | text, textarea, url, image, gallery, video, boolean, select
section | TEXT NOT NULL | presenca_publica, dados_privados, marketing
is_public_default | BOOLEAN DEFAULT true | se aparece na pagina publica
is_required | BOOLEAN DEFAULT false | se e obrigatorio
is_active | BOOLEAN DEFAULT true | se esta ativo
order_index | INTEGER DEFAULT 0 | ordem de apresentacao
plan_restriction | TEXT NULL | null = todos os planos, ou business / consumer / plano especifico (preparacao futura)
options | JSONB NULL | usado para type=select (lista de opcoes)
created_at | TIMESTAMPTZ DEFAULT now()
updated_at | TIMESTAMPTZ DEFAULT now()

Indices:
(section)
(is_active)
(order_index)

Adicionar constraint CHECK para type com valores permitidos.

Criar tabela business_module_values (valores por negocio):

Campo | Tipo | Notas
id | uuid PK | gen_random_uuid()
business_id | uuid FK businesses(id) ON DELETE CASCADE
module_id | uuid FK business_modules(id) ON DELETE CASCADE
value | TEXT | valor simples (text, url, video, boolean)
value_json | JSONB NULL | usado para gallery ou estruturas futuras
created_at | TIMESTAMPTZ DEFAULT now()
updated_at | TIMESTAMPTZ DEFAULT now()

Indices:
(business_id)
(module_id)
UNIQUE(business_id, module_id)

Nota:

value continua para simplicidade

value_json prepara o sistema para gallery real e estruturas complexas

RLS:

business_modules:

SELECT publico apenas onde is_active=true

ALL para admins

commercial users apenas SELECT

business_module_values:

SELECT publico via join com modulo ativo e is_public_default=true

admins ALL

commercial users podem ler/escrever apenas onde business_id pertence ao seu utilizador

Triggers:
updated_at automatico em ambas as tabelas

2. Backoffice Admin - Nova aba "Configuracao da Ficha"

Ficheiro: src/components/admin/AdminSidebar.tsx

Adicionar "business-modules" ao tipo AdminTab
Novo item no menu: icone Puzzle (ou Settings2), label "Config. Ficha"

Ficheiro: src/pages/AdminPage.tsx

Importar e renderizar BusinessModulesContent

Novo ficheiro: src/hooks/useBusinessModules.ts

Query para listar todos os modulos (ordenados por section + order_index)
Mutation para criar modulo
Mutation para atualizar modulo (label, type, section, is_public_default, is_required, is_active, order_index, plan_restriction, options)
Mutation para eliminar modulo (apenas se nao tiver valores associados)
Query para listar valores de um negocio (business_module_values com join business_modules)
Mutation para gravar valores (upsert batch por business_id)

Novo ficheiro: src/components/admin/BusinessModulesContent.tsx

Tabela com:
Name, Label, Type, Section, Publico, Obrigatorio, Ativo, Ordem, Restricao Plano

Botao "Criar Modulo" abre dialogo com todos os campos
Se type = select, mostrar campo adicional para definir options (JSON simples de lista)
Botao editar em cada linha
Botao desativar (toggle is_active)
Botao eliminar apenas se nao existem valores associados (query count antes de permitir)
Filtro por section
Reordenacao via order_index (input numerico)

Importante:
Nao permitir alterar type de um modulo se ja existirem valores associados.

3. Ficha do Negocio - Renderizacao Dinamica dos Modulos

Ficheiro: src/components/admin/BusinessFileCard.tsx

Adicionar nova Section (bloco 8) apos "Auditoria":

Titulo: "Campos Adicionais"

Carregar modulos ativos via useBusinessModules
Filtrar modulos por plan_restriction (se aplicavel)
Carregar valores existentes via query a business_module_values
Agrupar modulos por section

Para cada modulo, renderizar input conforme type:

text -> Input
textarea -> Textarea
url -> Input type="url"
image -> Upload ou Input URL
gallery -> gerir array em value_json
video -> Input URL
boolean -> Switch
select -> Select com options (JSON)

Ao guardar o formulario:

Upsert batch dos valores alterados

Se gallery, guardar em value_json

Validar is_required=true antes de submit

Nao alterar logica existente do formulario.

4. Pagina Publica do Negocio - Renderizacao Dinamica

Ficheiro: src/pages/BusinessPage.tsx

Apos a seccao de horario, adicionar bloco condicional:

Carregar modulos onde:
is_active=true
is_public_default=true

Filtrar por plan_restriction se aplicavel
Carregar valores do negocio atual
Filtrar apenas modulos com valor preenchido

Agrupar por section (mostrar apenas presenca_publica)

Renderizar conforme tipo:

url -> link clicavel com icone
text / textarea -> texto simples
image -> imagem
gallery -> grelha de imagens (value_json)
video -> embed seguro
boolean -> badge/tag se true
select -> texto selecionado

Se nenhum modulo tiver valor, nao mostrar a seccao.

5. Performance e Boas Praticas

Nunca fazer query por modulo dentro de loop

Carregar todos os modulos ativos numa unica query

Carregar todos os valores do negocio numa unica query

Mapear em memoria

Garantir indices criados antes de usar em producao

6. Resumo de Ficheiros

Ficheiro | Acao
Migracao SQL | 2 tabelas, indices, constraints, RLS, triggers
src/hooks/useBusinessModules.ts | Novo - CRUD modulos + valores
src/components/admin/BusinessModulesContent.tsx | Novo - gestao de modulos
src/components/admin/AdminSidebar.tsx | Nova aba "business-modules"
src/pages/AdminPage.tsx | Renderizar BusinessModulesContent
src/components/admin/BusinessFileCard.tsx | Nova Section com campos dinamicos
src/pages/BusinessPage.tsx | Renderizacao publica dos modulos

7. O que NAO muda

Tabela businesses (zero alteracoes)
Campos existentes no BusinessFileCard (permanecem intactos)
Sistema de categorias, planos, subscricoes
SEO, layout publico, autenticacao
Logica de pesquisa e filtros
Todos os hooks e componentes existentes