create table if not exists prediction_games (
    external_id text primary key,
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

create index if not exists idx_prediction_games_season_week_kickoff
on prediction_games (season_year, week, kickoff_time);

create index if not exists idx_prediction_games_status
on prediction_games (status);
