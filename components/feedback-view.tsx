"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, AlertTriangle, MessageSquare, Send, TrendingUp, Award, Clock } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { type Task, type User, type Feedback, UserRole } from "@/types/task"
import { mockFeedback } from "@/data/mock-data"

interface FeedbackViewProps {
  tasks: Task[]
  users: User[]
  currentUser: User
}

export default function FeedbackView({ tasks, users, currentUser }: FeedbackViewProps) {
  const [feedback] = useState<Feedback[]>(mockFeedback)
  const [newFeedbackText, setNewFeedbackText] = useState("")
  const [newFeedbackType, setNewFeedbackType] = useState<"remark" | "gratitude">("gratitude")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [filterType, setFilterType] = useState<"all" | "remark" | "gratitude">("all")
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">("month")

  // Автоматические замечания за просрочки
  const automaticRemarks = useMemo(() => {
    return tasks
      .filter((task) => task.isOverdue && task.assigneeIds.length > 0)
      .map((task) => ({
        id: `auto-${task.id}`,
        type: "remark" as const,
        fromUserId: "system",
        toUserId: task.assigneeIds[0],
        taskId: task.id,
        message: `Автоматическое замечание: просрочка задачи "${task.title}"`,
        createdAt: new Date(),
        isAutomatic: true,
      }))
  }, [tasks])

  // Объединение обычных отзывов и автоматических замечаний
  const allFeedback = useMemo(() => {
    return [...feedback, ...automaticRemarks]
      .filter((item) => {
        if (filterType !== "all" && item.type !== filterType) return false

        if (filterPeriod !== "all") {
          const now = new Date()
          const itemDate = new Date(item.createdAt)
          const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)

          if (filterPeriod === "week" && daysDiff > 7) return false
          if (filterPeriod === "month" && daysDiff > 30) return false
        }

        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [feedback, automaticRemarks, filterType, filterPeriod])

  // Статистика по пользователям
  const userStats = useMemo(() => {
    return users
      .map((user) => {
        const userFeedback = allFeedback.filter((item) => item.toUserId === user.id)
        const gratitudes = userFeedback.filter((item) => item.type === "gratitude")
        const remarks = userFeedback.filter((item) => item.type === "remark")

        return {
          user,
          totalFeedback: userFeedback.length,
          gratitudes: gratitudes.length,
          remarks: remarks.length,
          score: gratitudes.length - remarks.length,
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [users, allFeedback])

  const handleSendFeedback = () => {
    if (!newFeedbackText.trim() || !selectedUserId) return

    // В реальном приложении здесь был бы API вызов
    console.log("Отправка отзыва:", {
      type: newFeedbackType,
      toUserId: selectedUserId,
      message: newFeedbackText,
      fromUserId: currentUser.id,
    })

    setNewFeedbackText("")
    setSelectedUserId("")
  }

  const getUserById = (id: string) => {
    if (id === "system") return { id: "system", name: "Система", avatar: "" }
    return users.find((u) => u.id === id)
  }

  const getRelatedTask = (taskId?: string) => {
    return taskId ? tasks.find((t) => t.id === taskId) : null
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Журнал замечаний и благодарностей</h2>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span className="text-sm text-gray-600">Всего записей: {allFeedback.length}</span>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Благодарности</p>
                <p className="text-2xl font-bold text-green-600">
                  {allFeedback.filter((f) => f.type === "gratitude").length}
                </p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Замечания</p>
                <p className="text-2xl font-bold text-red-600">
                  {allFeedback.filter((f) => f.type === "remark").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Автоматические</p>
                <p className="text-2xl font-bold text-orange-600">{allFeedback.filter((f) => f.isAutomatic).length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Лучший сотрудник</p>
                <p className="text-sm font-bold text-blue-600">{userStats[0]?.user.name || "Нет данных"}</p>
                <p className="text-xs text-gray-500">Рейтинг: {userStats[0]?.score || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Рейтинг сотрудников */}
      <Card>
        <CardHeader>
          <CardTitle>Рейтинг сотрудников</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userStats.slice(0, 5).map((stat, index) => (
              <div key={stat.user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-800"
                        : index === 1
                          ? "bg-gray-100 text-gray-800"
                          : index === 2
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={stat.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{stat.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{stat.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {stat.user.role === UserRole.DIRECTOR
                        ? "Директор"
                        : stat.user.role === UserRole.DEPARTMENT_HEAD
                          ? "Руководитель"
                          : "Сотрудник"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{stat.gratitudes}</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{stat.remarks}</span>
                  </div>
                  <Badge variant={stat.score >= 0 ? "default" : "destructive"}>
                    {stat.score >= 0 ? "+" : ""}
                    {stat.score}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Форма добавления отзыва */}
      {(currentUser.role === UserRole.DIRECTOR || currentUser.role === UserRole.DEPARTMENT_HEAD) && (
        <Card>
          <CardHeader>
            <CardTitle>Добавить отзыв</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select value={newFeedbackType} onValueChange={(value: any) => setNewFeedbackType(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gratitude">Благодарность</SelectItem>
                    <SelectItem value="remark">Замечание</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Выберите сотрудника" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.id !== currentUser.id)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder={`Напишите ${newFeedbackType === "gratitude" ? "благодарность" : "замечание"}...`}
                value={newFeedbackText}
                onChange={(e) => setNewFeedbackText(e.target.value)}
                rows={3}
              />

              <Button onClick={handleSendFeedback} disabled={!newFeedbackText.trim() || !selectedUserId}>
                <Send className="h-4 w-4 mr-2" />
                Отправить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Фильтры */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все записи</SelectItem>
            <SelectItem value="gratitude">Благодарности</SelectItem>
            <SelectItem value="remark">Замечания</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={(value: any) => setFilterPeriod(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все время</SelectItem>
            <SelectItem value="week">Неделя</SelectItem>
            <SelectItem value="month">Месяц</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список отзывов */}
      <div className="space-y-3">
        {allFeedback.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div>Записей не найдено</div>
              <div className="text-sm">Попробуйте изменить фильтры</div>
            </CardContent>
          </Card>
        ) : (
          allFeedback.map((item) => {
            const fromUser = getUserById(item.fromUserId)
            const toUser = getUserById(item.toUserId)
            const relatedTask = getRelatedTask(item.taskId)

            return (
              <Card
                key={item.id}
                className={`border-l-4 ${item.type === "gratitude" ? "border-l-green-500" : "border-l-red-500"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${item.type === "gratitude" ? "bg-green-100" : "bg-red-100"}`}>
                        {item.type === "gratitude" ? (
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{fromUser?.name}</span>
                          <span className="text-gray-400">→</span>
                          <span className="font-medium">{toUser?.name}</span>
                          {item.isAutomatic && (
                            <Badge variant="outline" className="text-xs">
                              Автоматически
                            </Badge>
                          )}
                        </div>

                        <p className="text-gray-700 mb-2">{item.message}</p>

                        {relatedTask && (
                          <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                            Связанная задача: <span className="font-medium">{relatedTask.title}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 ml-4">
                      {format(new Date(item.createdAt), "d MMM, HH:mm", { locale: ru })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
