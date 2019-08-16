CREATE USER kamand WITH ENCRYPTED PASSWORD 'kamand';

create database kamand encoding = 'utf8' lc_collate = 'fa_IR.utf8' template template0;
GRANT ALL PRIVILEGES ON DATABASE kamand TO kamand;

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table acc (
  id uuid primary key not null,
  code text not null,
  name text not null,
  created_at timestamptz
);

insert into acc (id, code, name, created_at) 
  values 
  ('937c662e-0f07-4a91-a407-bae9e98639f6', '11', 'دارایی', now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f7', '12', 'بدهی', now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f8', '13', 'هزینه', now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f9', '14', 'درآمد', now());

drop table if exists article;
drop table if exists voucher;
drop type if exists voucher_types;

create type voucher_types as enum ('normal', 'special');

create table voucher (
  id uuid primary key not null,
  voucher_no text not null,
  voucher_date date not null,
  voucher_type voucher_types not null,
  acc_id uuid not null references acc (id),
  registered boolean not null,
  amount decimal(15, 2) not null,
  refer text not null,
  remark text not null,
  created_at timestamptz
);

create table article (
  id uuid primary key not null,
  voucher_id uuid not null references voucher (id),
  article_no text not null,
  article_date date not null,
  acc_id uuid not null references acc (id),
  voucher_type voucher_types not null,
  registered boolean not null,
  amount decimal(15, 2) not null,
  refer text not null,
  remark text not null,
  created_at timestamptz
);



insert into voucher (
  id, voucher_no, voucher_date, voucher_type,
  acc_id, registered, amount, refer, remark, created_at
)
values (
  '937c662e-0f07-4a91-a407-bae9e98639f6', 1, '2019-08-15', 'normal',
  '937c662e-0f07-4a91-a407-bae9e98639f6', true, 120, 'ref', 'rem', now()
),(
  '937c662e-0f07-4a91-a407-bae9e98639f7', 2, '2019-08-15', 'normal',
  '937c662e-0f07-4a91-a407-bae9e98639f6', true, 120, 'ref', 'rem', now()
);


insert into article (
  id, voucher_id,
  article_no, article_date,
  acc_id, voucher_type, registered, amount,
  refer, remark, created_at
)
values (
  '937c662e-0f07-4a91-a407-bae9e98639f6', '937c662e-0f07-4a91-a407-bae9e98639f6',
  1, '2019-08-14',
  '937c662e-0f07-4a91-a407-bae9e98639f6', 'normal', true, 1000,
  'ref', 'rem', now()
),(
  '937c662e-0f07-4a91-a407-bae9e98639f7', '937c662e-0f07-4a91-a407-bae9e98639f6',
  2, '2019-08-14',
  '937c662e-0f07-4a91-a407-bae9e98639f8', 'normal', true, -1000,
  'ref', 'rem', now()
);

