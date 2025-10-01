interface ProcessProgressBarProps {
  progress: number
}

export function ProcessProgressBar({ progress }: ProcessProgressBarProps) {
  return (
    <div className="mt-3">
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
