-- Module: identity — blocked-words check for free text (community posts, requirement.md v1.28 §14).
-- Same list as nicknames, matched per word: a blocked word equals one of the text's words, or a
-- word with its symbols removed ("f.u.c.k" → "fuck"). Unlike nicknames there is no "contained in"
-- check, so ordinary words such as "therapist" or "Glasshouse" are fine; the reserved names
-- (admin, official, …) are allowed in sentences.

create function identity.has_blocked_words(p_text text)
returns boolean
language sql stable set search_path = ''
as $$
  with tokens as (
    select t as raw, regexp_replace(t, '[^[:alpha:][:digit:]]', '', 'g') as squeezed
    from unnest(regexp_split_to_array(lower(coalesce(p_text, '')), '\s+')) t
  )
  select exists (
    select 1 from identity.blocked_words w
    where w.word not in ('admin', 'administrator', 'moderator', 'official', 'makecalgarytalk')
      and (w.word in (select squeezed from tokens)
           or w.word = any (regexp_split_to_array(lower(coalesce(p_text, '')), '[^[:alpha:][:digit:]]+')))
  )
$$;

revoke all on function identity.has_blocked_words(text) from public, anon, authenticated;
