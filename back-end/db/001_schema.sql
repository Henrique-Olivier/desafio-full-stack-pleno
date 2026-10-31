CREATE TABLE produtos (
  id                     TEXT PRIMARY KEY,
  sku                    TEXT NOT NULL,
  ean                    TEXT NOT NULL, -- sem UNIQUE: o seed tem EAN repetido (P009 e P023)
  descricao              TEXT NOT NULL,
  categoria              TEXT NOT NULL,
  marca                  TEXT NOT NULL,
  unidade_venda          TEXT NOT NULL,
  fator_embalagem        INTEGER NOT NULL CHECK (fator_embalagem > 0),
  venda_somente_multiplo BOOLEAN NOT NULL,
  ativo                  BOOLEAN NOT NULL
);
