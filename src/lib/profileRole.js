export function isAdminUser(user) {
    return user?.app_metadata?.role === "admin";
}

export function profileRoleLabel(user) {
    return isAdminUser(user) ? "Администратор" : "Кандидат-студент";
}
