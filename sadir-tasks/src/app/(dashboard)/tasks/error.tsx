"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
      <p className="text-2xl mb-2">⚠️</p>
      <h2 className="text-lg font-semibold text-gray-800 mb-2">حدث خطأ في تحميل المهام</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message}</p>
      <Button onClick={reset} variant="outline">
        حاول مجددًا
      </Button>
    </div>
  );
}
