create table if not exists prediction_games (
    external_id text primary key,
    game_key text,
    season_year integer not null,
    week integer not null,
    kickoff_time timestamptz not null,
    status text not null,
    venue text,
    broadcast text,
    source text not null,
    source_updated_at timestamptz not null,
    spread text,
    over_under numeric,
    home_team jsonb not null,
    away_team jsonb not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table prediction_games
add column if not exists game_key text;

update prediction_games
set game_key = concat_ws(
    '|',
    season_year::text,
    week::text,
    to_char(kickoff_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"'),
    upper(coalesce(home_team->>'abbreviation', home_team->>'external_id', home_team->>'display_name', home_team->>'name', 'UNKNOWN')),
    upper(coalesce(away_team->>'abbreviation', away_team->>'external_id', away_team->>'display_name', away_team->>'name', 'UNKNOWN'))
)
where game_key is distinct from concat_ws(
    '|',
    season_year::text,
    week::text,
    to_char(kickoff_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"'),
    upper(coalesce(home_team->>'abbreviation', home_team->>'external_id', home_team->>'display_name', home_team->>'name', 'UNKNOWN')),
    upper(coalesce(away_team->>'abbreviation', away_team->>'external_id', away_team->>'display_name', away_team->>'name', 'UNKNOWN'))
);

delete from prediction_games
where external_id in (
    select external_id
    from (
        select
            external_id,
            row_number() over (
                partition by game_key
                order by
                    case when source = 'seed' then 1 else 0 end asc,
                    source_updated_at desc,
                    updated_at desc,
                    external_id desc
            ) as row_rank
        from prediction_games
        where game_key is not null
    ) ranked_games
    where row_rank > 1
);

alter table prediction_games
alter column game_key set not null;

create unique index if not exists idx_prediction_games_game_key
on prediction_games (game_key);

create index if not exists idx_prediction_games_season_week_kickoff
on prediction_games (season_year, week, kickoff_time);

create index if not exists idx_prediction_games_status
on prediction_games (status);

create table if not exists prediction_picks (
    user_id uuid not null references public.users(id) on delete cascade,
    game_key text not null references prediction_games(game_key) on update cascade on delete cascade,
    season_year integer not null,
    week integer not null,
    game_external_id text,
    pick_side text not null check (pick_side in ('home', 'away')),
    picked_team jsonb not null,
    source text not null default 'flask-api',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    primary key (user_id, game_key)
);

alter table if exists prediction_picks
drop constraint if exists prediction_picks_game_key_fkey;

alter table if exists prediction_picks
add constraint prediction_picks_game_key_fkey
foreign key (game_key)
references prediction_games(game_key)
on update cascade
on delete cascade;

alter table if exists prediction_picks enable row level security;

grant select, insert, update, delete on table prediction_picks to authenticated;

drop policy if exists prediction_picks_select_own on prediction_picks;
create policy prediction_picks_select_own
on prediction_picks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists prediction_picks_insert_own on prediction_picks;
create policy prediction_picks_insert_own
on prediction_picks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists prediction_picks_update_own on prediction_picks;
create policy prediction_picks_update_own
on prediction_picks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists prediction_picks_delete_own on prediction_picks;
create policy prediction_picks_delete_own
on prediction_picks
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_prediction_picks_season_week
on prediction_picks (season_year, week, updated_at desc);

create index if not exists idx_prediction_picks_user
on prediction_picks (user_id, updated_at desc);
