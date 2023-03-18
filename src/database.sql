create table users (
	id serial primary key,
	name text not null,
	email text not null unique,
	password text not null
);

Create table categories (
id serial primary key,
description text not null
);

Insert into categories (description) values
('Alimentação'),
('Assinaturas e Serviços'),
('Casa'),
('Mercado'),
('Cuidados Pessoais'),
('Educação'),
('Família'),
('Lazer'),
('Pets'),
('Presentes'),
('Roupas'),
('Saúde'),
('Transporte'),
('Salário'),
('Vendas'),
('Outras receitas'),
('Outras despesas');

Create table transactions (
id serial primary key,
description text not null,
value BIGINT NOT NULL,
date TIMESTAMPTZ NOT NULL,
category_id INTEGER NOT NULL REFERENCES categories(id),
user_id INTEGER NOT NULL REFERENCES users(id),
type text not null
);
