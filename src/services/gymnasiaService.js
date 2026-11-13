// Модул: gymnasiaService
// Описание: Данни за приема след VII клас (public.gymnasium_classes / gymnasium_rankings).
//   Заявките са по кампания/етап, за да стоят под лимита на PostgREST от 1000 реда.
// Експорти: gymnasiaService.getLatestYear, getClasses, getStage1, getSchoolRankings

import { supabase } from "@/lib/supabase";

const CLASS_COLS = "class_code, school_code, school_name, district, class_name, kind, formula_raw, coefficients, alt_formulas, " +
    "nvo_bel_coef, nvo_mat_coef, ability_exam, diploma_subjects, places, places_m, places_f, quota, first_language, language_mode";

export const gymnasiaService = {
    /** Последната кампания с данни за региона. */
    async getLatestYear(region = "София-град") {
        const { data, error } = await supabase
            .from("gymnasium_classes").select("campaign_year").eq("region", region)
            .order("campaign_year", { ascending: false }).limit(1);
        if (error) throw error;
        return data?.[0]?.campaign_year ?? null;
    },

    /** Всички паралелки за една кампания (София: ~400 реда). */
    async getClasses(year, region = "София-град") {
        const { data, error } = await supabase
            .from("gymnasium_classes").select(CLASS_COLS)
            .eq("campaign_year", year).eq("region", region)
            .order("school_name").order("class_name");
        if (error) throw error;
        return data || [];
    },

    /** Минимални балове от 1-ви етап за няколко години (по една заявка на година). */
    async getStage1(years, region = "София-град") {
        const parts = await Promise.all(years.map(async (y) => {
            const { data, error } = await supabase
                .from("gymnasium_rankings").select("campaign_year, class_code, school_code, class_name, min_total, max_total")
                .eq("campaign_year", y).eq("region", region).eq("stage", 1);
            if (error) throw error;
            return data || [];
        }));
        return parts.flat();
    },

    /** Всички етапи и години за едно училище (за детайлите на паралелка). */
    async getSchoolRankings(schoolCode, region = "София-град") {
        const code = String(schoolCode || "").slice(0, 20);
        if (!code) return [];
        const { data, error } = await supabase
            .from("gymnasium_rankings").select("campaign_year, stage, class_code, class_name, min_total, max_total, published_on")
            .eq("school_code", code).eq("region", region)
            .order("campaign_year", { ascending: false }).order("stage");
        if (error) throw error;
        return data || [];
    },
};
