CREATE TEMP TABLE seed AS
SELECT pg_read_file('/seed/seed.json')::jsonb AS dados;

INSERT INTO supervisores (id, nome)
SELECT s.id, s.nome
FROM seed, jsonb_to_recordset(dados -> 'supervisores') AS s (id TEXT, nome TEXT);

INSERT INTO vendedores (id, nome, supervisor_id, alcada_desconto_percentual)
SELECT v.id, v.nome, v.supervisor_id, v.alcada_desconto_percentual
FROM seed, jsonb_to_recordset(dados -> 'vendedores') AS v (
  id TEXT, nome TEXT, supervisor_id TEXT, alcada_desconto_percentual NUMERIC
);

INSERT INTO tabelas_preco (id, nome)
SELECT t.id, t.nome
FROM seed, jsonb_to_recordset(dados -> 'tabelas_preco') AS t (id TEXT, nome TEXT);

INSERT INTO clientes (
  id, nome_fantasia, razao_social, cnpj, vendedor_id, tabela_preco_id,
  limite_credito, credito_utilizado, cidade, uf
)
SELECT c.id, c.nome_fantasia, c.razao_social, c.cnpj, c.vendedor_id, c.tabela_preco_id,
  c.limite_credito, c.credito_utilizado, c.cidade, c.uf
FROM seed, jsonb_to_recordset(dados -> 'clientes') AS c (
  id TEXT, nome_fantasia TEXT, razao_social TEXT, cnpj TEXT, vendedor_id TEXT, tabela_preco_id TEXT,
  limite_credito NUMERIC, credito_utilizado NUMERIC, cidade TEXT, uf TEXT
);

INSERT INTO produtos (
  id, sku, ean, descricao, categoria, marca, unidade_venda,
  fator_embalagem, venda_somente_multiplo, ativo
)
SELECT p.id, p.sku, p.ean, p.descricao, p.categoria, p.marca, p.unidade_venda,
  p.fator_embalagem, p.venda_somente_multiplo, p.ativo
FROM seed, jsonb_to_recordset(dados -> 'produtos') AS p (
  id TEXT, sku TEXT, ean TEXT, descricao TEXT, categoria TEXT, marca TEXT, unidade_venda TEXT,
  fator_embalagem INTEGER, venda_somente_multiplo BOOLEAN, ativo BOOLEAN
);

INSERT INTO tabela_preco_itens (tabela_preco_id, produto_id, preco_unidade)
SELECT t ->> 'id', i.produto_id, i.preco_unidade
FROM seed,
  jsonb_array_elements(dados -> 'tabelas_preco') AS t,
  jsonb_to_recordset(t -> 'itens') AS i (produto_id TEXT, preco_unidade NUMERIC);

INSERT INTO pedidos (id, cliente_id, vendedor_id, status, criado_em)
SELECT p.id, p.cliente_id, p.vendedor_id, p.status::status_pedido, p.data::timestamptz
FROM seed, jsonb_to_recordset(dados -> 'pedidos_historico') AS p (
  id TEXT, cliente_id TEXT, vendedor_id TEXT, status TEXT, data TEXT
);

INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unidade, desconto_percentual)
SELECT p ->> 'id', i.produto_id, i.quantidade, i.preco_unidade, i.desconto_percentual
FROM seed,
  jsonb_array_elements(dados -> 'pedidos_historico') AS p,
  jsonb_to_recordset(p -> 'itens') AS i (
    produto_id TEXT, quantidade INTEGER, preco_unidade NUMERIC, desconto_percentual NUMERIC
  );
