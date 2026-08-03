insert into public.calendar_connections (email, provider)
select 'sid1612@gmail.com','google'
where not exists (select 1 from public.calendar_connections where email='sid1612@gmail.com');

insert into public.calendar_events (email, connection_id, external_id, title, starts_at, ends_at, attendee_count, is_recurring, source)
select 'sid1612@gmail.com', c.id, 'demo-'||g||'-'||i,
  (array['Weekly Team Standup','Product Strategy Review','1:1 with Manager','Client Discovery Call','Deep Work: Roadmap Draft','Design Critique','Sprint Planning','Quarterly Metrics Review','Focus Block: Writing','Cross-team Sync'])[i],
  (current_date + g + 1)::timestamptz + make_interval(hours => 8 + i*2),
  (current_date + g + 1)::timestamptz + make_interval(hours => 8 + i*2, mins => 45),
  (array[6,4,2,3,1,5,8,7,1,9])[i], (i % 3 = 0), 'google'
from generate_series(0,5) g, generate_series(1,3) i,
  (select id from public.calendar_connections where email='sid1612@gmail.com' limit 1) c;