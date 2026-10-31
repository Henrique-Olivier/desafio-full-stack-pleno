-- Lê o seed.json montado no container e insere direto, sem script em Node.
INSERT INTO produtos
SELECT *
FROM jsonb_to_recordset(pg_read_file('/seed/seed.json')::jsonb -> 'produtos') AS p (
  id TEXT, sku TEXT, ean TEXT, descricao TEXT, categoria TEXT, marca TEXT,
  unidade_venda TEXT, fator_embalagem INTEGER, venda_somente_multiplo BOOLEAN, ativo BOOLEAN
);
