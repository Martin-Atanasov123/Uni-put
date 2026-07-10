export const ADMIN_TABLES = [
  {
    id: "universities",
    table: "universities",
    label: "Университети и специалности",
    primaryKey: "id",
    fields: [
      { id: "university_name", label: "Университет", type: "text", required: true },
      { id: "faculty", label: "Факултет", type: "text", required: true },
      { id: "specialty", label: "Специалност", type: "text", required: true },
      { id: "city", label: "Град", type: "text", required: true },
      { id: "education_level", label: "Степен на образование", type: "select", options: ["бакалавър", "магистър"], required: true },
      { id: "max_ball", label: "Макс. бал", type: "number", step: "0.01" },
      { id: "formula_description", label: "Формула (описание)", type: "text" },
      { id: "coefficients", label: "Коефициенти (JSON)", type: "json" },
      { id: "specialty_id", label: "Specialty ID (UUID)", type: "text" }
    ],
    defaultSort: { field: "university_name", direction: "asc" }
  },
  {
    id: "dormitories",
    table: "dormitories",
    label: "Общежития",
    primaryKey: "id",
    fields: [
      { id: "university_id", label: "Университет (ID или име)", type: "text" },
      { id: "block_number", label: "Блок №", type: "text", required: true },
      { id: "city", label: "Град", type: "text" },
      { id: "location_lat", label: "Локация Lat", type: "number", step: "0.000001" },
      { id: "location_lng", label: "Локация Lng", type: "number", step: "0.000001" },
      { id: "monthly_rent_avg", label: "Среден наем (месечно)", type: "number", step: "0.01" },
      { id: "deposit_amount", label: "Депозит", type: "number", step: "0.01" },
      { id: "condition_rating", label: "Оценка на състоянието", type: "number", step: "1" },
      { id: "has_private_bathroom", label: "Самостоятелна баня", type: "boolean" },
      { id: "is_renovated", label: "Реновиран", type: "boolean" },
      { id: "transport_lines", label: "Транспортни линии (масив)", type: "json" }
    ],
    defaultSort: { field: "block_number", direction: "asc" }
  },
  {
    id: "admission_min_scores",
    table: "admission_min_scores",
    label: "Минимални балове (класиране)",
    primaryKey: "id",
    fields: [
      { id: "university_id", label: "Запис от universities (UUID)", type: "text", required: true },
      { id: "year", label: "Година (КСК)", type: "number", step: "1", required: true },
      { id: "round", label: "Класиране (1/2/3, празно = финално)", type: "number", step: "1" },
      { id: "min_ball", label: "Мин. бал", type: "number", step: "0.01", required: true },
      { id: "quota", label: "Квота (жени/мъже, празно = обща)", type: "text" },
      { id: "source_url", label: "Източник (URL)", type: "text" }
    ],
    defaultSort: { field: "year", direction: "desc" }
  },
  {
    id: "admission_events",
    table: "admission_events",
    label: "Календар за прием (дати)",
    primaryKey: "id",
    fields: [
      { id: "university_name", label: "Университет (точно име от universities)", type: "text", required: true },
      { id: "city", label: "Град", type: "text" },
      { id: "event_type", label: "Тип събитие", type: "select", options: ["application", "exam", "ranking", "enrollment"], required: true },
      { id: "title", label: "Заглавие", type: "text", required: true },
      { id: "description", label: "Описание", type: "text" },
      { id: "start_date", label: "Начална дата (ГГГГ-ММ-ДД)", type: "date", required: true },
      { id: "end_date", label: "Крайна дата (празно = еднодневно)", type: "date" },
      { id: "is_confirmed", label: "Потвърдено", type: "boolean" },
      { id: "source_url", label: "Източник (URL)", type: "text" }
    ],
    defaultSort: { field: "start_date", direction: "asc" }
  }
];
