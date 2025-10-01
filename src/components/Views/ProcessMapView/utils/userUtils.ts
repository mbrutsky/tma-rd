import { UserRole } from "@/src/lib/models/types"


export const getPositionText = (role: UserRole) => {
  switch (role) {
    case UserRole.DIRECTOR:
      return "Директор"
    case UserRole.DEPARTMENT_HEAD:
      return "Руководитель отдела"
    case UserRole.EMPLOYEE:
      return "Специалист"
    default:
      return "Сотрудник"
  }
}