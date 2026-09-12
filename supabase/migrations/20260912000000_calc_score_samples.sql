-- Анонимна статистика на баловете (CLAUDE.md §16, точка 9 от роудмапа).
-- Калкулаторът показва „Балът ти е по-висок от X% от изчисленията за тази
-- програма в УниПът" САМО при ≥20 различни браузъра за програмата в текущата
-- академична година. НЕ е „X% като теб влязоха" — данни за приема нямаме.
--
-- Не пазим user_id, IP или имейл. browser_token е случаен uuid от localStorage:
-- един ред на браузър (новият бал презаписва стария) и изтриване при отказ.
--
-- Таблицата е заключена (RLS, само админ чете); публичният достъп е през
-- RPC-тата по-долу. Прагът 20 е тук, не в клиента — под него не излиза нищо.
--
-- Apply: Supabase Dashboard → SQL Editor, или `supabase db push`.

CREATE TABLE IF NOT EXISTS calc_score_samples (
    program_id    uuid NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    academic_year text NOT NULL,
    browser_token uuid NOT NULL,
    score         numeric(7,2) NOT NULL CHECK (score > 0),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (program_id, academic_year, browser_token)
);

CREATE INDEX IF NOT EXISTS calc_score_samples_token_idx ON calc_score_samples (browser_token);

ALTER TABLE calc_score_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calc_samples_admin_read" ON calc_score_samples;
CREATE POLICY "calc_samples_admin_read"
    ON calc_score_samples FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

-- Записва/обновява бала на браузъра за до 50 програми. Годината идва от реда
-- на програмата, не от клиента; бал извън (0, max_ball] се игнорира.
CREATE OR REPLACE FUNCTION record_calc_scores(p_token uuid, p_items jsonb)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
    IF p_token IS NULL OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) > 50 THEN
        RETURN 0;
    END IF;
    INSERT INTO calc_score_samples (program_id, academic_year, browser_token, score, updated_at)
    SELECT DISTINCT ON (u.id) u.id, u.academic_year, p_token, round(x.score, 2), now()
      FROM jsonb_to_recordset(p_items) AS x(program_id uuid, score numeric)
      JOIN universities u ON u.id = x.program_id
     WHERE x.score > 0
       AND x.score <= COALESCE(u.max_ball, 10000)
     ORDER BY u.id
    ON CONFLICT (program_id, academic_year, browser_token)
    DO UPDATE SET score = EXCLUDED.score, updated_at = now();
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END $$;

-- Процентилен ранг на подадения бал сред останалите браузъри (собственият се
-- изключва). Връща ред само за програми с ≥20 браузъра.
CREATE OR REPLACE FUNCTION get_calc_percentiles(p_token uuid, p_items jsonb)
RETURNS TABLE (program_id uuid, n integer, pct_below integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT x.program_id,
           count(*)::integer,
           round(100.0 * (count(*) FILTER (WHERE s.score < x.score)
                          + 0.5 * count(*) FILTER (WHERE s.score = x.score)) / count(*))::integer
      FROM (
            SELECT DISTINCT ON (r.program_id) r.program_id, r.score
              FROM jsonb_to_recordset(
                       CASE WHEN jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) <= 50
                            THEN p_items ELSE '[]'::jsonb END
                   ) AS r(program_id uuid, score numeric)
           ) x
      JOIN universities u ON u.id = x.program_id
      JOIN calc_score_samples s ON s.program_id = u.id AND s.academic_year = u.academic_year
     WHERE p_token IS NULL OR s.browser_token <> p_token
     GROUP BY x.program_id, x.score
    HAVING count(*) >= 20;
$$;

-- Отказ: трие всички редове на браузъра. Идемпотентно.
CREATE OR REPLACE FUNCTION forget_calc_scores(p_token uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
    DELETE FROM calc_score_samples WHERE browser_token = p_token;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION record_calc_scores(uuid, jsonb) FROM public;
REVOKE ALL ON FUNCTION get_calc_percentiles(uuid, jsonb) FROM public;
REVOKE ALL ON FUNCTION forget_calc_scores(uuid) FROM public;
GRANT EXECUTE ON FUNCTION record_calc_scores(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_calc_percentiles(uuid, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION forget_calc_scores(uuid) TO anon, authenticated;
