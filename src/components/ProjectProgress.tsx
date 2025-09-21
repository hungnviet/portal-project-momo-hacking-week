interface ProjectProgressProps {
  progress: number;
}

export default function ProjectProgress({ progress }: ProjectProgressProps) {
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
