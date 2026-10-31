CREATE TYPE status_pedido AS ENUM ('Faturado', 'Cancelado', 'Enviado', 'AguardandoAprovacao');

CREATE TABLE supervisores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE vendedores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  supervisor_id TEXT NOT NULL REFERENCES supervisores (id),
  alcada_desconto_percentual NUMERIC(5,2) NOT NULL CHECK (alcada_desconto_percentual BETWEEN 0 AND 100)
);

CREATE TABLE tabelas_preco (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE clientes (
  id TEXT PRIMARY KEY,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  vendedor_id TEXT NOT NULL REFERENCES vendedores (id),
  tabela_preco_id TEXT REFERENCES tabelas_preco (id),
  limite_credito NUMERIC(12,2) NOT NULL CHECK (limite_credito >= 0),
  credito_utilizado NUMERIC(12,2) NOT NULL CHECK (credito_utilizado >= 0),
  cidade TEXT,
  uf CHAR(2)
);

CREATE TABLE produtos (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  ean TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  marca TEXT NOT NULL,
  unidade_venda TEXT NOT NULL,
  fator_embalagem INTEGER NOT NULL CHECK (fator_embalagem > 0),
  venda_somente_multiplo BOOLEAN NOT NULL,
  ativo BOOLEAN NOT NULL
);

CREATE TABLE tabela_preco_itens (
  tabela_preco_id TEXT NOT NULL REFERENCES tabelas_preco (id),
  produto_id TEXT NOT NULL REFERENCES produtos (id),
  preco_unidade NUMERIC(12,2) NOT NULL CHECK (preco_unidade >= 0),
  PRIMARY KEY (tabela_preco_id, produto_id)
);

CREATE TABLE pedidos (
  id TEXT PRIMARY KEY,
  cliente_id TEXT NOT NULL REFERENCES clientes (id),
  vendedor_id TEXT NOT NULL REFERENCES vendedores (id),
  status status_pedido NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pedido_itens (
  pedido_id TEXT NOT NULL REFERENCES pedidos (id),
  produto_id TEXT NOT NULL REFERENCES produtos (id),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unidade NUMERIC(12,2) NOT NULL CHECK (preco_unidade >= 0),
  desconto_percentual NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (desconto_percentual BETWEEN 0 AND 100),
  PRIMARY KEY (pedido_id, produto_id)
);
