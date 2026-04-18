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
  }
];
