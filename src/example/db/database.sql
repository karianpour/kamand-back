--CREATE USER kamand WITH ENCRYPTED PASSWORD 'kamand';

--create database kamand encoding = 'utf8' lc_collate = 'fa_IR.utf8' template template0;
--GRANT ALL PRIVILEGES ON DATABASE kamand TO kamand;

-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

drop table if exists article;
drop table if exists voucher;
drop type if exists voucher_types;
drop table if exists acc;

create table acc (
  id uuid primary key not null,
  parent_id uuid not null,
  code text not null,
  name text not null,
  level int not null,
  leaf boolean not null,
  created_at timestamptz
);

insert into acc (id, parent_id, code, name, level, leaf, created_at) 
  values 
  ('937c662e-0f07-4a91-a407-bae9e98639f1', '937c662e-0f07-4a91-a407-bae9e98639f1', '11', 'دارایی', 1, false, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f2', '937c662e-0f07-4a91-a407-bae9e98639f2', '12', 'بدهی', 1, false, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f3', '937c662e-0f07-4a91-a407-bae9e98639f3', '13', 'هزینه', 1, false, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f4', '937c662e-0f07-4a91-a407-bae9e98639f4', '14', 'درآمد', 1, true, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f5', '937c662e-0f07-4a91-a407-bae9e98639f1', '1101', 'جاری', 2, false, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f6', '937c662e-0f07-4a91-a407-bae9e98639f5', '110101', 'بانک', 3, true, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f7', '937c662e-0f07-4a91-a407-bae9e98639f1', '1102', 'صندوق', 2, true, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f8', '937c662e-0f07-4a91-a407-bae9e98639f2', '1201', 'هزینه', 2, true, now()),
  ('937c662e-0f07-4a91-a407-bae9e98639f9', '937c662e-0f07-4a91-a407-bae9e98639f2', '1202', 'درآمد', 2, true, now());

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



/*
drop trigger if exists long_task_update on long_task;
drop table if exists long_task;
drop function long_task_update_notify;
*/

create table long_task (
  id uuid primary key not null,
  title text not null,
  created_at timestamptz null,
  progress int null,
  finished_at timestamptz null
);

create or replace function long_task_update_notify() returns trigger as $$
declare
  id text;
  old_id text;
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    id = NEW.id::text;
  end if;
  if tg_op = 'DELETE' or tg_op = 'UPDATE' then
    old_id = OLD.id::text;
  end if;
  perform pg_notify('long_task_update', json_build_object('id', id, 'old_id', old_id, 'type', tg_op)::text);
  return null;
end;
$$ language plpgsql;

create trigger long_task_update after insert or update or delete on long_task for each row execute procedure long_task_update_notify();

