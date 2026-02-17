export const ADMIN_TABLES = [
  {
    id: "university_admissions",
    table: "university_admissions",
    label: "Университети и специалности",
    primaryKey: "id",
    fields: [
      { id: "university_name", label: "Университет", type: "text", required: true },
      { id: "faculty", label: "Факултет", type: "text", required: true },
      { id: "specialty", label: "Специалност", type: "text", required: true },
      { id: "city", label: "Град", type: "text", required: true },
      { id: "min_ball_2024", label: "Мин. бал 2024", type: "number", step: "0.01" },
      { id: "formula_description", label: "Формула", type: "text" },
      { id: "coefficients", label: "Коефициенти (JSON)", type: "json" }
    ],
    defaultSort: { field: "university_name", direction: "asc" }
  },
  {
    id: "dormitories",
    table: "dormitories",
    label: "Общежития",
    primaryKey: "id",
    fields: [
      { id: "name", label: "Име на общежитие", type: "text", required: true },
      { id: "university_id", label: "ID на университет", type: "number" },
      { id: "price", label: "Цена", type: "number", step: "1" },
      { id: "conditions", label: "Условия", type: "text" },
      { id: "location", label: "Локация (JSON)", type: "json" }
    ],
    defaultSort: { field: "name", direction: "asc" }
  }
];

